import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "../../prisma/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
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

        return {
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // Callback JWT - menambahkan role ke token
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    // Callback Session - menambahkan role ke session
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
