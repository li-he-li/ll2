import { NextRequest, NextResponse } from 'next/server';
import { getBargainSession } from '@/lib/bargain-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const session = await getBargainSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Bargain session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error fetching bargain session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bargain session' },
      { status: 500 }
    );
  }
}
