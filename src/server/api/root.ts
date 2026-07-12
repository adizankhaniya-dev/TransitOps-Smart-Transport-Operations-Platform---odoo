import { createTRPCRouter } from "./trpc";
import { vehicleRouter } from "./routers/vehicle";
import { driverRouter } from "./routers/driver";

export const appRouter = createTRPCRouter({
  vehicle: vehicleRouter,
  driver: driverRouter,
});

export type AppRouter = typeof appRouter;
