import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const teamRouter = createTRPCRouter({
  
  // List all users in the same board (Admins only)
  list: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = await ctx.db.user.findUnique({
      where: { id: (ctx.session.user as any).id }
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Only board administrators can access team listings."
      });
    }

    return ctx.db.user.findMany({
      where: {
        boardId: currentUser.boardId,
        // Exclude the current admin from control actions
        id: { not: currentUser.id }
      },
      orderBy: { createdAt: "desc" }
    });
  }),

  // Approve a pending user request
  approve: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = await ctx.db.user.findUnique({
        where: { id: (ctx.session.user as any).id }
      });

      if (!currentUser || currentUser.role !== "ADMIN") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only board administrators can approve membership requests."
        });
      }

      return ctx.db.user.update({
        where: { id: input.id },
        data: { approved: true }
      });
    }),

  // Toggle user block status
  setBlockStatus: protectedProcedure
    .input(z.object({ id: z.string(), blocked: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = await ctx.db.user.findUnique({
        where: { id: (ctx.session.user as any).id }
      });

      if (!currentUser || currentUser.role !== "ADMIN") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only board administrators can block or unblock users."
        });
      }

      return ctx.db.user.update({
        where: { id: input.id },
        data: { blocked: input.blocked }
      });
    }),

  // Remove / delete a user
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = await ctx.db.user.findUnique({
        where: { id: (ctx.session.user as any).id }
      });

      if (!currentUser || currentUser.role !== "ADMIN") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only board administrators can remove users."
        });
      }

      return ctx.db.user.delete({
        where: { id: input.id }
      });
    })

});
