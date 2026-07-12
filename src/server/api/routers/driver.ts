import { createTRPCRouter, protectedProcedure, writeProcedure } from "../trpc";
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
  create: writeProcedure
    .input(createDriverSchema)
    .mutation(async ({ input, ctx }) => {
      return createDriver(input, ctx.user.boardId);
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return getDrivers(ctx.user.boardId);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return getDriverById(input.id, ctx.user.boardId);
    }),

  update: writeProcedure
    .input(
      z.object({
        id: z.string(),
        data: createDriverSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      return updateDriver(input.id, input.data, ctx.user.boardId);
    }),

  delete: writeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return deleteDriver(input.id, ctx.user.boardId);
    }),
});
