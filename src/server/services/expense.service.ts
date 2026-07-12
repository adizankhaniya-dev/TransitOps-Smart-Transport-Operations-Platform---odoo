import { db } from "@/server/db";
import { z } from "zod";
import { expenseSchema } from "@/lib/validations/maintenance";

export type CreateExpenseInput = z.infer<typeof expenseSchema>;

export async function createExpense(data: CreateExpenseInput) {
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

  return db.expense.create({
    data: {
      vehicleId: data.vehicleId,
      tripId: data.tripId,
      type: data.type,
      amount: data.amount,
      description: data.description,
    },
  });
}

export async function listExpense() {
  return db.expense.findMany({
    orderBy: {
      date: "desc",
    },
    include: {
      vehicle: true,
      trip: true,
    },
  });
}

export async function vehicleExpense(vehicleId: string) {
  return db.expense.findMany({
    where: {
      vehicleId,
    },
    orderBy: {
      date: "desc",
    },
  });
}
