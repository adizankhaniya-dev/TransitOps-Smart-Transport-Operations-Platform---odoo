import { db } from "@/server/db";
import { z } from "zod";
import { expenseSchema } from "@/lib/validations/maintenance";

export type CreateExpenseInput = z.infer<typeof expenseSchema>;

export async function createExpense(data: CreateExpenseInput, boardId: string) {
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

  return db.expense.create({
    data: {
      vehicleId: data.vehicleId,
      tripId: data.tripId,
      type: data.type,
      amount: data.amount,
      description: data.description,
      boardId,
    },
  });
}

export async function listExpense(boardId: string) {
  return db.expense.findMany({
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

export async function vehicleExpense(vehicleId: string, boardId: string) {
  return db.expense.findMany({
    where: {
      vehicleId,
      boardId,
    },
    orderBy: {
      date: "desc",
    },
  });
}
