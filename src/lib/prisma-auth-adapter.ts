import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import prismaAuth from "@/lib/prisma-auth";

/**
 * PrismaAdapter uses session.delete(), which throws P2025 when the row is
 * already gone (stale cookie, double sign-out). deleteMany is idempotent.
 */
export function prismaAuthAdapter(): Adapter {
  const base = PrismaAdapter(prismaAuth);
  return {
    ...base,
    deleteSession: async (sessionToken) => {
      await prismaAuth.session.deleteMany({ where: { sessionToken } });
    },
  };
}
