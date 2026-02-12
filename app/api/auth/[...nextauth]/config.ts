import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { OAuthConfig } from "next-auth/providers";
import { getAccessToken, getUserInfo } from "@/lib/secondme";

// 构建 x-www-form-urlencoded 请求体
function buildFormBody(data: Record<string, string>): string {
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&');
}

// 手动处理 SecondMe OAuth
async function handleSecondMeCallback(code: string) {
  // 官方文档: POST https://app.mindos.com/gate/lab/api/oauth/token/code
  // Content-Type 必须为 application/x-www-form-urlencoded
  const tokenResponse = await fetch("https://app.mindos.com/gate/lab/api/oauth/token/code", {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: buildFormBody({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback`,
      client_id: process.env.SECONDME_APP_ID!,
      client_secret: process.env.SECONDME_APP_SECRET!,
    }),
  });

  const tokenResult = await tokenResponse.json();

  if (tokenResult.code !== 0) {
    throw new Error('Token exchange failed: ' + JSON.stringify(tokenResult));
  }

  // 响应字段为 camelCase: accessToken, refreshToken, expiresIn, tokenType, scope
  const tokens = tokenResult.data;

  // 获取用户信息
  const userResponse = await fetch("https://app.mindos.com/gate/lab/api/secondme/user/info", {
    headers: {
      'Authorization': `Bearer ${tokens.accessToken}`,
    },
  });

  const userResult = await userResponse.json();

  if (userResult.code !== 0) {
    throw new Error('Get user info failed: ' + JSON.stringify(userResult));
  }

  const userInfo = userResult.data;
  // 注意: SecondMe 返回的用户 ID 字段名是 userId（不是 id）
  const secondmeId = userInfo.userId || userInfo.id;
  const expiresAt = tokens.expiresIn ? Math.floor(Date.now() / 1000 + tokens.expiresIn) : undefined;

  // 保存到数据库
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

  return {
    id: secondmeId,
    name: userInfo.name,
    email: userInfo.email,
    image: userInfo.avatarUrl || userInfo.avatar,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt,
  };
}

const SecondMeProvider: OAuthConfig<any> = {
  id: "secondme",
  name: "SecondMe",
  type: "oauth",
  authorization: {
    url: "https://go.second.me/oauth/",
    params: {
      response_type: "code",
      scope: "user.info",
    },
  },
  // 官方 token 端点
  token: "https://app.mindos.com/gate/lab/api/oauth/token/code",
  userinfo: "https://app.mindos.com/gate/lab/api/secondme/user/info",
  clientId: process.env.SECONDME_APP_ID,
  clientSecret: process.env.SECONDME_APP_SECRET,
  checks: ["pkce"],
  profile(profile: any) {
    return {
      id: profile.userId || profile.id,
      name: profile.name,
      email: profile.email,
      image: profile.avatarUrl || profile.avatar,
    };
  },
};

const config = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  providers: [SecondMeProvider],
  callbacks: {
    async jwt({ token, account, user }: any) {
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      }

      // 检查 token 是否过期
      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token;
      }

      // 刷新令牌 - 使用 camelCase 字段名
      if (token.refreshToken) {
        try {
          const { refreshAccessToken } = await import("@/lib/secondme");
          const refreshedTokens = await refreshAccessToken(token.refreshToken);

          return {
            ...token,
            accessToken: refreshedTokens.accessToken,
            refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
            expiresAt: Date.now() / 1000 + (refreshedTokens.expiresIn || 3600),
          };
        } catch (error) {
          return { ...token, error: "RefreshAccessTokenError" };
        }
      }

      return token;
    },
    async session({ session, token }: any) {
      session.user = {
        ...session.user,
        id: token.user?.id as string,
      };
      session.accessToken = token.accessToken as string;
      session.error = token.error as string;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
