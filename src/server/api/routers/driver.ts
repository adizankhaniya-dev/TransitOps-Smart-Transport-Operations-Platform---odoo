import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { createDriverSchema } from "@/lib/validations/driver";
import {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
} from "@/server/services/driver.service";
import { z } from "zod";

export const driverRouter = createTRPCRouter({
  create: publicProcedure
    .input(createDriverSchema)
    .mutation(async ({ input }) => {
      return createDriver(input);
    }),

  getAll: publicProcedure.query(async () => {
    return getDrivers();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return getDriverById(input.id);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: createDriverSchema,
      })
    )
    .mutation(async ({ input }) => {
      return updateDriver(input.id, input.data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return deleteDriver(input.id);
    }),
});
