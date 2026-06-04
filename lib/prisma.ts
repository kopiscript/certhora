import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) throw new Error("[prisma] DATABASE_URL is not set");
  // PrismaNeonHttp takes the URL directly and calls neon() internally
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaNeonHttp(connectionString, {} as any);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
