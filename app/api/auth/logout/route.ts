import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("secondme_session");

    if (sessionCookie) {
      console.log('[Logout] Found session, deleting...');
    } else {
      console.log('[Logout] No session found');
    }

    // Delete the session cookie
    cookieStore.delete("secondme_session");

    console.log('[Logout] Session deleted successfully');

    return NextResponse.json({
      success: true,
      message: '已成功退出登录'
    });
  } catch (error) {
    console.error('[Logout] Error:', error);
    return NextResponse.json(
      { success: false, error: '退出登录失败' },
      { status: 500 }
    );
  }
}
