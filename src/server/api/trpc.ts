import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  let session = await getServerSession(authOptions);

  // If not authorized via next-auth or next-auth session is incomplete, check iron-session
  if (!session || !session.user || !(session.user as any).id) {
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

const isAuthed = t.middleware(async ({ next, ctx }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const userId = (ctx.session.user as { id?: string }).id;
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const user = await ctx.db.user.findUnique({
    where: { id: userId },
    select: { approved: true, blocked: true },
  });

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (user.blocked) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Your access has been blocked." });
  }

  if (!user.approved) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Your membership is pending approval." });
  }

  return next({
    ctx: {
      session: ctx.session,
      db: ctx.db,
    },
  });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
