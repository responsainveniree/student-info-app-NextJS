import NextAuth from "next-auth";

export const { auth: authEdge } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnSignIn = nextUrl.pathname.startsWith("/sign-in");
      const isOnSignUp = nextUrl.pathname.startsWith("/sign-up");

      if (isOnSignIn || isOnSignUp) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      return isLoggedIn;
    },
  },
});
