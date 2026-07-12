import { createTRPCRouter, protectedProcedure, writeProcedure } from "../trpc";
import { listFuel, createFuel } from "@/server/services/fuel.service";
import { fuelSchema } from "@/lib/validations/maintenance";

export const fuelRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listFuel(ctx.user.boardId);
  }),

  create: writeProcedure
    .input(fuelSchema)
    .mutation(async ({ input, ctx }) => {
      return createFuel(input, ctx.user.boardId);
    }),
});
