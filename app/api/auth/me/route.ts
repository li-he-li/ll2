import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("secondme_session");

    if (!sessionCookie) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    return NextResponse.json({ user: session });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
