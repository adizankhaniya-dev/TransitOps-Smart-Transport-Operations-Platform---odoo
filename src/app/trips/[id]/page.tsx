"use client";

import * as React from "react";
import { api } from "@/trpc/react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeftIcon,
  TruckIcon,
  UserIcon,
  MapPinIcon,
  WeightIcon,
  RouteIcon,
  FuelIcon,
  BadgeDollarSignIcon,
  CalendarIcon,
  ClockIcon,
} from "lucide-react";
import { TripStatus } from "@/lib/enums";

const statusStyles: Record<TripStatus, string> = {
  [TripStatus.DRAFT]: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  [TripStatus.DISPATCHED]: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  [TripStatus.COMPLETED]: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  [TripStatus.CANCELLED]: "bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700",
};

const timelineSteps = [
  { status: TripStatus.DRAFT, label: "Trip Created", description: "Trip scheduled and saved as draft" },
  { status: TripStatus.DISPATCHED, label: "Dispatched", description: "Vehicle and driver deployed" },
  { status: TripStatus.COMPLETED, label: "Completed", description: "Trip finished, resources released" },
];

const statusOrder = [TripStatus.DRAFT, TripStatus.DISPATCHED, TripStatus.COMPLETED, TripStatus.CANCELLED];

function TripDetailContent({ id }: { id: string }) {
  const { data: trip, isLoading, error } = api.trip.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
          ))}
        </div>
        <div className="h-40 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
      </div>
    );
  }

  if (error || !trip) return notFound();

  const currentStatusIndex = statusOrder.indexOf(trip.status as TripStatus);
  const isCancelled = trip.status === TripStatus.CANCELLED;

  const fuelEfficiency =
    trip.actualDistance && trip.fuelUsed
      ? (trip.actualDistance / trip.fuelUsed).toFixed(2)
      : null;

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
              {trip.source} → {trip.destination}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Trip ID: <span className="font-mono text-xs">{trip.id}</span>
            </p>
          </div>
        </div>
        <Badge className={`${statusStyles[trip.status as TripStatus]} px-3 py-1 text-sm rounded-full`}>
          {trip.status}
        </Badge>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Vehicle */}
        <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <CardHeader className="flex flex-row items-center gap-2 pb-2 space-y-0">
            <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-500/10">
              <TruckIcon className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">{trip.vehicle.name}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{trip.vehicle.registrationNumber} · {trip.vehicle.type}</p>
          </CardContent>
        </Card>

        {/* Driver */}
        <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <CardHeader className="flex flex-row items-center gap-2 pb-2 space-y-0">
            <div className="p-1.5 rounded-md bg-violet-50 dark:bg-violet-500/10">
              <UserIcon className="size-4 text-violet-600 dark:text-violet-400" />
            </div>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Driver</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">{trip.driver.name}</p>
            <p className="text-xs text-zinc-500 mt-0.5">License: {trip.driver.licenseNumber}</p>
          </CardContent>
        </Card>

        {/* Route */}
        <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <CardHeader className="flex flex-row items-center gap-2 pb-2 space-y-0">
            <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10">
              <MapPinIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Route</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">{trip.source}</p>
            <p className="text-xs text-zinc-500 mt-0.5">→ {trip.destination}</p>
          </CardContent>
        </Card>

        {/* Cargo */}
        <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <CardHeader className="flex flex-row items-center gap-2 pb-2 space-y-0">
            <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-500/10">
              <WeightIcon className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Cargo Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">{trip.cargoWeight.toLocaleString()} kg</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Max capacity: {trip.vehicle.maxLoadCapacity.toLocaleString()} kg
            </p>
          </CardContent>
        </Card>

        {/* Distance */}
        <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <CardHeader className="flex flex-row items-center gap-2 pb-2 space-y-0">
            <div className="p-1.5 rounded-md bg-sky-50 dark:bg-sky-500/10">
              <RouteIcon className="size-4 text-sky-600 dark:text-sky-400" />
            </div>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Distance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">{trip.plannedDistance.toLocaleString()} km planned</p>
            {trip.actualDistance ? (
              <p className="text-xs text-zinc-500 mt-0.5">{trip.actualDistance.toLocaleString()} km actual</p>
            ) : (
              <p className="text-xs text-zinc-400 mt-0.5">Actual distance pending</p>
            )}
          </CardContent>
        </Card>

        {/* Fuel */}
        <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <CardHeader className="flex flex-row items-center gap-2 pb-2 space-y-0">
            <div className="p-1.5 rounded-md bg-orange-50 dark:bg-orange-500/10">
              <FuelIcon className="size-4 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Fuel</CardTitle>
          </CardHeader>
          <CardContent>
            {trip.fuelUsed ? (
              <>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">{trip.fuelUsed.toLocaleString()} L used</p>
                {fuelEfficiency && (
                  <p className="text-xs text-zinc-500 mt-0.5">{fuelEfficiency} km/L efficiency</p>
                )}
              </>
            ) : (
              <>
                <p className="font-semibold text-zinc-400">—</p>
                <p className="text-xs text-zinc-400 mt-0.5">Available after completion</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <CardHeader className="flex flex-row items-center gap-2 pb-2 space-y-0">
            <div className="p-1.5 rounded-md bg-green-50 dark:bg-green-500/10">
              <BadgeDollarSignIcon className="size-4 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {trip.revenue ? (
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">${trip.revenue.toLocaleString()}</p>
            ) : (
              <>
                <p className="font-semibold text-zinc-400">—</p>
                <p className="text-xs text-zinc-400 mt-0.5">Available after completion</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Created At */}
        <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <CardHeader className="flex flex-row items-center gap-2 pb-2 space-y-0">
            <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
              <CalendarIcon className="size-4 text-zinc-500" />
            </div>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">
              {new Date(trip.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {new Date(trip.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </CardContent>
        </Card>

        {/* Odometer */}
        {(trip.startOdometer || trip.endOdometer) && (
          <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
            <CardHeader className="flex flex-row items-center gap-2 pb-2 space-y-0">
              <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                <ClockIcon className="size-4 text-zinc-500" />
              </div>
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Odometer</CardTitle>
            </CardHeader>
            <CardContent>
              {trip.startOdometer && (
                <p className="text-sm text-zinc-700 dark:text-zinc-300">Start: <span className="font-semibold">{trip.startOdometer.toLocaleString()} km</span></p>
              )}
              {trip.endOdometer && (
                <p className="text-sm text-zinc-700 dark:text-zinc-300">End: <span className="font-semibold">{trip.endOdometer.toLocaleString()} km</span></p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-6 shadow-xs">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-6">Trip Timeline</h2>
        <div className="relative">
          {/* Track line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800" />

          <ol className="space-y-6">
            {isCancelled ? (
              <>
                {/* Show DRAFT as done */}
                <li className="flex gap-4 pl-10 relative">
                  <div className="absolute left-0 top-1 flex size-8 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white dark:ring-zinc-900">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">Trip Created</p>
                    <p className="text-xs text-zinc-500">Trip scheduled and saved as draft</p>
                  </div>
                </li>
                {/* Cancelled step */}
                <li className="flex gap-4 pl-10 relative">
                  <div className="absolute left-0 top-1 flex size-8 items-center justify-center rounded-full bg-zinc-400 dark:bg-zinc-600 ring-4 ring-white dark:ring-zinc-900">
                    <span className="text-white text-xs font-bold">✕</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">Cancelled</p>
                    <p className="text-xs text-zinc-500">Trip was cancelled, resources released</p>
                  </div>
                </li>
              </>
            ) : (
              timelineSteps.map((step, index) => {
                const stepIndex = statusOrder.indexOf(step.status);
                const isDone = currentStatusIndex > stepIndex;
                const isCurrent = currentStatusIndex === stepIndex;

                return (
                  <li key={step.status} className="flex gap-4 pl-10 relative">
                    <div
                      className={`absolute left-0 top-1 flex size-8 items-center justify-center rounded-full ring-4 ring-white dark:ring-zinc-900 transition-colors ${
                        isDone
                          ? "bg-emerald-500"
                          : isCurrent
                          ? "bg-amber-400"
                          : "bg-zinc-200 dark:bg-zinc-700"
                      }`}
                    >
                      {isDone ? (
                        <span className="text-white text-xs font-bold">✓</span>
                      ) : (
                        <span className={`text-xs font-bold ${isCurrent ? "text-white" : "text-zinc-400 dark:text-zinc-500"}`}>
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${isCurrent ? "text-zinc-900 dark:text-zinc-50" : isDone ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-600"}`}>
                        {step.label}
                      </p>
                      <p className={`text-xs mt-0.5 ${isCurrent || isDone ? "text-zinc-500" : "text-zinc-400 dark:text-zinc-600"}`}>
                        {step.description}
                      </p>
                    </div>
                  </li>
                );
              })
            )}
          </ol>
        </div>
      </div>
    </div>
  );
}

export default function TripDetailPage({ params }: { params: React.Usable<{ id: string }> }) {
  const { id } = React.use(params);
  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6 md:p-10">
      <TripDetailContent id={id} />
    </div>
  );
}
