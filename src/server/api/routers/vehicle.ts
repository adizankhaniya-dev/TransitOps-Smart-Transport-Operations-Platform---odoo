import { createTRPCRouter, protectedProcedure, writeProcedure } from "../trpc";
import { createVehicleSchema } from "@/lib/validations/vehicle";
import { createVehicle, getVehicles, updateVehicle, deleteVehicle } from "@/server/services/vehicle.service";
import { z } from "zod";

export const vehicleRouter = createTRPCRouter({
  create: writeProcedure
    .input(createVehicleSchema)
    .mutation(async ({ input, ctx }) => {
      return createVehicle(input, ctx.user.boardId);
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return getVehicles(ctx.user.boardId);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.vehicle.findFirst({
        where: { id: input.id, boardId: ctx.user.boardId },
        include: {
          trips: {
            include: {
              driver: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          maintenances: {
            orderBy: {
              openedAt: "desc",
            },
          },
          fuelLogs: {
            orderBy: {
              date: "desc",
            },
          },
          expenses: {
            orderBy: {
              date: "desc",
            },
          },
        },
      });
    }),

  update: writeProcedure
    .input(
      z.object({
        id: z.string(),
        data: createVehicleSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      return updateVehicle(input.id, input.data, ctx.user.boardId);
    }),

  delete: writeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return deleteVehicle(input.id, ctx.user.boardId);
    }),
});
