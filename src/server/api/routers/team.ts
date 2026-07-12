import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { User } from "@prisma/client";
import type { createTRPCContext } from "../trpc";

type Ctx = Awaited<ReturnType<typeof createTRPCContext>> & { session: NonNullable<Awaited<ReturnType<typeof createTRPCContext>>["session"]> };

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  boardId: true,
  approved: true,
  blocked: true,
  createdAt: true,
} as const;

function getUserId(ctx: Ctx): string {
  return (ctx.session.user as { id: string }).id;
}

async function requireAdmin(ctx: Ctx) {
  const currentUser = await ctx.db.user.findUnique({
    where: { id: getUserId(ctx) },
  });

  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Only board administrators can perform this action.",
    });
  }

  return currentUser;
}

async function requireTargetOnBoard(ctx: Ctx, admin: User, targetId: string) {
  if (targetId === admin.id) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "You cannot perform this action on yourself.",
    });
  }

  const target = await ctx.db.user.findUnique({
    where: { id: targetId },
  });

  if (!target || target.boardId !== admin.boardId) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found on this board.",
    });
  }

  if (target.role === "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cannot modify another administrator.",
    });
  }

  return target;
}

export const teamRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = await requireAdmin(ctx as Ctx);

    const members = await ctx.db.user.findMany({
      where: {
        boardId: currentUser.boardId,
        id: { not: currentUser.id },
      },
      select: userSelect,
      orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
    });

    return {
      boardId: currentUser.boardId,
      members,
      pendingCount: members.filter((m) => !m.approved).length,
    };
  }),

  approve: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = await requireAdmin(ctx as Ctx);
      const target = await requireTargetOnBoard(ctx as Ctx, currentUser, input.id);

      if (target.approved) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is already approved.",
        });
      }

      return ctx.db.user.update({
        where: { id: input.id },
        data: { approved: true, blocked: false },
        select: userSelect,
      });
    }),

  reject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = await requireAdmin(ctx as Ctx);
      const target = await requireTargetOnBoard(ctx as Ctx, currentUser, input.id);

      if (target.approved) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot reject an approved member. Use remove instead.",
        });
      }

      return ctx.db.user.delete({
        where: { id: input.id },
        select: userSelect,
      });
    }),

  setBlockStatus: protectedProcedure
    .input(z.object({ id: z.string(), blocked: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = await requireAdmin(ctx as Ctx);
      await requireTargetOnBoard(ctx as Ctx, currentUser, input.id);

      return ctx.db.user.update({
        where: { id: input.id },
        data: { blocked: input.blocked },
        select: userSelect,
      });
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = await requireAdmin(ctx as Ctx);
      await requireTargetOnBoard(ctx as Ctx, currentUser, input.id);

      return ctx.db.user.delete({
        where: { id: input.id },
        select: userSelect,
      });
    }),
});
