import { z } from "zod";

export const createTripSchema = z.object({
  source: z.string().min(2, "Source must be at least 2 characters"),
  destination: z.string().min(2, "Destination must be at least 2 characters"),
  vehicleId: z.string().min(1, "Vehicle selection is required"),
  driverId: z.string().min(1, "Driver selection is required"),
  cargoWeight: z.coerce.number().positive("Cargo weight must be greater than 0"),
  plannedDistance: z.coerce.number().positive("Planned distance must be greater than 0"),
});
