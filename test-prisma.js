import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('Prisma client methods:', Object.keys(prisma));
console.log('Review model available:', 'review' in prisma);

try {
  const reviews = await prisma.review.findMany();
  console.log('Reviews found:', reviews.length);
} catch (error) {
  console.error('Error accessing reviews:', error.message);
}

await prisma.$disconnect();
