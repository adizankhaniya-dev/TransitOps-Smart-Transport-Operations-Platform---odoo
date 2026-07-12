import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { listExpense, createExpense } from "@/server/services/expense.service";
import { expenseSchema } from "@/lib/validations/maintenance";

export const expenseRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return listExpense();
  }),

  create: protectedProcedure
    .input(expenseSchema)
    .mutation(async ({ input }) => {
      return createExpense(input);
    }),
});
