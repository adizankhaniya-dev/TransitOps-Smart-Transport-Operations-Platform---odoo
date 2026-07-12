import { withAuth } from "next-auth/middleware";

const authProxy = withAuth({
  pages: {
    signIn: "/login",
  },
});

export { authProxy as proxy };
export default authProxy;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
