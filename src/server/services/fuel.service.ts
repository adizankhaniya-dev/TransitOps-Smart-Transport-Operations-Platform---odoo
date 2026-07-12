import { db } from "@/server/db";
import { z } from "zod";
import { fuelSchema } from "@/lib/validations/maintenance";

export type CreateFuelInput = z.infer<typeof fuelSchema>;

export async function createFuel(data: CreateFuelInput, boardId: string) {
  const vehicle = await db.vehicle.findFirst({
    where: { id: data.vehicleId, boardId },
  });

  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  if (data.tripId) {
    const trip = await db.trip.findFirst({
      where: { id: data.tripId, boardId },
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
      boardId,
    },
  });
}

export async function listFuel(boardId: string) {
  return db.fuelLog.findMany({
    where: {
      boardId,
    },
    orderBy: {
      date: "desc",
    },
    include: {
      vehicle: true,
      trip: true,
    },
  });
}

export async function vehicleFuel(vehicleId: string, boardId: string) {
  return db.fuelLog.findMany({
    where: {
      vehicleId,
      boardId,
    },
    orderBy: {
      date: "desc",
    },
  });
}
