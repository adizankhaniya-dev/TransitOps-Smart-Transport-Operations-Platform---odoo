"use client";

import * as React from "react";
import { useState, useMemo } from "react";
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
} from "lucide-react";
import { VehicleStatus } from "@/lib/enums";
import { toast } from "sonner";

const statusStyles = {
  [VehicleStatus.AVAILABLE]: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  [VehicleStatus.ON_TRIP]: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  [VehicleStatus.IN_SHOP]: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  [VehicleStatus.RETIRED]: "bg-zinc-50 text-zinc-700 border border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20",
};

interface VehicleTableProps {
  onEdit?: (id: string) => void;
}

export default function VehicleTable({ onEdit }: VehicleTableProps = {}) {
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
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input
            placeholder="Search by registration or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 border-zinc-200 dark:border-zinc-800"
          />
        </div>
        <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-44 h-10 border-zinc-200 dark:border-zinc-800">
            <SelectValue placeholder="Type: All">
              {typeFilter === "ALL" ? "Type: All" : typeFilter}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Type: All</SelectItem>
            {uniqueTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-44 h-10 border-zinc-200 dark:border-zinc-800">
            <SelectValue placeholder="Status: All">
              {statusFilter === "ALL" ? "Status: All" : statusFilter.replace("_", " ")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
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
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/20 dark:bg-zinc-950/20">
          <SearchXIcon className="size-8 text-zinc-400 mb-3" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">No vehicles found</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Try adjusting your search query or status filter.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50 dark:bg-zinc-950/20">
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3 pl-4">
                  Registration
                </TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">
                  Vehicle
                </TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">
                  Type
                </TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">
                  Capacity
                </TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">
                  Odometer
                </TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3 pr-4 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => (
                <TableRow
                  key={vehicle.id}
                  className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10"
                >
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100 py-3.5 pl-4">
                    {vehicle.registrationNumber}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400 py-3.5">
                    {vehicle.name}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400 py-3.5">
                    {vehicle.type}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400 py-3.5">
                    {vehicle.maxLoadCapacity.toLocaleString()} kg
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400 py-3.5">
                    {vehicle.odometer.toLocaleString()} km
                  </TableCell>
                  <TableCell className="py-3.5">
                    <Badge
                      className={`${
                        statusStyles[vehicle.status as VehicleStatus]
                      } px-2 py-0.5 rounded-full`}
                    >
                      {vehicle.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3.5 pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 outline-none transition-colors">
                        <MoreVerticalIcon className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer"
                          onClick={() => onEdit && onEdit(vehicle.id)}
                        >
                          <EditIcon className="size-3.5 text-zinc-500" />
                          <span>Edit details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vehicle</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this vehicle? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
