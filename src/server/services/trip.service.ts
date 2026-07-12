import { db } from "@/server/db";
import { z } from "zod";
import { createTripSchema } from "@/lib/validations/trip";
import { TripStatus, VehicleStatus, DriverStatus } from "@/lib/enums";

export type CreateTripInput = z.infer<typeof createTripSchema>;

const isLicenseExpired = (expiryDate: Date | string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(expiryDate) < today;
};

export async function createTrip(data: CreateTripInput, boardId: string) {
  // Validate driver
  const driver = await db.driver.findFirst({
    where: { id: data.driverId, boardId },
  });

  if (!driver) {
    throw new Error("Driver not found");
  }

  if (driver.licenseExpiry < new Date()) {
    throw new Error("License expired");
  }

  if (driver.status !== DriverStatus.AVAILABLE) {
    throw new Error("Driver unavailable");
  }

  // Validate vehicle
  const vehicle = await db.vehicle.findFirst({
    where: { id: data.vehicleId, boardId },
  });

  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  if (vehicle.status !== VehicleStatus.AVAILABLE) {
    throw new Error("Vehicle unavailable");
  }

  if (data.cargoWeight > vehicle.maxLoadCapacity) {
    throw new Error("Vehicle capacity exceeded");
  }

  return db.trip.create({
    data: {
      ...data,
      boardId,
      status: TripStatus.DRAFT,
    },
  });
}

export async function dispatchTrip(id: string, boardId: string) {
  const trip = await db.trip.findFirst({
    where: { id, boardId },
    include: {
      vehicle: true,
      driver: true,
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  if (trip.status !== TripStatus.DRAFT) {
    throw new Error("Only draft trips can be dispatched");
  }

  if (trip.driver.licenseExpiry < new Date()) {
    throw new Error("License expired");
  }

  return db.$transaction(async (tx) => {
    const updatedTrip = await tx.trip.update({
      where: { id },
      data: {
        status: TripStatus.DISPATCHED,
        startOdometer: trip.vehicle.odometer,
      },
    });

    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: VehicleStatus.ON_TRIP },
    });

    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: DriverStatus.ON_TRIP },
    });

    return updatedTrip;
  });
}

export interface CompleteTripInput {
  actualDistance: number;
  fuelUsed: number;
  revenue: number;
  endOdometer: number;
}

export async function completeTrip(id: string, data: CompleteTripInput, boardId: string) {
  const trip = await db.trip.findFirst({
    where: { id, boardId },
    include: {
      vehicle: true,
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  if (trip.status !== TripStatus.DISPATCHED) {
    throw new Error("Only active dispatched trips can be completed");
  }

  const startOdo = trip.startOdometer ?? trip.vehicle.odometer;
  if (data.endOdometer < startOdo) {
    throw new Error(`End odometer (${data.endOdometer}) cannot be less than start odometer (${startOdo})`);
  }

  return db.$transaction(async (tx) => {
    const updatedTrip = await tx.trip.update({
      where: { id },
      data: {
        status: TripStatus.COMPLETED,
        actualDistance: data.actualDistance,
        fuelUsed: data.fuelUsed,
        revenue: data.revenue,
        endOdometer: data.endOdometer,
      },
    });

    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: {
        status: VehicleStatus.AVAILABLE,
        odometer: data.endOdometer,
      },
    });

    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: DriverStatus.AVAILABLE },
    });

    await tx.fuelLog.create({
      data: {
        boardId: trip.boardId,
        vehicleId: trip.vehicleId,
        tripId: id,
        liters: data.fuelUsed,
        cost: data.fuelUsed * 1.5, // Standard rate to compute the required cost field
      },
    });

    return updatedTrip;
  });
}

export async function cancelTrip(id: string, boardId: string) {
  const trip = await db.trip.findFirst({
    where: { id, boardId },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
    throw new Error("Completed or cancelled trips cannot be modified");
  }

  return db.$transaction(async (tx) => {
    await tx.trip.update({
      where: { id },
      data: { status: TripStatus.CANCELLED },
    });

    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: VehicleStatus.AVAILABLE },
    });

    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: DriverStatus.AVAILABLE },
    });
  });
}

export async function getTrips(boardId: string) {
  return db.trip.findMany({
    where: { boardId },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      vehicle: true,
      driver: true,
    },
  });
}

export async function getTrip(id: string, boardId: string) {
  return db.trip.findFirst({
    where: { id, boardId },
    include: {
      vehicle: true,
      driver: true,
    },
  });
}
