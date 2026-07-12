import { createTRPCRouter, protectedProcedure, writeProcedure } from "../trpc";
import { z } from "zod";
import {
  getMaintenances,
  closeMaintenance,
  createMaintenance,
} from "@/server/services/maintenance.service";
import { maintenanceSchema } from "@/lib/validations/maintenance";

export const maintenanceRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getMaintenances(ctx.user.boardId);
  }),

  create: writeProcedure
    .input(maintenanceSchema)
    .mutation(async ({ input, ctx }) => {
      return createMaintenance(input, ctx.user.boardId);
    }),

  close: writeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return closeMaintenance(input.id, ctx.user.boardId);
    }),
});
