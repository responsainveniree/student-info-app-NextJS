import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "../../prisma/prisma";
import bcrypt from "bcryptjs";
import { isStudentRole } from "@/lib/constants/roles";

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
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            homeroomTeacherId: true,
            password: true,
          },
        });

        if (!user) {
          user = await prisma.teacher.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              password: true,
            },
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
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          homeroomTeacherId: isStudentRole(user.role)
            ? (user as { homeroomTeacherId: string }).homeroomTeacherId
            : null,
        };
      },
    }),
  ],
  callbacks: {
    // Callback JWT - menambahkan role ke token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;

        if (isStudentRole(user.role as string)) {
          token.homeroomTeacherId = user.homeroomTeacherId;
        }
      }

      return token;
    },
    // Callback Session - menambahkan property ke session
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      if (isStudentRole(session.user.role)) {
        session.user.homeroomTeacherId = token.homeroomTeacherId as string;
      }
      return session;
    },
  },
});
