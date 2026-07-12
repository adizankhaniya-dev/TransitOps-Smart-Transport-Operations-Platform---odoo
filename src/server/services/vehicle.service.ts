import { db } from "@/server/db";
import { z } from "zod";
import { createVehicleSchema } from "@/lib/validations/vehicle";
import { VehicleStatus } from "@/lib/enums";

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export async function createVehicle(data: CreateVehicleInput, boardId: string) {
  const existing = await db.vehicle.findUnique({
    where: {
      registrationNumber: data.registrationNumber,
    },
  });

  if (existing) {
    throw new Error("Registration number already exists in the system.");
  }

  return db.vehicle.create({
    data: {
      ...data,
      boardId,
    },
  });
}

export async function getVehicles(boardId: string) {
  return db.vehicle.findMany({
    where: {
      boardId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function updateVehicle(id: string, data: Partial<CreateVehicleInput>, boardId: string) {
  if (data.registrationNumber) {
    const existing = await db.vehicle.findUnique({
      where: {
        registrationNumber: data.registrationNumber,
      },
    });

    if (existing && existing.id !== id) {
      throw new Error("Registration number already exists in the system.");
    }
  }

  // Verify belongs to board
  const vehicle = await db.vehicle.findFirst({
    where: { id, boardId },
  });
  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  return db.vehicle.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteVehicle(id: string, boardId: string) {
  const vehicle = await db.vehicle.findFirst({
    where: { id, boardId },
  });

  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  if (vehicle.status === VehicleStatus.ON_TRIP) {
    throw new Error("Vehicles currently on a trip cannot be deleted");
  }

  return db.vehicle.delete({
    where: {
      id,
    },
  });
}

export async function vehicleCost(vehicleId: string) {
  const fuel = await db.fuelLog.aggregate({
    _sum: {
      cost: true,
    },
    where: {
      vehicleId,
    },
  });

  const maintenance = await db.maintenance.aggregate({
    _sum: {
      cost: true,
    },
    where: {
      vehicleId,
    },
  });

  return (fuel._sum.cost ?? 0) + (maintenance._sum.cost ?? 0);
}