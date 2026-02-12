import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// PrismaClient singleton with connection pooling for PostgreSQL
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prisma: PrismaClient;

if (process.env.DATABASE_URL?.startsWith('postgresql://') || process.env.DATABASE_URL?.startsWith('postgres://')) {
  // Use PostgreSQL adapter with connection pooling for production
  const adapter = new PrismaPg({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });
  prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
} else {
  // Use default Prisma Client for SQLite (development)
  prisma = globalForPrisma.prisma ?? new PrismaClient();
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { prisma };
