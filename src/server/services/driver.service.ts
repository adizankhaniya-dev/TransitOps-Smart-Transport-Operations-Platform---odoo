import { db } from "@/server/db";
import { z } from "zod";
import { createDriverSchema } from "@/lib/validations/driver";
import { DriverStatus } from "@/lib/enums";

export type CreateDriverInput = z.infer<typeof createDriverSchema>;

function isExpired(date: Date) {
  return date < new Date();
}

export async function createDriver(data: CreateDriverInput, boardId: string) {
  if (isExpired(data.licenseExpiry)) {
    throw new Error("License expired");
  }

  const existing = await db.driver.findUnique({
    where: {
      licenseNumber: data.licenseNumber,
    },
  });

  if (existing) {
    throw new Error("License number already exists in the system.");
  }

  return db.driver.create({
    data: {
      ...data,
      boardId,
      status: DriverStatus.AVAILABLE,
    },
  });
}

export async function getDrivers(boardId: string) {
  return db.driver.findMany({
    where: {
      boardId,
    },
    include: {
      trips: {
        select: {
          status: true
        }
      }
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getDriverById(id: string, boardId: string) {
  return db.driver.findFirst({
    where: {
      id,
      boardId,
    },
  });
}

export async function updateDriver(id: string, data: Partial<CreateDriverInput>, boardId: string) {
  if (data.licenseExpiry && isExpired(data.licenseExpiry)) {
    throw new Error("License expired");
  }

  if (data.licenseNumber) {
    const existing = await db.driver.findUnique({
      where: {
        licenseNumber: data.licenseNumber,
      },
    });

    if (existing && existing.id !== id) {
      throw new Error("License number already exists in the system.");
    }
  }

  // Ensure record belongs to board first
  const existingRecord = await getDriverById(id, boardId);
  if (!existingRecord) {
    throw new Error("Driver not found");
  }

  return db.driver.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteDriver(id: string, boardId: string) {
  const driver = await db.driver.findFirst({
    where: {
      id,
      boardId,
    },
  });

  if (!driver) {
    throw new Error("Driver not found");
  }

  if (driver.status === DriverStatus.ON_TRIP) {
    throw new Error("Drivers currently on a trip cannot be deleted");
  }

  return db.driver.delete({
    where: {
      id,
    },
  });
}
