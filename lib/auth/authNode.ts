import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "../../db/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { notFound } from "../errors";
import { StaffPosition, StudentPosition } from "../constants/roles";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // For now, Prisma adapter is still unused, it doesn't have any functinality
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Credentials({
      name: "Credentials",
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: {
            email: email,
          },
          select: {
            id: true,
            email: true,
            password: true,
            name: true,
            role: true,
            teacherProfile: {
              select: {
                homeroom: true,
                staffRole: true,
              },
            },
            studentProfile: {
              select: {
                studentRole: true,
              },
            },
          },
        });

        if (!user) {
          throw notFound("Email or password are invalid");
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        let isHomeroom = false;
        if (user.role === "STAFF" && user.teacherProfile?.homeroom) {
          isHomeroom = true;
        }

        const actualRole =
          user.role === "STUDENT"
            ? (user.studentProfile?.studentRole as StudentPosition)
            : user.role === "STAFF"
              ? (user.teacherProfile?.staffRole as StaffPosition)
              : user.role;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: actualRole,
          isHomeroomClassTeacher: isHomeroom,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.isHomeroomClassTeacher = (user as any).isHomeroomClassTeacher;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.role = token.role as any;
        session.user.isHomeroomClassTeacher =
          token.isHomeroomClassTeacher as boolean;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
});
