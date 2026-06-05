import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { attachUserIdToSession } from "@/lib/auth-session";
import { prismaAuthAdapter } from "@/lib/prisma-auth-adapter";

export const authOptions: NextAuthOptions = {
  adapter: prismaAuthAdapter(),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "database" },
  callbacks: {
    session({ session, user }) {
      return attachUserIdToSession(session, user);
    },
  },
  pages: { signIn: "/login" },
};
