import { prisma } from './prisma';

export type ProductStatus = 'active' | 'expired' | 'deleted';

export interface CreateProductInput {
  title: string;
  description?: string | null;
  publishPrice: number;
  imageUrl: string;
  publisherId: string;
  category?: string | null;
  durationDays: number;
}

export interface UpdateProductInput {
  title?: string;
  description?: string | null;
  publishPrice?: number;
  imageUrl?: string;
  category?: string | null;
  durationDays?: number;
}

export interface Product {
  id: string;
  title: string;
  description: string | null;
  publishPrice: number;
  imageUrl: string;
  publisherId: string;
  category: string | null;
  durationDays: number;
  expiresAt: Date;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
  publisher?: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

/**
 * Calculate expiration timestamp based on duration days
 */
function calculateExpiration(durationDays: number): Date {
  const now = Date.now();
  const msInDay = 24 * 60 * 60 * 1000;
  return new Date(now + durationDays * msInDay);
}

/**
 * Create a new product
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  const expiresAt = calculateExpiration(input.durationDays);

  const product = await prisma.product.create({
    data: {
      title: input.title,
      description: input.description,
      publishPrice: input.publishPrice,
      imageUrl: input.imageUrl,
      publisherId: input.publisherId,
      category: input.category,
      durationDays: input.durationDays,
      expiresAt,
      status: 'active',
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
  });

  return product as Product;
}

/**
 * Get all active products for bargain hall
 */
export async function getActiveProducts(): Promise<Product[]> {
  const now = new Date();

  const products = await prisma.product.findMany({
    where: {
      status: 'active',
      expiresAt: {
        gt: now,
      },
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
      createdAt: 'desc',
    },
  });

  return products as Product[];
}

/**
 * Get products by user ID
 */
export async function getUserProducts(userId: string, status?: ProductStatus): Promise<Product[]> {
  const where: any = {
    publisherId: userId,
  };

  if (status) {
    where.status = status;
  }

  const products = await prisma.product.findMany({
    where,
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
      createdAt: 'desc',
    },
  });

  return products as Product[];
}

/**
 * Get product by ID
 */
export async function getProductById(productId: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      publisher: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  return product as Product;
}

/**
 * Update product (publisher only)
 */
export async function updateProduct(
  productId: string,
  publisherId: string,
  input: UpdateProductInput,
): Promise<Product> {
  // Build update data with new expiration if duration changed
  const updateData: any = { ...input };

  if (input.durationDays !== undefined) {
    updateData.expiresAt = calculateExpiration(input.durationDays);
  }

  const product = await prisma.product.update({
    where: {
      id: productId,
      publisherId, // Ensure publisher ownership
    },
    data: updateData,
    include: {
      publisher: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return product as Product;
}

/**
 * Soft delete product (publisher only)
 */
export async function deleteProduct(productId: string, publisherId: string): Promise<Product> {
  const product = await prisma.product.update({
    where: {
      id: productId,
      publisherId, // Ensure publisher ownership
    },
    data: {
      status: 'deleted',
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
  });

  return product as Product;
}

/**
 * Expire products that have passed their expiration date
 */
export async function expireProducts(): Promise<number> {
  const now = new Date();

  const result = await prisma.product.updateMany({
    where: {
      status: 'active',
      expiresAt: {
        lte: now,
      },
    },
    data: {
      status: 'expired',
    },
  });

  return result.count;
}
