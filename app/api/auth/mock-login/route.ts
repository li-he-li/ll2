import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

/**
 * Mock login endpoint for development/testing
 * Sets a mock session cookie without requiring OAuth
 * Uses actual user from database to ensure foreign key constraints work
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  // Try to get the mock bargainer user from database
  // Use secondmeId since that's what we're using for identification
  const targetSecondmeId = body.user?.userId || 'mock-bargainer-id';

  let user = await prisma.user.findUnique({
    where: { secondmeId: targetSecondmeId },
  });

  // If user doesn't exist in database yet, create it
  if (!user) {
    console.log('[Mock Login] User not found, creating:', targetSecondmeId);
    user = await prisma.user.create({
      data: {
        secondmeId: targetSecondmeId,
        accessToken: 'mock-token',
        name: body.user?.name || 'Dev User',
        email: body.user?.email || 'dev@example.com',
      },
    });
    console.log('[Mock Login] Created user:', user);
  }

  console.log('[Mock Login] Found user:', user);

  const session = {
    userId: user.id, // Use the actual database ID (cuid)
    secondmeId: user.secondmeId,
    name: user.name,
    email: user.email,
    image: user.image,
  };

  const cookieStore = await cookies();
  cookieStore.set('secondme_session', JSON.stringify(session), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  return NextResponse.json({
    success: true,
    user: session,
    message: 'Mock login successful. You can now create bargain sessions and products.',
  });
}
