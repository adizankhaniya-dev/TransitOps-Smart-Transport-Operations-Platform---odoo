import { createTRPCRouter } from "./trpc";
import { vehicleRouter } from "./routers/vehicle";
import { driverRouter } from "./routers/driver";
import { tripRouter } from "./routers/trip";
import { maintenanceRouter } from "./routers/maintenance";
import { fuelRouter } from "./routers/fuel";
import { expenseRouter } from "./routers/expense";
import { teamRouter } from "./routers/team";

export const appRouter = createTRPCRouter({
  vehicle: vehicleRouter,
  driver: driverRouter,
  trip: tripRouter,
  maintenance: maintenanceRouter,
  fuel: fuelRouter,
  expense: expenseRouter,
  team: teamRouter,
});

export type AppRouter = typeof appRouter;
