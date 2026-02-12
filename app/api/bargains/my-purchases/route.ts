import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("secondme_session");

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    // Parse session to get userId
    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (e) {
      return NextResponse.json(
        { error: "无效的会话" },
        { status: 401 }
      );
    }

    const userId = session.userId || session.secondmeId;

    if (!userId) {
      return NextResponse.json(
        { error: "无效的用户信息" },
        { status: 401 }
      );
    }

    // Fetch completed bargain sessions where user was the bargainer
    const purchases = await prisma.bargainSession.findMany({
      where: {
        bargainerId: userId,
        status: 'completed',
      },
      include: {
        publisher: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    // Fetch product details for each bargain session
    const purchasesWithProducts = await Promise.all(
      purchases.map(async (bargain) => {
        const product = await prisma.product.findUnique({
          where: { id: bargain.productId },
          select: {
            id: true,
            title: true,
            imageUrl: true,
            publishPrice: true,
          },
        });

        return {
          id: bargain.id,
          productId: bargain.productId,
          product: product || {
            id: bargain.productId,
            title: '未知商品',
            imageUrl: '',
            publishPrice: 0,
          },
          finalPrice: bargain.finalPrice,
          completedAt: bargain.completedAt,
          publisher: bargain.publisher,
        };
      })
    );

    return NextResponse.json({
      purchases: purchasesWithProducts,
    });
  } catch (error) {
    console.error('[My Purchases API] Error:', error);
    return NextResponse.json(
      { error: "获取购买记录失败" },
      { status: 500 }
    );
  }
}
