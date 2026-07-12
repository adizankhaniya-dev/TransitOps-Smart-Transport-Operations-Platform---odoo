import { z } from "zod";
import { DriverStatus } from "../enums";

export const createDriverSchema = z.object({
  name: z.string().min(2, "Driver name must be at least 2 characters"),
  licenseNumber: z.string().min(5, "License number must be at least 5 characters"),
  licenseCategory: z.string().min(1, "License category is required"),
  phone: z.string().min(5, "Phone number must be at least 5 characters"),
  safetyScore: z.coerce.number().min(0, "Safety score cannot be less than 0").max(100, "Safety score cannot exceed 100").default(100),
  licenseExpiry: z.coerce.date({ message: "License expiry date is required" }),
  status: z.nativeEnum(DriverStatus).default(DriverStatus.AVAILABLE),
});
