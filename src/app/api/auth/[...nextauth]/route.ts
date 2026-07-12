import NextAuth, { NextAuthOptions } from "next-auth";
import authProvider from "@/auth";

export const authOptions: NextAuthOptions = {
  providers: [authProvider],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
