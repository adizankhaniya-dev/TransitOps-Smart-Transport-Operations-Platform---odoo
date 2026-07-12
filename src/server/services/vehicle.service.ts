import { db } from "@/server/db";

import { z } from "zod";
import { createVehicleSchema } from "@/lib/validations/vehicle";

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export async function createVehicle(data: CreateVehicleInput) {
  const existing = await db.vehicle.findUnique({
    where: {
      registrationNumber: data.registrationNumber,
    },
  });

  if (existing) {
    throw new Error("Registration number already exists");
  }

  return db.vehicle.create({
    data,
  });
}

export async function getVehicles() {
  return db.vehicle.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function updateVehicle(id: string, data: Partial<CreateVehicleInput>) {
  if (data.registrationNumber) {
    const existing = await db.vehicle.findFirst({
      where: {
        registrationNumber: data.registrationNumber,
        NOT: {
          id,
        },
      },
    });

    if (existing) {
      throw new Error("Registration number already exists");
    }
  }

  return db.vehicle.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteVehicle(id: string) {
  return db.vehicle.delete({
    where: {
      id,
    },
  });
}