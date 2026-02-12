import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createBargainSession } from '@/lib/bargain-service';
import { prisma } from '@/lib/prisma';

interface CreateBargainRequest {
  productId: string;
  publishPrice: number;
  targetPrice: number;
  publisherId: string;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('secondme_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    // 获取 bargainerId
    // 注意：session.userId 可能是数据库cuid（Mock Login）或secondmeId（SecondMe OAuth）
    // 如果是secondmeId，需要先查询User表获取真正的数据库id
    let bargainerId: string;
    const userIdValue = session.userId || session.secondmeId;

    if (!userIdValue) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 检查是否是cuid格式（数据库主键id）
    // cuid格式：以c开头，后面跟一串字符
    if (userIdValue.startsWith('c')) {
      // Mock Login：userId已经是数据库主键，直接使用
      bargainerId = userIdValue;
      console.log('[Bargain] Using Mock Login userId (DB primary key):', bargainerId);
    } else {
      // SecondMe OAuth：userId是secondmeId，需要查询User表获取真正的数据库id
      const user = await prisma.user.findUnique({
        where: { secondmeId: userIdValue },
        select: { id: true },
      });

      if (!user) {
        console.error('[Bargain] User not found for secondmeId:', userIdValue);
        return NextResponse.json(
          { error: '用户不存在，请重新登录' },
          { status: 401 }
        );
      }

      bargainerId = user.id;
      console.log('[Bargain] Using SecondMe OAuth userId (mapped to DB primary key):', bargainerId);
    }

    const body = await request.json();

    // For demo, we'll use a mock publisher ID
    // In production, this would come from the product owner
    const publisherId = body.publisherId || 'mock-publisher-id';

    const bargainSession = await createBargainSession({
      productId: body.productId,
      publisherId,
      bargainerId,
      publishPrice: body.publishPrice,
      targetPrice: body.targetPrice,
    });

    return NextResponse.json({
      sessionId: bargainSession.id,
      session: bargainSession,
    });
  } catch (error) {
    console.error('Error creating bargain session:', error);
    return NextResponse.json(
      { error: 'Failed to create bargain session' },
      { status: 500 }
    );
  }
}
