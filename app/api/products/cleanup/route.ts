import { NextResponse } from 'next/server';
import { expireProducts } from '@/lib/product-service';

/**
 * POST /api/products/cleanup - Mark expired products
 * This endpoint should be called by a cron job or scheduled task
 */
export async function POST() {
  try {
    const count = await expireProducts();

    return NextResponse.json({
      message: 'Products expired',
      count,
    });
  } catch (error) {
    console.error('Error expiring products:', error);
    return NextResponse.json(
      { error: 'Failed to expire products' },
      { status: 500 }
    );
  }
}
