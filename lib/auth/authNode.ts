import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "../../prisma/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) {
          throw new Error("Email and password are required");
        }

        let user;

        user = await prisma.student.findUnique({
          where: { email },
        });

        if (!user) {
          user = await prisma.teacher.findUnique({
            where: { email },
          });
        }

        if (!user) {
          throw new Error("User not found");
        }

        // cek password
        const isValid = await bcrypt.compare(password, user.password as string);

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return user;
      },
    }),
  ],
});
