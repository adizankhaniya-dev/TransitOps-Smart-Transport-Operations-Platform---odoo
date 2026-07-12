import { createTRPCRouter } from "./trpc";
import { vehicleRouter } from "./routers/vehicle";
import { driverRouter } from "./routers/driver";
import { tripRouter } from "./routers/trip";

export const appRouter = createTRPCRouter({
  vehicle: vehicleRouter,
  driver: driverRouter,
  trip: tripRouter,
});

export type AppRouter = typeof appRouter;
