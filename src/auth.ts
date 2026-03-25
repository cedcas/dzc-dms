import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validators/auth";
import type { UserRole } from "@prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          console.log("[auth] Zod validation failed", parsed.error.flatten());
          return null;
        }

        const { email, password } = parsed.data;

        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          });
        } catch (e) {
          console.error("[auth] DB error", e);
          return null;
        }

        console.log("[auth] user lookup:", email, "found:", !!user);

        if (!user || !user.isActive) return null;

        const passwordMatch = await compare(password, user.password);
        console.log("[auth] password match:", passwordMatch);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
