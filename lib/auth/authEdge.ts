import NextAuth from "next-auth";
import { getRoleDashboard } from "../constants/roles";

export const { auth: authEdge } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnSignIn = nextUrl.pathname.startsWith("/sign-in");

      if (isOnSignIn) {
        if (isLoggedIn) {
          return Response.redirect(
            new URL(getRoleDashboard(auth.user.role), nextUrl),
          );
        }
        return true;
      }

      return isLoggedIn;
    },
  },
});
