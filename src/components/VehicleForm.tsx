"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createVehicleSchema } from "@/lib/validations/vehicle";
import { api } from "@/trpc/react";
import { toast } from "sonner";
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
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { MoreVerticalIcon, EditIcon, TrashIcon, Loader2Icon } from "lucide-react";
import { VehicleStatus } from "@/lib/enums";

interface VehicleFormProps {
  vehicleId?: string;
  onSuccess?: () => void;
}

export default function VehicleForm({ vehicleId, onSuccess }: VehicleFormProps = {}) {
  const utils = api.useUtils();
  const isEditing = !!vehicleId;

  const { data: vehicle, isLoading } = api.vehicle.get.useQuery(
    { id: vehicleId! },
    { enabled: isEditing }
  );

  const createMutation = api.vehicle.create.useMutation({
    onSuccess: () => {
      toast.success("Vehicle created successfully");
      reset();
      utils.vehicle.list.invalidate();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create vehicle");
    },
  });

  const updateMutation = api.vehicle.update.useMutation({
    onSuccess: () => {
      toast.success("Vehicle updated successfully");
      utils.vehicle.list.invalidate();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update vehicle");
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: {
      registrationNumber: "",
      name: "",
      type: "",
      maxLoadCapacity: 0,
      odometer: 0,
      acquisitionCost: 0,
      status: VehicleStatus.AVAILABLE,
    },
  });

  React.useEffect(() => {
    if (vehicle) {
      reset({
        registrationNumber: vehicle.registrationNumber,
        name: vehicle.name,
        type: vehicle.type,
        maxLoadCapacity: vehicle.maxLoadCapacity,
        odometer: vehicle.odometer,
        acquisitionCost: vehicle.acquisitionCost,
        status: vehicle.status as VehicleStatus,
      });
    }
  }, [vehicle, reset]);

  const onSubmit = (values: any) => {
    if (isEditing) {
      updateMutation.mutate({ id: vehicleId!, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoading) {
    return (
      <div className="flex h-40 w-full items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-5">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          {isEditing ? "Edit Vehicle" : "Add New Vehicle"}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {isEditing
            ? "Modify the vehicle parameters below."
            : "Fill in the details to register a new vehicle in the fleet."}
        </p>
      </div>
      <div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Registration Number
              </label>
              <Input
                placeholder="e.g. MH-12-PQ-5678"
                {...register("registrationNumber")}
                className="h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm transition-all"
              />
              {errors.registrationNumber && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.registrationNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Vehicle Name
              </label>
              <Input
                placeholder="e.g. Tata Prima 5530.S"
                {...register("name")}
                className="h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm transition-all"
              />
              {errors.name && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Vehicle Type
              </label>
              <Input
                placeholder="e.g. 10-Wheeler Truck, Dumper"
                {...register("type")}
                className="h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm transition-all"
              />
              {errors.type && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.type.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Maximum Load Capacity (kg)
              </label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 25000"
                {...register("maxLoadCapacity")}
                className="h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm transition-all"
              />
              {errors.maxLoadCapacity && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.maxLoadCapacity.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Odometer (km)
              </label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 15000"
                {...register("odometer")}
                className="h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm transition-all"
              />
              {errors.odometer && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.odometer.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Acquisition Cost (₹)
              </label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 3500000"
                {...register("acquisitionCost")}
                className="h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm transition-all"
              />
              {errors.acquisitionCost && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.acquisitionCost.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Status
              </label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full !h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm text-slate-700">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200">
                      {Object.values(VehicleStatus).map((val) => (
                        <SelectItem key={val} value={val}>
                          {val.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.status.message}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-10 rounded-xl bg-[#0d5c3a] hover:bg-[#064e3b] text-white text-xs font-bold transition-all hover-lift cursor-pointer shadow-sm border-0 mt-4"
          >
            {isPending
              ? isEditing
                ? "Saving changes..."
                : "Creating vehicle..."
              : isEditing
              ? "Save Changes"
              : "Create Vehicle"}
          </Button>
        </form>
      </div>
    </div>
  );
}
