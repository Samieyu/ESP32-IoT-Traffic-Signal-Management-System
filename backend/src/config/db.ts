import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export async function connectDatabase(): Promise<boolean> {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected successfully via Prisma');
    return true;
  } catch (error) {
    console.warn('⚠️ PostgreSQL connection failed or DATABASE_URL unreachable.');
    console.warn('ℹ️ Running in memory/mock persistence mode for local development/testing until PostgreSQL is provisioned.');
    return false;
  }
}
