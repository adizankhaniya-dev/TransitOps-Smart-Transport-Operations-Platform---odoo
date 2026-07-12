import { createTRPCRouter } from "./trpc";
import { vehicleRouter } from "./routers/vehicle";

export const appRouter = createTRPCRouter({
  vehicle: vehicleRouter,
});

export type AppRouter = typeof appRouter;
