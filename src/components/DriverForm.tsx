"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createDriverSchema } from "@/lib/validations/driver";
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
import { Loader2Icon } from "lucide-react";
import { DriverStatus } from "@/lib/enums";

interface DriverFormProps {
  driverId?: string;
  onSuccess?: () => void;
}

const formatDateForInput = (dateVal: any) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

export default function DriverForm({ driverId, onSuccess }: DriverFormProps = {}) {
  const utils = api.useUtils();
  const isEditing = !!driverId;

  const { data: driver, isLoading } = api.driver.getById.useQuery(
    { id: driverId! },
    { enabled: isEditing }
  );

  const createMutation = api.driver.create.useMutation({
    onSuccess: () => {
      toast.success("Driver registered successfully");
      reset();
      utils.driver.getAll.invalidate();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to register driver");
    },
  });

  const updateMutation = api.driver.update.useMutation({
    onSuccess: () => {
      toast.success("Driver updated successfully");
      utils.driver.getAll.invalidate();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update driver");
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createDriverSchema),
    defaultValues: {
      name: "",
      licenseNumber: "",
      licenseCategory: "",
      phone: "",
      safetyScore: 100,
      licenseExpiry: "" as any,
      status: DriverStatus.AVAILABLE,
    },
  });

  React.useEffect(() => {
    if (driver) {
      reset({
        name: driver.name,
        licenseNumber: driver.licenseNumber,
        licenseCategory: driver.licenseCategory,
        phone: driver.phone,
        safetyScore: driver.safetyScore,
        licenseExpiry: formatDateForInput(driver.licenseExpiry) as any,
        status: driver.status as DriverStatus,
      });
    }
  }, [driver, reset]);

  const onSubmit = (values: any) => {
    if (isEditing) {
      updateMutation.mutate({ id: driverId!, data: values });
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
          {isEditing ? "Edit Driver" : "Register New Driver"}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? "Modify driver details and scoring parameters below."
            : "Fill in the details to register a new driver in the system."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Driver Name
              </label>
              <Input
                placeholder="e.g. John Doe"
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
                License Number
              </label>
              <Input
                placeholder="e.g. DL-982348"
                {...register("licenseNumber")}
                className="h-10 border-zinc-200 dark:border-zinc-800"
              />
              {errors.licenseNumber && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.licenseNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                License Category
              </label>
              <Input
                placeholder="e.g. Class A CDL"
                {...register("licenseCategory")}
                className="h-10 border-zinc-200 dark:border-zinc-800"
              />
              {errors.licenseCategory && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.licenseCategory.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                License Expiry Date
              </label>
              <Input
                type="date"
                {...register("licenseExpiry")}
                className="h-10 border-zinc-200 dark:border-zinc-800"
              />
              {errors.licenseExpiry && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.licenseExpiry.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Phone Number
              </label>
              <Input
                placeholder="e.g. +1 555-0199"
                {...register("phone")}
                className="h-10 border-zinc-200 dark:border-zinc-800"
              />
              {errors.phone && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Safety Score (0 - 100)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                {...register("safetyScore")}
                className="h-10 border-zinc-200 dark:border-zinc-800"
              />
              {errors.safetyScore && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.safetyScore.message}
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
                      {Object.values(DriverStatus).map((val) => (
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
                : "Registering driver..."
              : isEditing
              ? "Save Changes" 
              : "Register Driver"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
