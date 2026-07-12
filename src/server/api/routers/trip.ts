import { createTRPCRouter, protectedProcedure, writeProcedure } from "../trpc";
import { createTripSchema } from "@/lib/validations/trip";
import {
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  getTrips,
  getTrip,
  type CompleteTripInput,
} from "@/server/services/trip.service";
import { z } from "zod";

export const tripRouter = createTRPCRouter({
  create: writeProcedure
    .input(createTripSchema)
    .mutation(async ({ input, ctx }) => {
      return createTrip(input, ctx.user.boardId);
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return getTrips(ctx.user.boardId);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return getTrip(input.id, ctx.user.boardId);
    }),

  dispatch: writeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return dispatchTrip(input.id, ctx.user.boardId);
    }),

  complete: writeProcedure
    .input(
      z.object({
        id: z.string(),
        actualDistance: z.coerce.number().positive(),
        fuelUsed: z.coerce.number().positive(),
        revenue: z.coerce.number().positive(),
        endOdometer: z.coerce.number().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return completeTrip(id, data as CompleteTripInput, ctx.user.boardId);
    }),

  cancel: writeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return cancelTrip(input.id, ctx.user.boardId);
    }),
});
