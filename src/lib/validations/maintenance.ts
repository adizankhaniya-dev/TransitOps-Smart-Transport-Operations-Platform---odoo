import { z } from "zod";

export const maintenanceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  cost: z.coerce.number().positive("Cost must be positive"),
  vehicleId: z.string().min(1, "Vehicle ID is required"),
});

export const fuelSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  tripId: z.string().optional().nullable(),
  liters: z.coerce.number().positive("Liters must be positive"),
  cost: z.coerce.number().positive("Cost must be positive"),
});

export const expenseSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  type: z.enum(["TOLL", "REPAIR", "INSURANCE", "OTHER"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().optional().nullable(),
});
