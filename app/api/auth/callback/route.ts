import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 构建 x-www-form-urlencoded 请求体（SecondMe API 要求此格式）
function buildFormBody(data: Record<string, string>): string {
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&');
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // 详细日志：记录所有回调参数
  console.log('=== OAuth 回调触发 ===');
  console.log('请求 URL:', request.url);
  console.log('查询参数:', Object.fromEntries(searchParams.entries()));
  console.log('环境变量 NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('环境变量 NODE_ENV:', process.env.NODE_ENV);

  if (error) {
    console.error('OAuth 返回错误:', error);
    return NextResponse.redirect(new URL("/?error=" + error, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback`;

  console.log('OAuth 回调信息:', {
    code: code.substring(0, 20) + '...',
    redirectUri,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nodeEnv: process.env.NODE_ENV,
  });

  try {
    // 官方文档: POST https://app.mindos.com/gate/lab/api/oauth/token/code
    // Content-Type 必须为 application/x-www-form-urlencoded
    console.log('开始交换 access_token...');
    console.log(`使用 code: ${code.substring(0, 20)}...`);

    const tokenResponse = await fetch("https://app.mindos.com/gate/lab/api/oauth/token/code", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: buildFormBody({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.SECONDME_APP_ID!,
        client_secret: process.env.SECONDME_APP_SECRET!,
      }),
    });

    console.log(`Token 端点响应状态: ${tokenResponse.status}`);

    const tokenText = await tokenResponse.text();
    console.log(`Token 响应内容: ${tokenText.substring(0, 500)}`);

    let tokenResult: any;
    try {
      tokenResult = JSON.parse(tokenText);
    } catch {
      throw new Error('Token 端点返回的不是有效 JSON: ' + tokenText.substring(0, 200));
    }

    // SecondMe API 响应格式: { code: 0, data: { accessToken, refreshToken, ... } }
    if (tokenResult.code !== 0) {
      throw new Error('Token 交换失败: ' + JSON.stringify(tokenResult));
    }

    const tokens = tokenResult.data;

    // 注意: SecondMe 返回的字段是 camelCase: accessToken, refreshToken（不是 snake_case）
    if (!tokens || !tokens.accessToken) {
      throw new Error('Token 响应中没有 accessToken: ' + JSON.stringify(tokenResult));
    }

    console.log('✓ 成功获取 access_token!');
    console.log(`Token 信息:`, {
      hasAccessToken: !!tokens.accessToken,
      hasRefreshToken: !!tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: tokens.tokenType,
    });

    // 获取用户信息
    console.log('开始获取用户信息...');
    const userResponse = await fetch("https://app.mindos.com/gate/lab/api/secondme/user/info", {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    });

    console.log(`用户信息端点响应状态: ${userResponse.status}`);

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      throw new Error(`用户信息端点错误 ${userResponse.status}: ${errorText}`);
    }

    const userResult = await userResponse.json();
    console.log(`用户信息响应:`, userResult);

    // SecondMe API 响应格式: { code: 0, data: { ... } }
    if (userResult.code !== 0) {
      throw new Error('获取用户信息失败: ' + JSON.stringify(userResult));
    }

    const userInfo = userResult.data;
    // 注意: SecondMe 返回的用户 ID 字段名是 userId（不是 id）
    const secondmeId = userInfo.userId || userInfo.id;
    console.log(`✓ 成功获取用户信息:`, userInfo);

    const expiresAt = tokens.expiresIn ? Math.floor(Date.now() / 1000 + tokens.expiresIn) : undefined;

    // 保存到数据库
    console.log('保存用户信息到数据库...');
    await prisma.user.upsert({
      where: { secondmeId },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt * 1000) : null,
        name: userInfo.name,
        email: userInfo.email,
        image: userInfo.avatarUrl || userInfo.avatar,
      },
      create: {
        secondmeId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt * 1000) : null,
        name: userInfo.name,
        email: userInfo.email,
        image: userInfo.avatarUrl || userInfo.avatar,
      },
    });

    console.log(`✓ 用户信息已保存: ${secondmeId}`);

    // 设置 session 并重定向到 dashboard
    const response = NextResponse.redirect(new URL("/dashboard", request.url));

    // 设置 session cookie
    // 注意：同时设置 userId 和 secondmeId 确保兼容性
    response.cookies.set("secondme_session", JSON.stringify({
      userId: secondmeId,  // 兼容性：设置为 secondmeId
      secondmeId: secondmeId,  // 明确的 secondmeId
      accessToken: tokens.accessToken,
      name: userInfo.name,
      email: userInfo.email,
      image: userInfo.avatarUrl || userInfo.avatar,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expiresIn || 7200,
    });

    return response;
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(new URL("/?error=" + encodeURIComponent(error.message), request.url));
  }
}
