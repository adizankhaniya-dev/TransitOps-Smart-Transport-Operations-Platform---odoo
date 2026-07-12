import { db } from "@/server/db";
import { z } from "zod";
import { maintenanceSchema } from "@/lib/validations/maintenance";
import { MaintenanceStatus, VehicleStatus } from "@/lib/enums";

export type CreateMaintenanceInput = z.infer<typeof maintenanceSchema>;

export async function createMaintenance(data: CreateMaintenanceInput, boardId: string) {
  const vehicle = await db.vehicle.findFirst({
    where: { id: data.vehicleId, boardId },
  });

  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  if (vehicle.status === VehicleStatus.ON_TRIP) {
    throw new Error("Vehicle is currently on a trip");
  }

  return db.$transaction(async (tx) => {
    const maintenance = await tx.maintenance.create({
      data: {
        title: data.title,
        description: data.description,
        cost: data.cost,
        vehicleId: data.vehicleId,
        boardId,
        status: MaintenanceStatus.ACTIVE,
      },
    });

    await tx.vehicle.update({
      where: { id: data.vehicleId },
      data: { status: VehicleStatus.IN_SHOP },
    });

    return maintenance;
  });
}

export async function closeMaintenance(id: string, boardId: string) {
  const maintenance = await db.maintenance.findFirst({
    where: { id, boardId },
    include: { vehicle: true },
  });

  if (!maintenance) {
    throw new Error("Maintenance log not found");
  }

  if (maintenance.status === MaintenanceStatus.CLOSED) {
    throw new Error("Maintenance log is already closed");
  }

  const nextStatus = maintenance.vehicle.status === VehicleStatus.RETIRED
    ? VehicleStatus.RETIRED
    : VehicleStatus.AVAILABLE;

  return db.$transaction(async (tx) => {
    const updatedMaintenance = await tx.maintenance.update({
      where: { id },
      data: {
        status: MaintenanceStatus.CLOSED,
        closedAt: new Date(),
      },
    });

    await tx.vehicle.update({
      where: { id: maintenance.vehicleId },
      data: { status: nextStatus },
    });

    return updatedMaintenance;
  });
}

export async function getMaintenances(boardId: string) {
  return db.maintenance.findMany({
    where: {
      boardId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      vehicle: true,
    },
  });
}

export async function updateMaintenance(id: string, data: Partial<Omit<CreateMaintenanceInput, "vehicleId">>, boardId: string) {
  const maintenance = await db.maintenance.findFirst({
    where: { id, boardId },
  });

  if (!maintenance) {
    throw new Error("Maintenance log not found");
  }

  return db.maintenance.update({
    where: { id },
    data,
  });
}
