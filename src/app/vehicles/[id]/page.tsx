"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/trpc/react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  ArrowLeftIcon,
  TruckIcon,
  ActivityIcon,
  WrenchIcon,
  FuelIcon,
  CreditCardIcon,
  CalendarIcon,
  CompassIcon,
  CalendarDaysIcon,
} from "lucide-react";
import { VehicleStatus } from "@/lib/enums";

const statusStyles: Record<VehicleStatus, string> = {
  [VehicleStatus.AVAILABLE]: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  [VehicleStatus.ON_TRIP]: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  [VehicleStatus.IN_SHOP]: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  [VehicleStatus.RETIRED]: "bg-zinc-50 text-zinc-700 border border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20",
};

type TabType = "overview" | "trips" | "maintenance" | "fuel" | "expenses";

function VehicleDetailContent({ id }: { id: string }) {
  const { data: vehicle, isLoading, error } = api.vehicle.get.useQuery({ id });
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
        <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-full max-w-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !vehicle) return notFound();

  // Helper formatting values
  const totalFuelCost = vehicle.fuelLogs.reduce((acc, log) => acc + log.cost, 0);
  const totalMaintenanceCost = vehicle.maintenances.reduce((acc, log) => acc + log.cost, 0);
  const totalExpenseCost = vehicle.expenses.reduce((acc, log) => acc + log.amount, 0);
  const totalRevenue = vehicle.trips.reduce((acc, trip) => acc + (trip.revenue ?? 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            <ArrowLeftIcon className="size-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {vehicle.name}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Registration Number: <span className="font-mono text-xs">{vehicle.registrationNumber}</span>
            </p>
          </div>
        </div>
        <Badge className={`${statusStyles[vehicle.status as VehicleStatus]} px-3 py-1 text-sm rounded-full`}>
          {vehicle.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Tabs Control */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6">
        {(["overview", "trips", "maintenance", "fuel", "expenses"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold capitalize transition-all border-b-2 -mb-[2px] outline-none ${
              activeTab === tab
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Odometer</CardTitle>
                <CompassIcon className="size-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {vehicle.odometer.toLocaleString()} km
                </p>
                <p className="text-[10px] text-zinc-400 mt-1">Current mileage</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Trip Revenue</CardTitle>
                <ActivityIcon className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${totalRevenue.toLocaleString()}
                </p>
                <p className="text-[10px] text-emerald-500/80 mt-1">From {vehicle.trips.length} completed trips</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Acquisition Cost</CardTitle>
                <TruckIcon className="size-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  ${vehicle.acquisitionCost.toLocaleString()}
                </p>
                <p className="text-[10px] text-zinc-400 mt-1">Initial investment</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Capacity</CardTitle>
                <ActivityIcon className="size-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {vehicle.maxLoadCapacity.toLocaleString()} kg
                </p>
                <p className="text-[10px] text-zinc-400 mt-1">Max capacity limit</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-2 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs bg-white dark:bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Vehicle Specifications</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <p className="text-xs text-zinc-400 uppercase">Registration ID</p>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">{vehicle.registrationNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 uppercase">Vehicle Type</p>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">{vehicle.type}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 uppercase">Registered Date</p>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                    {new Date(vehicle.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 uppercase">Current Status</p>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 capitalize">{vehicle.status.toLowerCase().replace("_", " ")}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs bg-white dark:bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Total Fuel Expenses</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">${totalFuelCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Maintenance Expenses</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">${totalMaintenanceCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Other Fleet Expenses</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">${totalExpenseCost.toLocaleString()}</span>
                </div>
                <hr className="border-zinc-100 dark:border-zinc-800" />
                <div className="flex justify-between items-center pt-1 font-bold text-base">
                  <span className="text-zinc-900 dark:text-zinc-50">Total Expenses</span>
                  <span className="text-rose-600 dark:text-rose-400">
                    ${(totalFuelCost + totalMaintenanceCost + totalExpenseCost).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "trips" && (
        <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/20">
              <TableRow>
                <TableHead className="font-semibold py-3 pl-4">Route</TableHead>
                <TableHead className="font-semibold py-3">Driver</TableHead>
                <TableHead className="font-semibold py-3">Planned Distance</TableHead>
                <TableHead className="font-semibold py-3">Cargo Weight</TableHead>
                <TableHead className="font-semibold py-3">Status</TableHead>
                <TableHead className="font-semibold py-3 text-right pr-4">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicle.trips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-zinc-500">No trips recorded</TableCell>
                </TableRow>
              ) : (
                vehicle.trips.map((trip) => (
                  <TableRow key={trip.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10">
                    <TableCell className="font-medium py-3.5 pl-4">{trip.source} → {trip.destination}</TableCell>
                    <TableCell className="py-3.5">{trip.driver.name}</TableCell>
                    <TableCell className="py-3.5">{trip.plannedDistance.toLocaleString()} km</TableCell>
                    <TableCell className="py-3.5">{trip.cargoWeight.toLocaleString()} kg</TableCell>
                    <TableCell className="py-3.5 capitalize">{trip.status.toLowerCase()}</TableCell>
                    <TableCell className="py-3.5 text-right pr-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      {trip.revenue ? `$${trip.revenue.toLocaleString()}` : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {activeTab === "maintenance" && (
        <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/20">
              <TableRow>
                <TableHead className="font-semibold py-3 pl-4">Service Details</TableHead>
                <TableHead className="font-semibold py-3">Opened At</TableHead>
                <TableHead className="font-semibold py-3">Closed At</TableHead>
                <TableHead className="font-semibold py-3">Status</TableHead>
                <TableHead className="font-semibold py-3 text-right pr-4">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicle.maintenances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-zinc-500">No maintenance history</TableCell>
                </TableRow>
              ) : (
                vehicle.maintenances.map((log) => (
                  <TableRow key={log.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10">
                    <TableCell className="font-medium py-3.5 pl-4">
                      <div>{log.title}</div>
                      {log.description && <div className="text-xs text-zinc-400 font-normal mt-0.5">{log.description}</div>}
                    </TableCell>
                    <TableCell className="py-3.5">
                      {new Date(log.openedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="py-3.5">
                      {log.closedAt
                        ? new Date(log.closedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </TableCell>
                    <TableCell className="py-3.5 capitalize">{log.status.toLowerCase()}</TableCell>
                    <TableCell className="py-3.5 text-right pr-4 font-semibold text-rose-600 dark:text-rose-400">
                      ${log.cost.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {activeTab === "fuel" && (
        <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/20">
              <TableRow>
                <TableHead className="font-semibold py-3 pl-4">Date</TableHead>
                <TableHead className="font-semibold py-3">Liters Refueled</TableHead>
                <TableHead className="font-semibold py-3">Assigned Trip</TableHead>
                <TableHead className="font-semibold py-3 text-right pr-4">Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicle.fuelLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-zinc-500">No fuel records found</TableCell>
                </TableRow>
              ) : (
                vehicle.fuelLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10">
                    <TableCell className="font-medium py-3.5 pl-4">
                      {new Date(log.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="py-3.5">{log.liters.toLocaleString()} Liters</TableCell>
                    <TableCell className="py-3.5 text-zinc-500">
                      {log.tripId ? "Assigned (ID: " + log.tripId.slice(-6) + ")" : "Manual Log"}
                    </TableCell>
                    <TableCell className="py-3.5 text-right pr-4 font-semibold text-zinc-900 dark:text-zinc-50">
                      ${log.cost.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {activeTab === "expenses" && (
        <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/20">
              <TableRow>
                <TableHead className="font-semibold py-3 pl-4">Date</TableHead>
                <TableHead className="font-semibold py-3">Expense Type</TableHead>
                <TableHead className="font-semibold py-3">Description</TableHead>
                <TableHead className="font-semibold py-3 text-right pr-4">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicle.expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-zinc-500">No expense records found</TableCell>
                </TableRow>
              ) : (
                vehicle.expenses.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10">
                    <TableCell className="font-medium py-3.5 pl-4">
                      {new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="py-3.5 capitalize">{expense.type.toLowerCase()}</TableCell>
                    <TableCell className="py-3.5 text-zinc-500">{expense.description || "—"}</TableCell>
                    <TableCell className="py-3.5 text-right pr-4 font-semibold text-rose-600 dark:text-rose-400">
                      ${expense.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6 md:p-10">
      <VehicleDetailContent id={params.id} />
    </div>
  );
}
