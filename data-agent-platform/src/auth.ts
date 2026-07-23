import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "dev",
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/signin" },
  providers: [
    CredentialsProvider({
      name: "C",
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(c) {
        if (!c?.email || !c?.password) return null;
        const u = await prisma.user.findUnique({ where: { email: c.email } });
        if (!u?.password) return null;
        const valid = await bcrypt.compare(c.password, u.password);
        if (!valid) return null;
        return { id: u.id, name: u.name, email: u.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      session.user = {
        id: token.id as string,
        name: token.name as string,
        email: token.email as string,
      };
      return session;
    },
  },
};

export const auth = () => getServerSession(authOptions);
