"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  MoreVerticalIcon,
  SendIcon,
  CheckCircle2Icon,
  XCircleIcon,
  SearchIcon,
  SearchXIcon,
  PackageIcon,
  ExternalLinkIcon,
  MapPinIcon,
  TruckIcon,
  UserIcon,
  WeightIcon,
  RouteIcon,
} from "lucide-react";
import { TripStatus } from "@/lib/enums";
import { toast } from "sonner";

const statusStyles = {
  [TripStatus.DRAFT]: "bg-blue-50 text-blue-700 border border-blue-100/50 hover:bg-blue-100/50",
  [TripStatus.DISPATCHED]: "bg-amber-50/50 text-amber-700 border border-amber-100/50 hover:bg-amber-100/50",
  [TripStatus.COMPLETED]: "bg-[#eef6f2] text-[#0d5c3a] border border-emerald-100/50 hover:bg-emerald-100/50",
  [TripStatus.CANCELLED]: "bg-slate-50 text-slate-600 border border-slate-200/50 hover:bg-slate-100/50",
};


const tripFormSchema = z.object({
  source: z.string().min(2, "Source is required"),
  destination: z.string().min(2, "Destination is required"),
  vehicleId: z.string().min(1, "Select a vehicle"),
  driverId: z.string().min(1, "Select a driver"),
  cargoWeight: z.coerce.number().positive("Must be positive"),
  plannedDistance: z.coerce.number().positive("Must be positive"),
});

type TripFormData = z.infer<typeof tripFormSchema>;

export default function TripTable() {
  const router = useRouter();
  const utils = api.useUtils();
  const { data: trips, isLoading } = api.trip.getAll.useQuery();
  const { data: vehicles } = api.vehicle.list.useQuery();
  const { data: drivers } = api.driver.getAll.useQuery();

  const availableVehicles = vehicles?.filter((v) => v.status === "AVAILABLE") ?? [];
  const availableDrivers = drivers?.filter((d) => d.status === "AVAILABLE") ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [currentOdometer, setCurrentOdometer] = useState<string>("");
  const [viewingTripId, setViewingTripId] = useState<string | null>(null);

  const filteredTrips = useMemo(() => {
    if (!trips) return [];
    const filtered = trips.filter((trip) => {
      const matchesSearch =
        trip.source.toLowerCase().includes(search.toLowerCase()) ||
        trip.destination.toLowerCase().includes(search.toLowerCase()) ||
        trip.vehicle.name.toLowerCase().includes(search.toLowerCase()) ||
        trip.driver.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || trip.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort: active/pending trips first, finished trips last
    return [...filtered].sort((a, b) => {
      const statusWeight = {
        [TripStatus.DISPATCHED]: 1,
        [TripStatus.DRAFT]: 2,
        [TripStatus.COMPLETED]: 3,
        [TripStatus.CANCELLED]: 4,
      };
      const weightA = statusWeight[a.status as TripStatus] ?? 99;
      const weightB = statusWeight[b.status as TripStatus] ?? 99;
      return weightA - weightB;
    });
  }, [trips, search, statusFilter]);

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Set selectedTripId dynamically to the first trip if not set
  React.useEffect(() => {
    if (!selectedTripId && filteredTrips.length > 0) {
      setSelectedTripId(filteredTrips[0].id);
    }
  }, [filteredTrips, selectedTripId]);

  const selectedTrip = trips?.find((t) => t.id === selectedTripId) ?? filteredTrips[0];

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    setValue: setCreateValue,
    watch: watchCreate,
    formState: { errors: createErrors, isSubmitting: isCreating },
    reset: resetCreate,
    control: createControl,
  } = useForm<TripFormData>({
    resolver: zodResolver(tripFormSchema) as any,
    defaultValues: {
      source: "",
      destination: "",
      vehicleId: "",
      driverId: "",
      cargoWeight: 0,
      plannedDistance: 0,
    }
  });

  const watchedVehicleId = watchCreate("vehicleId");
  const watchedCargoWeight = watchCreate("cargoWeight");
  const selectedVehicle = vehicles?.find((v) => v.id === watchedVehicleId);
  const maxCapacity = selectedVehicle?.maxLoadCapacity ?? 0;
  const isOverweight = watchedCargoWeight > maxCapacity && maxCapacity > 0;
  const exceededWeight = watchedCargoWeight - maxCapacity;

  const createMutation = api.trip.create.useMutation({
    onSuccess: () => {
      toast.success("Trip scheduled successfully");
      utils.trip.getAll.invalidate();
      resetCreate({
        source: "",
        destination: "",
        vehicleId: "",
        driverId: "",
        cargoWeight: 0,
        plannedDistance: 0,
      });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create trip");
    },
  });

  const dispatchMutation = api.trip.dispatch.useMutation({
    onSuccess: (data, variables) => {
      toast.success("Trip dispatched successfully");
      utils.trip.getAll.invalidate();
      const trip = trips?.find(t => t.id === variables.id);
      if (trip) {
        window.dispatchEvent(new CustomEvent("trip-status-changed", {
          detail: {
            type: "start",
            source: trip.source,
            destination: trip.destination,
          }
        }));
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to dispatch trip");
    },
  });

  const completeMutation = api.trip.complete.useMutation({
    onSuccess: (data, variables) => {
      toast.success("Trip completed successfully");
      utils.trip.getAll.invalidate();
      setCompletingId(null);
      const trip = trips?.find(t => t.id === variables.id);
      if (trip) {
        window.dispatchEvent(new CustomEvent("trip-status-changed", {
          detail: {
            type: "end",
            source: trip.source,
            destination: trip.destination,
          }
        }));
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to complete trip");
    },
  });

  const cancelMutation = api.trip.cancel.useMutation({
    onSuccess: () => {
      toast.success("Trip cancelled");
      utils.trip.getAll.invalidate();
      setCancellingId(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to cancel trip");
    },
  });


  const handleCreate = (data: TripFormData) => {
    if (isOverweight) return;
    createMutation.mutate(data);
  };

  const handleComplete = () => {
    if (!completingId || !currentOdometer) return;
    const trip = trips?.find(t => t.id === completingId);
    if (!trip) return;
    const startOdo = trip.startOdometer ?? trip.vehicle?.odometer ?? 0;
    const endOdo = Number(currentOdometer);
    if (endOdo < startOdo) {
      toast.error(`Odometer cannot be less than start value (${startOdo} km)`);
      return;
    }
    const actualDistance = endOdo - startOdo;
    completeMutation.mutate({
      id: completingId,
      actualDistance,
      fuelUsed: Math.max(1, Math.round(actualDistance * 0.18)),
      revenue: Math.max(100, Math.round(actualDistance * 45)),
      endOdometer: endOdo,
    });
  };


  if (isLoading) {
    return (
      <div className="flex h-60 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="size-8 rounded-full border-4 border-slate-200 border-t-[#0d5c3a] animate-spin" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Live Board...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* ════ LEFT COLUMN: LIFECYCLE & SCHEDULER ════ */}
      <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
        {/* Trip Lifecycle status bar */}
        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Trip Lifecycle {selectedTrip && `• TR${(trips?.findIndex(t => t.id === selectedTrip.id) ?? 0) + 1}`}
            </p>
            {selectedTrip && (
              <div className="flex items-center gap-2 animate-fade">
                <span className="text-[10px] font-bold text-[#0d5c3a] bg-[#eef6f2] px-2 py-0.5 rounded-md">
                  {selectedTrip.source} ➔ {selectedTrip.destination}
                </span>
                <button
                  onClick={() => setViewingTripId(selectedTrip.id)}
                  className="text-[10px] font-bold text-slate-500 hover:text-[#0d5c3a] hover:underline cursor-pointer border-0 bg-transparent flex items-center gap-1 p-0"
                >
                  <ExternalLinkIcon className="size-3" />
                  <span>View Details</span>
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute top-2 left-4 right-4 h-[2px] bg-slate-100 -translate-y-1/2 z-0" />
            
            {[
              { label: "Draft", color: "bg-blue-500", text: "text-blue-500", statusKey: "DRAFT" },
              { label: "Dispatched", color: "bg-amber-500", text: "text-amber-500", statusKey: "DISPATCHED" },
              { label: "Completed", color: "bg-[#0d5c3a]", text: "text-[#0d5c3a]", statusKey: "COMPLETED" },
              { label: "Cancelled", color: "bg-red-500", text: "text-red-500", statusKey: "CANCELLED" },
            ].map((step) => {
              const currentStatus = selectedTrip?.status;
              let isStepActive = false;
              if (currentStatus === "CANCELLED") {
                isStepActive = step.label === "Draft" || step.label === "Cancelled";
              } else if (currentStatus === "COMPLETED") {
                isStepActive = step.label === "Draft" || step.label === "Dispatched" || step.label === "Completed";
              } else if (currentStatus === "DISPATCHED") {
                isStepActive = step.label === "Draft" || step.label === "Dispatched";
              } else if (currentStatus === "DRAFT") {
                isStepActive = step.label === "Draft";
              }

              return (
                <div key={step.label} className="flex flex-col items-center gap-1.5 z-10">
                  <div className={`size-3 rounded-full ${isStepActive ? step.color : "bg-slate-200"} border-2 border-white ring-2 ring-slate-100 transition-all duration-300`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isStepActive ? step.text : "text-slate-400"} transition-all duration-300`}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Create Trip Form */}
        <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Create Trip
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Fill in route, cargo weight and vehicle assignment details.</p>
          </div>

          <form onSubmit={handleCreateSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPinIcon className="size-3.5 text-emerald-500" />
                Source
              </label>
              <Input
                {...registerCreate("source")}
                placeholder="e.g. Gandhinagar Depot"
                className="h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm transition-all"
              />
              {createErrors.source && (
                <p className="text-xs text-destructive font-medium mt-0.5">{createErrors.source.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPinIcon className="size-3.5 text-rose-500" />
                Destination
              </label>
              <Input
                {...registerCreate("destination")}
                placeholder="e.g. Ahmedabad Hub"
                className="h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm transition-all"
              />
              {createErrors.destination && (
                <p className="text-xs text-destructive font-medium mt-0.5">{createErrors.destination.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <TruckIcon className="size-3.5 text-blue-500" />
                Vehicle (Available Only)
              </label>
              <Controller
                control={createControl}
                name="vehicleId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full !h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm text-slate-700">
                      <SelectValue placeholder="Select available vehicle...">
                        {field.value ? (
                          availableVehicles?.find(v => v.id === field.value)
                            ? (() => {
                                const v = availableVehicles.find(v => v.id === field.value);
                                return `${v?.name} · ${v?.registrationNumber} (${v?.maxLoadCapacity.toLocaleString()} kg capacity)`;
                              })()
                            : field.value
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
                            {v.name} · {v.registrationNumber} ({v.maxLoadCapacity.toLocaleString()} kg capacity)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {createErrors.vehicleId && (
                <p className="text-xs text-destructive font-medium mt-0.5">{createErrors.vehicleId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <UserIcon className="size-3.5 text-violet-500" />
                Driver (Available Only)
              </label>
              <Controller
                control={createControl}
                name="driverId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full !h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm text-slate-700">
                      <SelectValue placeholder="Select available driver...">
                        {field.value ? (
                          availableDrivers?.find(d => d.id === field.value)
                            ? (() => {
                                const d = availableDrivers.find(d => d.id === field.value);
                                return `${d?.name} · ${d?.licenseNumber}`;
                              })()
                            : field.value
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
                )}
              />
              {createErrors.driverId && (
                <p className="text-xs text-destructive font-medium mt-0.5">{createErrors.driverId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <WeightIcon className="size-3.5 text-amber-500" />
                  Cargo Weight (kg)
                </label>
                <Input
                  {...registerCreate("cargoWeight")}
                  type="number"
                  placeholder="e.g. 5000"
                  className="h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm transition-all"
                />
                {createErrors.cargoWeight && (
                  <p className="text-xs text-destructive font-medium mt-0.5">{createErrors.cargoWeight.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <RouteIcon className="size-3.5 text-sky-500" />
                  Planned Distance (km)
                </label>
                <Input
                  {...registerCreate("plannedDistance")}
                  type="number"
                  placeholder="e.g. 300"
                  className="h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm transition-all"
                />
                {createErrors.plannedDistance && (
                  <p className="text-xs text-destructive font-medium mt-0.5">{createErrors.plannedDistance.message}</p>
                )}
              </div>
            </div>

            {/* Capacity Warn Alert Block */}
            {isOverweight && (
              <div className="p-3 bg-red-50/50 border border-red-200 rounded-2xl space-y-1 text-xs animate-pulse">
                <p className="font-bold text-red-800">Vehicle Capacity: {maxCapacity} kg</p>
                <p className="font-bold text-red-800">Cargo Weight: {watchedCargoWeight} kg</p>
                <p className="font-semibold text-red-700 flex items-center gap-1">
                  <span>❌</span> Capacity exceeded by {exceededWeight} kg — dispatch blocked
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={isOverweight || isCreating || createMutation.isPending}
                className="flex-1 h-10 rounded-xl bg-[#0d5c3a] hover:bg-[#064e3b] text-white text-xs font-bold transition-all cursor-pointer shadow-sm border-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOverweight ? "Dispatch Blocked" : createMutation.isPending ? "Creating..." : "Schedule Trip"}
              </Button>
              <Button
                type="button"
                onClick={() => resetCreate()}
                className="px-4 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm border-0"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* ════ RIGHT COLUMN: LIVE BOARD ════ */}
      <div className="lg:col-span-7 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Live Board
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Real-time Operations Tracker</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 w-full sm:w-44 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "ALL")}>
              <SelectTrigger className="w-28 !h-8 bg-white border border-slate-200 rounded-lg text-xs text-slate-700">
                <SelectValue placeholder="Status: All" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-slate-200">
                <SelectItem value="ALL">All Status</SelectItem>
                {Object.values(TripStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Live Board Grid Cards */}
        {filteredTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
            <SearchXIcon className="size-8 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No active trips found</p>
          </div>
        ) : (
          <div className="lg:max-h-[calc(100vh-19rem)] lg:overflow-y-auto pr-1 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {filteredTrips.map((trip, idx) => {
              const tripCode = `TR${(idx + 1).toString().padStart(3, "0")}`;
              const vehicleName = trip.vehicle?.name || "Unassigned";
              const driverName = trip.driver?.name || "Unassigned";

              let subtextInfo = "";
              if (trip.status === TripStatus.DISPATCHED) {
                subtextInfo = `${Math.round(trip.plannedDistance * 1.2)} min`;
              } else if (trip.status === TripStatus.DRAFT) {
                subtextInfo = "Awaiting driver";
              } else if (trip.status === TripStatus.CANCELLED) {
                subtextInfo = "Vehicle went to shop";
              } else if (trip.status === TripStatus.COMPLETED) {
                const actDist = trip.actualDistance ?? trip.plannedDistance;
                if (actDist > trip.plannedDistance) {
                  const extraDist = actDist - trip.plannedDistance;
                  subtextInfo = `Completed (${trip.plannedDistance} km +${Math.round(extraDist)} km)`;
                } else {
                  subtextInfo = `Completed (${actDist} km)`;
                }
              }

              return (
                <div
                  key={trip.id}
                  onClick={() => setSelectedTripId(trip.id)}
                  className={`relative p-5 border border-dashed rounded-2xl bg-white shadow-sm hover:shadow-md transition-all space-y-3 cursor-pointer group ${
                    selectedTripId === trip.id
                      ? "border-[#0d5c3a] ring-2 ring-[#0d5c3a]/10"
                      : "border-slate-200 hover:border-[#0d5c3a]/50"
                  }`}
                >
                  {/* Actions Dropdown dots */}
                  <div className="absolute right-4 top-4 z-20">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-[#eef6f2] hover:text-[#0d5c3a] outline-none transition-all cursor-pointer border-0">
                        <MoreVerticalIcon className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 bg-white border border-slate-200/80 rounded-xl shadow-lg p-1">
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-xs font-semibold text-slate-600 focus:bg-slate-50 focus:text-slate-900 rounded-lg py-2"
                          onClick={() => setViewingTripId(trip.id)}
                        >
                          <ExternalLinkIcon className="size-3.5 text-slate-400" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="-mx-1 my-1 border-slate-100" />
                        {trip.status === TripStatus.DRAFT && (
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-xs font-semibold text-amber-600 focus:bg-amber-50 focus:text-amber-700 rounded-lg py-2"
                            onClick={() => dispatchMutation.mutate({ id: trip.id })}
                            disabled={dispatchMutation.isPending}
                          >
                            <SendIcon className="size-3.5" />
                            <span>Dispatch</span>
                          </DropdownMenuItem>
                        )}
                        {trip.status === TripStatus.DISPATCHED && (
                          <>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-semibold text-[#0d5c3a] focus:bg-[#eef6f2] focus:text-[#0d5c3a] rounded-lg py-2"
                              onClick={() => {
                                const startOdo = trip.startOdometer ?? trip.vehicle?.odometer ?? 0;
                                const plannedEndOdo = startOdo + trip.plannedDistance;
                                setCompletingId(trip.id);
                                setCurrentOdometer(plannedEndOdo.toString());
                              }}
                            >
                              <CheckCircle2Icon className="size-3.5" />
                              <span>Complete</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-semibold text-red-600 focus:bg-red-50 focus:text-red-700 rounded-lg py-2"
                              onClick={() => setCancellingId(trip.id)}
                            >
                              <XCircleIcon className="size-3.5" />
                              <span>Cancel</span>
                            </DropdownMenuItem>
                          </>
                        )}
                        {trip.status === TripStatus.DRAFT && (
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-xs font-semibold text-red-600 focus:bg-red-50 focus:text-red-700 rounded-lg py-2"
                            onClick={() => setCancellingId(trip.id)}
                          >
                            <XCircleIcon className="size-3.5" />
                            <span>Cancel</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Header Row */}
                  <div className="flex justify-between items-center pr-8">
                    <span className="font-bold text-slate-800 text-sm">{tripCode}</span>
                    <span className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider">
                      {vehicleName} / {driverName}
                    </span>
                  </div>

                  {/* Route Row */}
                  <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                    <span>{trip.source}</span>
                    <span className="text-[#0d5c3a] text-xs">➔</span>
                    <span>{trip.destination}</span>
                  </div>

                  {/* Footer Row */}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100/50">
                    <Badge
                      className={`${statusStyles[trip.status as TripStatus]} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-none border-0`}
                    >
                      {trip.status}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-500">
                      {subtextInfo}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider pt-2">
          On Complete: odometer ➔ fuel log ➔ expenses ➔ Vehicle & Driver Available
        </p>
      </div>

      {/* ════ DIALOGS ════ */}
      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancellingId} onOpenChange={(open) => !open && setCancellingId(null)}>
        <DialogContent className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-sm p-6">
          <DialogHeader className="space-y-2">
            <div className="size-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mb-2">
              <XCircleIcon className="size-5" />
            </div>
            <DialogTitle className="text-base font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>Cancel Trip</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to cancel this trip? The vehicle and driver will be released back to available.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setCancellingId(null)} className="h-9 text-xs font-bold border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">Keep</Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => cancellingId && cancelMutation.mutate({ id: cancellingId })}
              className="h-9 text-xs font-bold rounded-xl cursor-pointer bg-red-600 hover:bg-red-700 text-white"
            >
              {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel Trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Trip Dialog */}
      <Dialog open={!!completingId} onOpenChange={(open) => !open && setCompletingId(null)}>
        {(() => {
          const trip = trips?.find(t => t.id === completingId);
          if (!trip) return null;
          const startOdo = trip.startOdometer ?? trip.vehicle?.odometer ?? 0;
          const plannedEndOdo = startOdo + trip.plannedDistance;
          const enteredOdo = Number(currentOdometer) || 0;
          const extraKm = Math.max(0, enteredOdo - plannedEndOdo);

          return (
            <DialogContent className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-sm p-6">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-base font-bold text-slate-900" style={{ fontFamily: "var(--font-space-grotesk)" }}>Complete Trip</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Update the vehicle's odometer to log the final trip distance.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-3">
                {/* Operational Stats panel */}
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-1.5 text-xs text-slate-600 font-semibold">
                  <div className="flex justify-between">
                    <span>Start Odometer:</span>
                    <span className="text-slate-900 font-bold">{startOdo.toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Planned Distance:</span>
                    <span className="text-slate-900 font-bold">{trip.plannedDistance.toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/50 pt-1.5 mt-1 text-slate-400 font-normal">
                    <span>Planned End Odometer:</span>
                    <span className="text-slate-500 font-semibold">{plannedEndOdo.toLocaleString()} km</span>
                  </div>
                </div>

                {/* Main input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Odometer (km)</label>
                  <Input
                    type="number"
                    value={currentOdometer}
                    onChange={(e) => setCurrentOdometer(e.target.value)}
                    placeholder="e.g. 100280"
                    className="h-10 border-slate-200 focus:border-[#0d5c3a] focus:ring-[#0d5c3a] rounded-xl text-sm"
                  />
                </div>

                {/* Live indicator if traveled more than planned */}
                {extraKm > 0 && (
                  <div className="text-[11px] font-bold text-[#0d5c3a] bg-[#eef6f2] px-3 py-2 rounded-lg border border-emerald-100/50 flex items-center gap-1.5 animate-fade">
                    <span>+{extraKm} km extra distance will be added to Completed status.</span>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:justify-end mt-2">
                <Button variant="outline" onClick={() => setCompletingId(null)} className="h-9 text-xs font-bold border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">Cancel</Button>
                <Button
                  disabled={completeMutation.isPending}
                  onClick={handleComplete}
                  className="h-9 text-xs font-bold rounded-xl cursor-pointer bg-[#0d5c3a] hover:bg-[#064e3b] text-white border-0"
                >
                  {completeMutation.isPending ? "Completing..." : "Complete Trip"}
                </Button>
              </DialogFooter>
            </DialogContent>
          );
        })()}
      </Dialog>

      {/* Trip Details Dialog */}
      <Dialog open={!!viewingTripId} onOpenChange={(open) => !open && setViewingTripId(null)}>
        {(() => {
          const trip = trips?.find(t => t.id === viewingTripId);
          if (!trip) return null;

          const tripCode = `TR${(trips?.findIndex(t => t.id === trip.id) ?? 0 + 1).toString().padStart(3, "0")}`;
          const isCompleted = trip.status === TripStatus.COMPLETED;
          const actDist = trip.actualDistance ?? trip.plannedDistance;
          const extraKm = Math.max(0, actDist - trip.plannedDistance);
          const startOdo = trip.startOdometer ?? trip.vehicle?.odometer ?? 0;
          const endOdo = trip.endOdometer ?? (startOdo + actDist);

          return (
            <DialogContent className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-md p-6">
              <DialogHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-base font-bold text-slate-900" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    Trip Details • {tripCode}
                  </DialogTitle>
                  <span className={`${statusStyles[trip.status as TripStatus]} px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider`}>
                    {trip.status === "DISPATCHED" ? "ON TRIP" : trip.status}
                  </span>
                </div>
                <DialogDescription className="text-xs text-slate-500">
                  Detailed logs and metrics for this logistics run.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3 text-xs">
                {/* Route Section */}
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Route & Distance</p>
                  <div className="flex justify-between font-semibold">
                    <span>From / To:</span>
                    <span className="text-slate-900 font-bold">{trip.source} ➔ {trip.destination}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Planned Distance:</span>
                    <span className="text-slate-900 font-bold">{trip.plannedDistance.toLocaleString()} km</span>
                  </div>
                  {isCompleted && (
                    <div className="flex justify-between border-t border-slate-200/50 pt-2 mt-2 font-semibold">
                      <span>Actual Traveled:</span>
                      <span className="text-slate-900 font-bold">
                        {trip.plannedDistance} km
                        {extraKm > 0 && <span className="text-[#0d5c3a] ml-1">+{Math.round(extraKm)} km</span>}
                      </span>
                    </div>
                  )}
                </div>

                {/* Vehicle & Driver grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-100 p-3.5 rounded-xl space-y-1.5 bg-slate-50/30">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vehicle</p>
                    <p className="text-slate-900 font-bold">{trip.vehicle?.name}</p>
                    <p className="text-slate-500 font-semibold text-[10px]">{trip.vehicle?.registrationNumber}</p>
                    <p className="text-slate-400 font-medium text-[9px]">{trip.vehicle?.maxLoadCapacity.toLocaleString()} kg payload</p>
                  </div>
                  <div className="border border-slate-100 p-3.5 rounded-xl space-y-1.5 bg-slate-50/30">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Driver</p>
                    <p className="text-slate-900 font-bold">{trip.driver?.name}</p>
                    <p className="text-slate-500 font-semibold text-[10px]">{trip.driver?.licenseNumber}</p>
                    <p className="text-slate-400 font-medium text-[9px]">{trip.driver?.phone || "—"}</p>
                  </div>
                </div>

                {/* Financials & Odometer Section */}
                <div className="border border-slate-150 p-3.5 rounded-xl space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Odometer & Resource Logs</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600">
                    <div>Start Odometer: <span className="text-slate-900 font-bold">{startOdo.toLocaleString()} km</span></div>
                    <div>End Odometer: <span className="text-slate-900 font-bold">{isCompleted ? `${endOdo.toLocaleString()} km` : "—"}</span></div>
                    <div className="col-span-2 border-t border-slate-100 pt-2 mt-1" />
                    <div>Revenue: <span className="text-emerald-700 font-bold">₹ {Math.round(trip.revenue ?? (actDist * 45)).toLocaleString()}</span></div>
                    <div>Fuel Logged: <span className="text-blue-700 font-bold">{trip.fuelUsed ? `${trip.fuelUsed} L` : `${Math.round(actDist * 0.18)} L`}</span></div>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-2">
                <Button onClick={() => setViewingTripId(null)} className="w-full h-10 rounded-xl cursor-pointer bg-[#0d5c3a] hover:bg-[#064e3b] text-white border-0 font-bold text-xs">
                  Close Details
                </Button>
              </DialogFooter>
            </DialogContent>
          );
        })()}
      </Dialog>
    </div>
  );
}
