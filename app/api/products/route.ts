import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createProduct, getActiveProducts } from '@/lib/product-service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/products - List all active products (for bargain hall)
 * POST /api/products - Create new product (auth required)
 */
export async function GET(request: NextRequest) {
  try {
    const products = await getActiveProducts();

    return NextResponse.json({
      products,
      count: products.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    let publisherId: string;
    const userIdValue = session.userId || session.secondmeId;

    if (!userIdValue) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 检查是否是cuid格式（数据库主键id）
    // cuid格式：以c开头，后面跟一串字符（如 cmlhy5njr0001v7dcyek8me23）
    if (userIdValue.startsWith('c')) {
      // Mock Login：userId已经是数据库主键，直接使用
      publisherId = userIdValue;
      console.log('[Create Product] Using Mock Login userId (DB primary key):', publisherId);
    } else {
      // SecondMe OAuth：userId是secondmeId，需要查询User表获取真正的数据库id
      const user = await prisma.user.findUnique({
        where: { secondmeId: userIdValue },
        select: { id: true },
      });

      if (!user) {
        console.error('[Create Product] User not found for secondmeId:', userIdValue);
        return NextResponse.json(
          { error: '用户不存在，请重新登录' },
          { status: 401 }
        );
      }

      publisherId = user.id;
      console.log('[Create Product] Using SecondMe OAuth userId (mapped to DB primary key):', publisherId);
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!body.publishPrice || typeof body.publishPrice !== 'number' || body.publishPrice <= 0) {
      return NextResponse.json(
        { error: 'Valid publish price is required (positive number)' },
        { status: 400 }
      );
    }

    if (!body.imageUrl || typeof body.imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    if (!body.durationDays || ![1, 7, 30].includes(body.durationDays)) {
      return NextResponse.json(
        { error: 'Duration must be 1, 7, or 30 days' },
        { status: 400 }
      );
    }

    // Validate title length
    if (body.title.length < 2 || body.title.length > 100) {
      return NextResponse.json(
        { error: 'Title must be between 2 and 100 characters' },
        { status: 400 }
      );
    }

    // Validate description length if provided
    if (body.description && body.description.length > 500) {
      return NextResponse.json(
        { error: 'Description must be at most 500 characters' },
        { status: 400 }
      );
    }

    // Create product
    console.log('[Create Product] Request body:', body);
    console.log('[Create Product] Publisher ID:', publisherId);

    const product = await createProduct({
      title: body.title,
      description: body.description || null,
      publishPrice: body.publishPrice,
      imageUrl: body.imageUrl,
      publisherId,
      category: body.category || null,
      durationDays: body.durationDays,
    });

    console.log('[Create Product] Created product:', product);

    return NextResponse.json(
      {
        product,
        message: '商品发布成功！',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);

    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
      });
    }

    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
