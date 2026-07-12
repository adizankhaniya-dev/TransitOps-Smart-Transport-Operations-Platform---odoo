import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { createVehicleSchema } from "@/lib/validations/vehicle";
import { createVehicle, getVehicles, updateVehicle, deleteVehicle } from "@/server/services/vehicle.service";
import { z } from "zod";
import { db } from "@/server/db";

export const vehicleRouter = createTRPCRouter({
  create: publicProcedure
    .input(createVehicleSchema)
    .mutation(async ({ input }) => {
      return createVehicle(input);
    }),

  list: publicProcedure.query(async () => {
    return getVehicles();
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.vehicle.findUnique({
        where: { id: input.id },
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

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: createVehicleSchema,
      })
    )
    .mutation(async ({ input }) => {
      return updateVehicle(input.id, input.data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return deleteVehicle(input.id);
    }),
});
