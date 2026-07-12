import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { listFuel, createFuel } from "@/server/services/fuel.service";
import { fuelSchema } from "@/lib/validations/maintenance";

export const fuelRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return listFuel();
  }),

  create: protectedProcedure
    .input(fuelSchema)
    .mutation(async ({ input }) => {
      return createFuel(input);
    }),
});
