import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserProducts } from '@/lib/product-service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/products/mine - Get current user's products (all statuses)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('secondme_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    // 获取 publisherId
    // 注意：session.userId 可能是数据库cuid（Mock Login）或secondmeId（SecondMe OAuth）
    // 如果是secondmeId，需要先查询User表获取真正的数据库id
    let userId: string;
    const userIdValue = session.userId || session.secondmeId;

    if (!userIdValue) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 检查是否是cuid格式（数据库主键id）
    if (userIdValue.startsWith('c')) {
      // Mock Login：userId已经是数据库主键，直接使用
      userId = userIdValue;
    } else {
      // SecondMe OAuth：userId是secondmeId，需要查询User表获取真正的数据库id
      const user = await prisma.user.findUnique({
        where: { secondmeId: userIdValue },
        select: { id: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: '用户不存在，请重新登录' },
          { status: 401 }
        );
      }

      userId = user.id;
    }

    // Get status filter from query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'active' | 'expired' | 'deleted' | null;

    const products = await getUserProducts(userId, status || undefined);

    return NextResponse.json({
      products,
      count: products.length,
    });
  } catch (error) {
    console.error('Error fetching user products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
