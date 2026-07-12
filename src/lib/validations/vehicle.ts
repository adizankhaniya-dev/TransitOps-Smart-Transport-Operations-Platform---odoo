import { z } from "zod";
import { VehicleStatus } from "../enums";

export const createVehicleSchema = z.object({
  registrationNumber: z.string().min(3, "Registration number must be at least 3 characters"),
  name: z.string().min(2, "Vehicle name must be at least 2 characters"),
  type: z.string().min(2, "Vehicle type must be at least 2 characters"),
  maxLoadCapacity: z.coerce.number().positive("Maximum load capacity must be positive"),
  odometer: z.coerce.number().min(0, "Odometer cannot be negative"),
  acquisitionCost: z.coerce.number().positive("Acquisition cost must be positive"),
  status: z.nativeEnum(VehicleStatus).default(VehicleStatus.AVAILABLE),
});