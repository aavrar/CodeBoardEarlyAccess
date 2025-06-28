
import { PrismaClient } from '@prisma/client';

// Declare a global variable for PrismaClient to prevent multiple instantiations in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Export a singleton PrismaClient instance
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
