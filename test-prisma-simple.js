// Test script to check Prisma client
import { PrismaClient } from '@prisma/client';

console.log('Starting Prisma test...');

const prisma = new PrismaClient();

console.log('Prisma client created');
console.log('Available models:', Object.keys(prisma));

// Test if review model exists
if ('review' in prisma) {
  console.log('✅ Review model found');
  try {
    const reviews = await prisma.review.findMany();
    console.log('✅ Reviews query successful:', reviews.length, 'reviews');
  } catch (error) {
    console.error('❌ Reviews query failed:', error.message);
  }
} else {
  console.error('❌ Review model not found');
  console.log('Available models:', Object.keys(prisma));
}

await prisma.$disconnect();
console.log('Test completed');
