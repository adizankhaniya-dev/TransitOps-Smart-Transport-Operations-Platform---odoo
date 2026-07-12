import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
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
  create: publicProcedure
    .input(createTripSchema)
    .mutation(async ({ input }) => {
      return createTrip(input);
    }),

  getAll: publicProcedure.query(async () => {
    return getTrips();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return getTrip(input.id);
    }),

  dispatch: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return dispatchTrip(input.id);
    }),

  complete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        actualDistance: z.coerce.number().positive(),
        fuelUsed: z.coerce.number().positive(),
        revenue: z.coerce.number().positive(),
        endOdometer: z.coerce.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return completeTrip(id, data as CompleteTripInput);
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return cancelTrip(input.id);
    }),
});
