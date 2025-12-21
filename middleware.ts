export { authEdge as middleware } from "@/lib/auth/authEdge";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sign-in, sign-up (auth pages)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sign-in|forgot-password|reset-password).*)",
  ],
};
