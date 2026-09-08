import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/signin",
  },
});

export const config = {
  // Hardens only these exact routes. Completely leaves your homepage and auth endpoints alone.
  matcher: ["/dashboard/:path*", "/reden/:path*"],
};