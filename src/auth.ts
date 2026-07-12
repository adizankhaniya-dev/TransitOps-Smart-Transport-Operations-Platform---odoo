import Credentials from "next-auth/providers/credentials";
import { db } from "./server/db";
import bcrypt from "bcrypt";
import { z } from "zod";

export default Credentials({
  credentials: {
    email: {},
    password: {},
  },

  async authorize(credentials) {
    const parsed = z
      .object({
        email: z.string().email(),
        password: z.string(),
      })
      .safeParse(credentials);

    if (!parsed.success) {
      return null;
    }

    const { email, password } = parsed.data;

    const user = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) return null;

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) return null;

    return user;
  },
});
