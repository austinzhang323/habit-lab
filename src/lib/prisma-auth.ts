import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { normalizePgSslMode } from "@/lib/pg-connection-string";

const globalForPrismaAuth = globalThis as unknown as {
  prismaAuth: PrismaClient | undefined;
};

function createPrismaAuthClient() {
  const rawUrl = process.env.DIRECT_DATABASE_URL;
  if (!rawUrl) {
    throw new Error("DIRECT_DATABASE_URL environment variable is not set.");
  }
  const connectionString = normalizePgSslMode(rawUrl);
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prismaAuth = globalForPrismaAuth.prismaAuth ?? createPrismaAuthClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrismaAuth.prismaAuth = prismaAuth;
}

export default prismaAuth;
