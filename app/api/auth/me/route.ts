import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("secondme_session");

    // 详细日志：记录 cookie 读取情况
    console.log('=== /api/auth/me 检查 ===');
    console.log('所有 cookies:', cookieStore.getAll());
    console.log('secondme_session cookie:', sessionCookie);
    console.log('请求 headers:', {
      cookie: request.headers.get('cookie'),
      host: request.headers.get('host'),
      origin: request.headers.get('origin'),
    });

    if (!sessionCookie) {
      console.log('❌ 未找到 secondme_session cookie');
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    console.log('✓ 成功解析 session:', { userId: session.userId, name: session.name });

    return NextResponse.json({ user: session });
  } catch (error) {
    console.error('❌ /api/auth/me 错误:', error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
