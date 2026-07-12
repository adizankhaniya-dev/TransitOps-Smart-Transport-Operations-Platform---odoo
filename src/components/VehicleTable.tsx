"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
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
  EditIcon,
  TrashIcon,
  SearchIcon,
  SearchXIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { VehicleStatus } from "@/lib/enums";
import { toast } from "sonner";

const statusStyles = {
  [VehicleStatus.AVAILABLE]: "bg-[#eef6f2] text-[#0d5c3a] border border-emerald-100/50 hover:bg-emerald-100/50",
  [VehicleStatus.ON_TRIP]: "bg-blue-50 text-blue-700 border border-blue-100/50 hover:bg-blue-100/50",
  [VehicleStatus.IN_SHOP]: "bg-amber-50/50 text-amber-700 border border-amber-100/50 hover:bg-amber-100/50",
  [VehicleStatus.RETIRED]: "bg-slate-50 text-slate-700 border border-slate-200/50 hover:bg-slate-100/50",
};

interface VehicleTableProps {
  onEdit?: (id: string) => void;
}

export default function VehicleTable({ onEdit }: VehicleTableProps = {}) {
  const router = useRouter();
  const utils = api.useUtils();
  const { data: vehicles, isLoading } = api.vehicle.list.useQuery();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteMutation = api.vehicle.delete.useMutation({
    onSuccess: () => {
      toast.success("Vehicle deleted successfully");
      utils.vehicle.list.invalidate();
      setDeletingId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete vehicle");
    },
  });

  const handleDelete = () => {
    if (deletingId) {
      deleteMutation.mutate({ id: deletingId });
    }
  };

  const uniqueTypes = useMemo(() => {
    if (!vehicles) return [];
    const types = vehicles.map((v) => v.type);
    return Array.from(new Set(types)).filter(Boolean);
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    return vehicles.filter((vehicle) => {
      const matchesSearch =
        vehicle.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || vehicle.status === statusFilter;
      const matchesType =
        typeFilter === "ALL" || vehicle.type.toLowerCase() === typeFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [vehicles, search, statusFilter, typeFilter]);

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Controls Skeleton */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-full sm:flex-1 animate-pulse" />
          <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-36 animate-pulse" />
          <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-36 animate-pulse" />
        </div>
        {/* Table Skeleton */}
        <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm animate-pulse">
          <div className="h-10 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 px-4 flex items-center">
            <div className="w-full grid grid-cols-7 gap-4">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4 justify-self-end" />
            </div>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-4 py-4 flex items-center">
                <div className="w-full grid grid-cols-7 gap-4">
                  <div className="h-4 bg-zinc-100 dark:bg-zinc-800/50 rounded w-1/2" />
                  <div className="h-4 bg-zinc-100 dark:bg-zinc-800/50 rounded w-2/3" />
                  <div className="h-4 bg-zinc-100 dark:bg-zinc-800/50 rounded w-1/3" />
                  <div className="h-4 bg-zinc-100 dark:bg-zinc-800/50 rounded w-1/2" />
                  <div className="h-4 bg-zinc-100 dark:bg-zinc-800/50 rounded w-1/2" />
                  <div className="h-4 bg-zinc-100 dark:bg-zinc-800/50 rounded w-1/3" />
                  <div className="h-4 bg-zinc-100 dark:bg-zinc-800/50 rounded w-1/4 justify-self-end" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#9ca3af]" />
          <Input
            placeholder="Search by registration or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] outline-none shadow-sm transition-all text-xs font-semibold"
          />
        </div>
        <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-44 !h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm text-slate-700">
            <SelectValue placeholder="Type: All">
              {typeFilter === "ALL" ? "Type: All" : typeFilter}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white border border-slate-200">
            <SelectItem value="ALL">Type: All</SelectItem>
            {uniqueTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-44 !h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm text-slate-700">
            <SelectValue placeholder="Status: All">
              {statusFilter === "ALL" ? "Status: All" : statusFilter.replace("_", " ")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white border border-slate-200">
            <SelectItem value="ALL">Status: All</SelectItem>
            {Object.values(VehicleStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table / Empty States */}
      {filteredVehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-zinc-950/20">
          <SearchXIcon className="size-8 text-slate-400 mb-3" />
          <h3 className="font-extrabold text-sm text-slate-800" style={{ fontFamily: "var(--font-space-grotesk)" }}>No vehicles found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or status filter.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-slate-200/60 shadow-sm rounded-2xl bg-white animate-fadeup">
          <Table>
            <TableHeader className="bg-[#fcfdfc] border-b border-slate-200/40">
              <TableRow className="hover:bg-transparent border-b border-slate-200/40">
                <TableHead className="font-extrabold text-slate-500 py-3 pl-5 text-[10px] uppercase tracking-wider">
                  Registration
                </TableHead>
                <TableHead className="font-extrabold text-slate-500 py-3 text-[10px] uppercase tracking-wider">
                  Vehicle
                </TableHead>
                <TableHead className="font-extrabold text-slate-500 py-3 text-[10px] uppercase tracking-wider">
                  Type
                </TableHead>
                <TableHead className="font-extrabold text-slate-500 py-3 text-[10px] uppercase tracking-wider">
                  Capacity
                </TableHead>
                <TableHead className="font-extrabold text-slate-500 py-3 text-[10px] uppercase tracking-wider">
                  Odometer
                </TableHead>
                <TableHead className="font-extrabold text-slate-500 py-3 text-[10px] uppercase tracking-wider">
                  Acquisition Cost
                </TableHead>
                <TableHead className="font-extrabold text-slate-500 py-3 text-[10px] uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="font-extrabold text-slate-500 py-3 pr-5 text-[10px] uppercase tracking-wider text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => (
                <TableRow
                  key={vehicle.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-[#fcfdfc] transition-all"
                >
                  <TableCell className="font-bold text-slate-800 text-xs py-3.5 pl-5">
                    {vehicle.registrationNumber}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-700 text-xs py-3.5">
                    {vehicle.name}
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs py-3.5">
                    {vehicle.type}
                  </TableCell>
                  <TableCell className="text-slate-600 text-xs font-semibold py-3.5">
                    {vehicle.maxLoadCapacity.toLocaleString()} kg
                  </TableCell>
                  <TableCell className="text-slate-600 text-xs font-semibold py-3.5">
                    {vehicle.odometer.toLocaleString()} km
                  </TableCell>
                  <TableCell className="text-slate-600 text-xs font-semibold py-3.5">
                    ₹{vehicle.acquisitionCost.toLocaleString()}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <Badge
                      className={`${
                        statusStyles[vehicle.status as VehicleStatus]
                      } px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-none border-0`}
                    >
                      {vehicle.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3.5 pr-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-[#eef6f2] hover:text-[#0d5c3a] outline-none transition-all cursor-pointer border-0">
                        <MoreVerticalIcon className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 bg-white border border-slate-200/80 rounded-xl shadow-lg p-1">
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-xs font-semibold text-slate-600 focus:bg-slate-50 focus:text-slate-900 rounded-lg py-2"
                          onClick={() => onEdit && onEdit(vehicle.id)}
                        >
                          <EditIcon className="size-3.5 text-slate-400" />
                          <span>Edit details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer text-xs font-semibold rounded-lg py-2 data-disabled:pointer-events-none data-disabled:opacity-50"
                          disabled={vehicle.status === VehicleStatus.ON_TRIP}
                          onClick={() => setDeletingId(vehicle.id)}
                        >
                          <TrashIcon className="size-3.5" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <DialogContent className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-sm p-6">
          <DialogHeader className="space-y-2">
            <div className="size-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mb-2">
              <TrashIcon className="size-5" />
            </div>
            <DialogTitle className="text-base font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>Delete Vehicle</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete this vehicle? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDeletingId(null)} className="h-9 text-xs font-bold border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="h-9 text-xs font-bold rounded-xl cursor-pointer bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
