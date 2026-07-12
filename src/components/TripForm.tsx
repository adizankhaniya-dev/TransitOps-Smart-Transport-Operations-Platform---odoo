"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MapPinIcon, TruckIcon, UserIcon, WeightIcon, RouteIcon } from "lucide-react";

const tripFormSchema = z.object({
  source: z.string().min(2, "Source is required"),
  destination: z.string().min(2, "Destination is required"),
  vehicleId: z.string().min(1, "Select a vehicle"),
  driverId: z.string().min(1, "Select a driver"),
  cargoWeight: z.coerce.number().positive("Must be positive"),
  plannedDistance: z.coerce.number().positive("Must be positive"),
});

type TripFormData = z.infer<typeof tripFormSchema>;

interface TripFormProps {
  onSuccess?: () => void;
}

export default function TripForm({ onSuccess }: TripFormProps) {
  const utils = api.useUtils();
  const { data: vehicles } = api.vehicle.list.useQuery();
  const { data: drivers } = api.driver.getAll.useQuery();

  const availableVehicles = vehicles?.filter((v) => v.status === "AVAILABLE") ?? [];
  const availableDrivers = drivers?.filter((d) => d.status === "AVAILABLE") ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TripFormData>({  
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(tripFormSchema) as any,
  });

  const createMutation = api.trip.create.useMutation({
    onSuccess: () => {
      toast.success("Trip created successfully");
      utils.trip.getAll.invalidate();
      reset();
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create trip");
    },
  });

  const onSubmit = (data: TripFormData) => {
    createMutation.mutate(data);
  };

  const watchedVehicle = watch("vehicleId");
  const watchedDriver = watch("driverId");

  const fieldClass =
    "flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-3 py-2";

  return (
    <div className="w-full max-w-2xl space-y-5">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          Schedule New Trip
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Fill in the route and assignment details below.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Source & Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MapPinIcon className="size-3.5 text-emerald-500" />
              Source
            </label>
            <Input
              {...register("source")}
              placeholder="e.g. Mumbai"
              className="h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm transition-all"
            />
            {errors.source && (
              <p className="text-xs text-destructive font-medium mt-0.5">{errors.source.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MapPinIcon className="size-3.5 text-rose-500" />
              Destination
            </label>
            <Input
              {...register("destination")}
              placeholder="e.g. Pune"
              className="h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm transition-all"
            />
            {errors.destination && (
              <p className="text-xs text-destructive font-medium mt-0.5">{errors.destination.message}</p>
            )}
          </div>
        </div>

        {/* Vehicle */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <TruckIcon className="size-3.5 text-blue-500" />
            Vehicle
          </label>
          <Select value={watchedVehicle} onValueChange={(val) => val && setValue("vehicleId", val)}>
            <SelectTrigger className="w-full !h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm text-slate-700">
              <SelectValue placeholder="Select available vehicle...">
                {watchedVehicle ? (
                  availableVehicles?.find(v => v.id === watchedVehicle)
                    ? (() => {
                        const v = availableVehicles.find(v => v.id === watchedVehicle);
                        return `${v?.name} · ${v?.registrationNumber} (${v?.maxLoadCapacity.toLocaleString()} kg max)`;
                      })()
                    : watchedVehicle
                ) : (
                  "Select available vehicle..."
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border border-slate-200">
              {availableVehicles.length === 0 ? (
                <div className="px-3 py-2 text-xs font-semibold text-slate-400">No available vehicles</div>
              ) : (
                availableVehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} · {v.registrationNumber} ({v.maxLoadCapacity.toLocaleString()} kg max)
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.vehicleId && (
            <p className="text-xs text-destructive font-medium mt-0.5">{errors.vehicleId.message}</p>
          )}
        </div>

        {/* Driver */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <UserIcon className="size-3.5 text-violet-500" />
            Driver
          </label>
          <Select value={watchedDriver} onValueChange={(val) => val && setValue("driverId", val)}>
            <SelectTrigger className="w-full !h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm text-slate-700">
              <SelectValue placeholder="Select available driver...">
                {watchedDriver ? (
                  availableDrivers?.find(d => d.id === watchedDriver)
                    ? (() => {
                        const d = availableDrivers.find(d => d.id === watchedDriver);
                        return `${d?.name} · ${d?.licenseNumber}`;
                      })()
                    : watchedDriver
                ) : (
                  "Select available driver..."
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border border-slate-200">
              {availableDrivers.length === 0 ? (
                <div className="px-3 py-2 text-xs font-semibold text-slate-400">No available drivers</div>
              ) : (
                availableDrivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} · {d.licenseNumber}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.driverId && (
            <p className="text-xs text-destructive font-medium mt-0.5">{errors.driverId.message}</p>
          )}
        </div>

        {/* Cargo Weight & Planned Distance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <WeightIcon className="size-3.5 text-amber-500" />
              Cargo Weight (kg)
            </label>
            <Input
              {...register("cargoWeight")}
              type="number"
              placeholder="e.g. 5000"
              className="h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm transition-all"
            />
            {errors.cargoWeight && (
              <p className="text-xs text-destructive font-medium mt-0.5">{errors.cargoWeight.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <RouteIcon className="size-3.5 text-sky-500" />
              Planned Distance (km)
            </label>
            <Input
              {...register("plannedDistance")}
              type="number"
              placeholder="e.g. 300"
              className="h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm transition-all"
            />
            {errors.plannedDistance && (
              <p className="text-xs text-destructive font-medium mt-0.5">{errors.plannedDistance.message}</p>
            )}
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="w-full h-10 rounded-xl bg-[#0d5c3a] hover:bg-[#064e3b] text-white text-xs font-bold transition-all hover-lift cursor-pointer shadow-sm border-0 mt-4 animate-pulse-subtle"
          >
            {createMutation.isPending ? "Scheduling..." : "Schedule Trip"}
          </Button>
        </div>
      </form>
    </div>
  );
}
