import { createTRPCRouter, protectedProcedure, writeProcedure } from "../trpc";
import { listExpense, createExpense } from "@/server/services/expense.service";
import { expenseSchema } from "@/lib/validations/maintenance";

export const expenseRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listExpense(ctx.user.boardId);
  }),

  create: writeProcedure
    .input(expenseSchema)
    .mutation(async ({ input, ctx }) => {
      return createExpense(input, ctx.user.boardId);
    }),
});
