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

  return db.expense.create({
    data: {
      vehicleId: data.vehicleId,
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
