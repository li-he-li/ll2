import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getProductById, updateProduct, deleteProduct } from '@/lib/product-service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/products/[id] - Get product details
 * PUT /api/products/[id] - Update product (publisher only)
 * DELETE /api/products/[id] - Soft delete product (publisher only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    // Validate price if provided
    if (body.publishPrice !== undefined) {
      if (typeof body.publishPrice !== 'number' || body.publishPrice <= 0) {
        return NextResponse.json(
          { error: 'Valid publish price is required (positive number)' },
          { status: 400 }
        );
      }
    }

    // Validate title length if provided
    if (body.title !== undefined) {
      if (body.title.length < 2 || body.title.length > 100) {
        return NextResponse.json(
          { error: 'Title must be between 2 and 100 characters' },
          { status: 400 }
        );
      }
    }

    // Validate description length if provided
    if (body.description !== undefined && body.description !== null) {
      if (body.description.length > 500) {
        return NextResponse.json(
          { error: 'Description must be at most 500 characters' },
          { status: 400 }
        );
      }
    }

    // Validate duration if provided
    if (body.durationDays !== undefined) {
      if (![1, 7, 30].includes(body.durationDays)) {
        return NextResponse.json(
          { error: 'Duration must be 1, 7, or 30 days' },
          { status: 400 }
        );
      }
    }

    // Update product (will fail with 404 if not publisher)
    const product = await updateProduct(id, userId, body);

    return NextResponse.json({
      product,
      message: '商品已更新',
    });
  } catch (error: any) {
    console.error('Error updating product:', error);

    // Check if it's a Prisma record not found error
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: '无权编辑此商品' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Delete product (will fail with 404 if not publisher)
    const product = await deleteProduct(id, userId);

    return NextResponse.json({
      product,
      message: '商品已删除',
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);

    // Check if it's a Prisma record not found error
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: '无权删除此商品' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
