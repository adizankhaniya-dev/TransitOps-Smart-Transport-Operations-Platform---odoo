import { db } from "@/server/db";
import { z } from "zod";
import { createDriverSchema } from "@/lib/validations/driver";
import { DriverStatus } from "@/lib/enums";

export type CreateDriverInput = z.infer<typeof createDriverSchema>;

function isExpired(date: Date) {
  return date < new Date();
}

export async function createDriver(data: CreateDriverInput) {
  if (isExpired(data.licenseExpiry)) {
    throw new Error("License expired");
  }

  const existing = await db.driver.findUnique({
    where: {
      licenseNumber: data.licenseNumber,
    },
  });

  if (existing) {
    throw new Error("License already exists");
  }

  return db.driver.create({
    data: {
      ...data,
      status: DriverStatus.AVAILABLE,
    },
  });
}

export async function getDrivers() {
  return db.driver.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getDriverById(id: string) {
  return db.driver.findUnique({
    where: {
      id,
    },
  });
}

export async function updateDriver(id: string, data: Partial<CreateDriverInput>) {
  if (data.licenseExpiry && isExpired(data.licenseExpiry)) {
    throw new Error("License expired");
  }

  if (data.licenseNumber) {
    const existing = await db.driver.findFirst({
      where: {
        licenseNumber: data.licenseNumber,
        NOT: {
          id,
        },
      },
    });

    if (existing) {
      throw new Error("License already exists");
    }
  }

  return db.driver.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteDriver(id: string) {
  const driver = await db.driver.findUnique({
    where: {
      id,
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
