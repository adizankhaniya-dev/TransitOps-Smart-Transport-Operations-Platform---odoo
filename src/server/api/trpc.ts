import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  let session = await getServerSession(authOptions);

  // If not authorized via next-auth, check iron-session
  if (!session || !session.user) {
    try {
      const ironSession = await getIronSession<SessionData>(await cookies(), sessionOptions);
      if (ironSession.isLoggedIn && ironSession.userId) {
        session = {
          user: {
            id: ironSession.userId,
            name: ironSession.name,
            email: ironSession.email,
            role: ironSession.role,
          }
        } as any;
      }
    } catch (e) {
      console.error("Error reading iron-session in tRPC context", e);
    }
  }

  return {
    db,
    session,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create();

const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: ctx.session,
    },
  });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
