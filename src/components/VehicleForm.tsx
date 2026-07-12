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
    <Card className="w-full max-w-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          {isEditing ? "Edit Vehicle" : "Add New Vehicle"}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? "Modify the vehicle parameters below."
            : "Fill in the details to register a new vehicle in the fleet."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Registration Number
              </label>
              <Input
                placeholder="e.g. TX-1234-AB"
                {...register("registrationNumber")}
                className="h-10 border-zinc-200 dark:border-zinc-800"
              />
              {errors.registrationNumber && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.registrationNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Vehicle Name
              </label>
              <Input
                placeholder="e.g. Volvo FH16"
                {...register("name")}
                className="h-10 border-zinc-200 dark:border-zinc-800"
              />
              {errors.name && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Vehicle Type
              </label>
              <Input
                placeholder="e.g. Semi-truck, Van"
                {...register("type")}
                className="h-10 border-zinc-200 dark:border-zinc-800"
              />
              {errors.type && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.type.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Maximum Load Capacity (kg)
              </label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 25000"
                {...register("maxLoadCapacity")}
                className="h-10 border-zinc-200 dark:border-zinc-800"
              />
              {errors.maxLoadCapacity && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.maxLoadCapacity.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Odometer (km)
              </label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 15000"
                {...register("odometer")}
                className="h-10 border-zinc-200 dark:border-zinc-800"
              />
              {errors.odometer && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.odometer.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Acquisition Cost ($)
              </label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 85000"
                {...register("acquisitionCost")}
                className="h-10 border-zinc-200 dark:border-zinc-800"
              />
              {errors.acquisitionCost && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.acquisitionCost.message}
                </p>
              )}
            </div>

            <div className="space-y-1 col-span-1 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Status
              </label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full h-10 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
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
            className="w-full h-10 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 font-semibold transition-all mt-4"
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
      </CardContent>
    </Card>
  );
}
