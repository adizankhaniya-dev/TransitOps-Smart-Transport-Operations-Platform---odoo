import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import {
  getMaintenances,
  closeMaintenance,
  createMaintenance,
} from "@/server/services/maintenance.service";
import { maintenanceSchema } from "@/lib/validations/maintenance";

export const maintenanceRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return getMaintenances();
  }),

  create: protectedProcedure
    .input(maintenanceSchema)
    .mutation(async ({ input }) => {
      return createMaintenance(input);
    }),

  close: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return closeMaintenance(input.id);
    }),
});
