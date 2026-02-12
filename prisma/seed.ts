import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create mock publisher user
  const publisher = await prisma.user.upsert({
    where: { secondmeId: 'mock-publisher-id' },
    update: {},
    create: {
      secondmeId: 'mock-publisher-id',
      accessToken: 'mock-access-token',
      name: 'Mock Publisher',
      email: 'publisher@example.com',
    },
  });
  console.log('✅ Created mock publisher:', publisher.name);

  // Create mock bargainer user
  const bargainer = await prisma.user.upsert({
    where: { secondmeId: 'mock-bargainer-id' },
    update: {},
    create: {
      secondmeId: 'mock-bargainer-id',
      accessToken: 'mock-access-token',
      name: 'Mock Bargainer',
      email: 'bargainer@example.com',
    },
  });
  console.log('✅ Created mock bargainer:', bargainer.name);

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
