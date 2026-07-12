import { db } from "@/server/db";
import { z } from "zod";
import { fuelSchema } from "@/lib/validations/maintenance";

export type CreateFuelInput = z.infer<typeof fuelSchema>;

export async function createFuel(data: CreateFuelInput) {
  const vehicle = await db.vehicle.findUnique({
    where: { id: data.vehicleId },
  });

  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  if (data.tripId) {
    const trip = await db.trip.findUnique({
      where: { id: data.tripId },
    });
    if (!trip) {
      throw new Error("Trip not found");
    }
  }

  return db.fuelLog.create({
    data: {
      vehicleId: data.vehicleId,
      tripId: data.tripId,
      liters: data.liters,
      cost: data.cost,
    },
  });
}

export async function listFuel() {
  return db.fuelLog.findMany({
    orderBy: {
      date: "desc",
    },
    include: {
      vehicle: true,
      trip: true,
    },
  });
}

export async function vehicleFuel(vehicleId: string) {
  return db.fuelLog.findMany({
    where: {
      vehicleId,
    },
    orderBy: {
      date: "desc",
    },
  });
}
