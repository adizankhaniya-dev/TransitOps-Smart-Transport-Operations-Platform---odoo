"use client";

import * as React from "react";
import { api } from "@/trpc/react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export default function ExpenseTable() {
  const { data: expenses, isLoading } = api.expense.list.useQuery();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden shadow-sm animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="px-4 py-4 flex items-center border-b border-zinc-100 dark:border-zinc-800 last:border-0">
            <div className="w-full grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-4 bg-zinc-100 dark:bg-zinc-800/50 rounded w-3/4" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-50/50 dark:bg-zinc-950/20">
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3 pl-4">Vehicle</TableHead>
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">Type</TableHead>
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">Amount</TableHead>
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">Description</TableHead>
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3 pr-4">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!expenses || expenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-zinc-500">No expense records found</TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => (
              <TableRow
                key={expense.id}
                className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10"
              >
                <TableCell className="font-medium text-zinc-900 dark:text-zinc-100 py-3.5 pl-4">
                  {expense.vehicle.name} <span className="text-xs text-zinc-400 font-normal">({expense.vehicle.registrationNumber})</span>
                </TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-400 py-3.5 capitalize">{expense.type.toLowerCase()}</TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-400 py-3.5 font-semibold text-zinc-900 dark:text-zinc-50">
                  ${expense.amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-400 py-3.5">{expense.description || "—"}</TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-400 py-3.5 pr-4">
                  {new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
