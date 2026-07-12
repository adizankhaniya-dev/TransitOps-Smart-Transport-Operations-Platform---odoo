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
    <div className="w-full max-w-2xl space-y-5">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          {isEditing ? "Edit Driver" : "Register New Driver"}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {isEditing
            ? "Modify driver details and scoring parameters below."
            : "Fill in the details to register a new driver in the system."}
        </p>
      </div>
      <div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Driver Name
              </label>
              <Input
                placeholder="e.g. Ramesh Kumar"
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
                License Number
              </label>
              <Input
                placeholder="e.g. MH-12-2018-0098765"
                {...register("licenseNumber")}
                className="h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm transition-all"
              />
              {errors.licenseNumber && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.licenseNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                License Category
              </label>
              <Input
                placeholder="e.g. HGV (Heavy Goods Vehicle)"
                {...register("licenseCategory")}
                className="h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm transition-all"
              />
              {errors.licenseCategory && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.licenseCategory.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                License Expiry Date
              </label>
              <Input
                type="date"
                {...register("licenseExpiry")}
                className="h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm transition-all"
              />
              {errors.licenseExpiry && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.licenseExpiry.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Phone Number
              </label>
              <Input
                placeholder="e.g. +91 98765 43210"
                {...register("phone")}
                className="h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm transition-all"
              />
              {errors.phone && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
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
            className="w-full h-10 rounded-xl bg-[#0d5c3a] hover:bg-[#064e3b] text-white text-xs font-bold transition-all hover-lift cursor-pointer shadow-sm border-0 mt-4"
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
      </div>
    </div>
  );
}
