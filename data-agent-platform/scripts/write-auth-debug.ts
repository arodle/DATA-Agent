const fs = require('fs');
const path = require('path');

const content = `import { getServerSession, signIn, signOut, type NextAuthOptions } from "next-auth";
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
        console.log('Authorize called with:', c?.email);
        if (!c?.email || !c?.password) return null;
        const u = await prisma.user.findUnique({ where: { email: c.email } });
        console.log('Found user:', u?.email, 'has password:', !!u?.password);
        if (!u?.password) return null;
        const valid = await bcrypt.compare(c.password, u.password);
        console.log('Password valid:', valid);
        if (!valid) return null;
        return { id: u.id, name: u.name, email: u.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      console.log('JWT callback, user:', user?.email, 'token:', token);
      if (user) { token.id = user.id; token.name = user.name; }
      return token;
    },
    session({ session, token }) {
      console.log('Session callback, token:', token);
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
`;

fs.writeFileSync(path.join(__dirname, '../src/auth.ts'), content, 'utf8');
console.log('auth.ts written with debug');