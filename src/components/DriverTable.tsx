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
import { DriverStatus } from "@/lib/enums";
import { toast } from "sonner";

const statusStyles = {
  [DriverStatus.AVAILABLE]: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  [DriverStatus.ON_TRIP]: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  [DriverStatus.OFF_DUTY]: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  [DriverStatus.SUSPENDED]: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
};

const isLicenseExpired = (expiryDate: Date | string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(expiryDate) < today;
};


interface DriverTableProps {
  onEdit?: (id: string) => void;
}

export default function DriverTable({ onEdit }: DriverTableProps = {}) {
  const utils = api.useUtils();
  const { data: drivers, isLoading } = api.driver.getAll.useQuery();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteMutation = api.driver.delete.useMutation({
    onSuccess: () => {
      toast.success("Driver deleted successfully");
      utils.driver.getAll.invalidate();
      setDeletingId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete driver");
    },
  });

  const handleDelete = () => {
    if (deletingId) {
      deleteMutation.mutate({ id: deletingId });
    }
  };

  const uniqueCategories = useMemo(() => {
    if (!drivers) return [];
    const categories = drivers.map((d) => d.licenseCategory);
    return Array.from(new Set(categories)).filter(Boolean);
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    if (!drivers) return [];
    return drivers.filter((driver) => {
      const matchesSearch =
        driver.name.toLowerCase().includes(search.toLowerCase()) ||
        driver.licenseNumber.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || driver.status === statusFilter;
      const matchesCategory =
        categoryFilter === "ALL" ||
        driver.licenseCategory.toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [drivers, search, statusFilter, categoryFilter]);

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
            placeholder="Search by name or license number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 border-zinc-200 dark:border-zinc-800"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-44 h-10 border-zinc-200 dark:border-zinc-800">
            <SelectValue placeholder="Category: All">
              {categoryFilter === "ALL" ? "Category: All" : categoryFilter}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Category: All</SelectItem>
            {uniqueCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
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
            {Object.values(DriverStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table / Empty States */}
      {filteredDrivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/20 dark:bg-zinc-950/20">
          <SearchXIcon className="size-8 text-zinc-400 mb-3" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">No drivers found</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Try adjusting your search query or filters.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50 dark:bg-zinc-950/20">
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3 pl-4">
                  Name
                </TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">
                  License Number
                </TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">
                  Category
                </TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">
                  Expiry Date
                </TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">
                  Safety Score
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
              {filteredDrivers.map((driver) => (
                <TableRow
                  key={driver.id}
                  className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10"
                >
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100 py-3.5 pl-4">
                    {driver.name}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400 py-3.5">
                    {driver.licenseNumber}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400 py-3.5">
                    {driver.licenseCategory}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                        {new Date(driver.licenseExpiry).toLocaleDateString()}
                      </span>
                      {isLicenseExpired(driver.licenseExpiry) ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          <span>🔴</span> Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <span>🟢</span> Valid
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {driver.safetyScore}
                      </span>
                      <span className="text-xs text-zinc-400">/ 100</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <Badge
                      className={`${
                        statusStyles[driver.status as DriverStatus]
                      } px-2 py-0.5 rounded-full`}
                    >
                      {driver.status.replace("_", " ")}
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
                          onClick={() => onEdit && onEdit(driver.id)}
                        >
                          <EditIcon className="size-3.5 text-zinc-500" />
                          <span>Edit details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer data-disabled:pointer-events-none data-disabled:opacity-50"
                          disabled={driver.status === DriverStatus.ON_TRIP}
                          onClick={() => setDeletingId(driver.id)}
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
            <DialogTitle>Delete Driver</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this driver? This action cannot be
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
