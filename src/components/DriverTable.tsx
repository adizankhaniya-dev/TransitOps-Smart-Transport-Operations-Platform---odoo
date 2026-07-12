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
  [DriverStatus.AVAILABLE]: "bg-[#eef6f2] text-[#0d5c3a] border border-emerald-100/50 hover:bg-emerald-100/50",
  [DriverStatus.ON_TRIP]: "bg-blue-50 text-blue-700 border border-blue-100/50 hover:bg-blue-100/50",
  [DriverStatus.OFF_DUTY]: "bg-amber-50/50 text-amber-700 border border-amber-100/50 hover:bg-amber-100/50",
  [DriverStatus.SUSPENDED]: "bg-red-50 text-red-700 border border-red-100/50 hover:bg-red-100/50",
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
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#9ca3af]" />
          <Input
            placeholder="Search by name or license number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] outline-none shadow-sm transition-all text-xs font-semibold"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-44 !h-10 bg-white border border-slate-200/80 rounded-xl focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] text-xs font-semibold shadow-sm text-slate-700">
            <SelectValue placeholder="Category: All">
              {categoryFilter === "ALL" ? "Category: All" : categoryFilter}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white border border-slate-200">
            <SelectItem value="ALL">Category: All</SelectItem>
            {uniqueCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
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
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-zinc-950/20">
          <SearchXIcon className="size-8 text-slate-400 mb-3" />
          <h3 className="font-extrabold text-sm text-slate-800" style={{ fontFamily: "var(--font-space-grotesk)" }}>No drivers found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or filters.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-slate-200/60 shadow-sm rounded-2xl bg-white animate-fadeup">
          <Table>
            <TableHeader className="bg-[#fcfdfc] border-b border-slate-200/40">
              <TableRow className="hover:bg-transparent border-b border-slate-200/40">
                <TableHead className="font-extrabold text-slate-500 py-3 pl-5 text-[10px] uppercase tracking-wider">
                  Name
                </TableHead>
                <TableHead className="font-extrabold text-slate-500 py-3 text-[10px] uppercase tracking-wider">
                  License Number
                </TableHead>
                <TableHead className="font-extrabold text-slate-500 py-3 text-[10px] uppercase tracking-wider">
                  Category
                </TableHead>
                <TableHead className="font-extrabold text-slate-500 py-3 text-[10px] uppercase tracking-wider">
                  Expiry Date
                </TableHead>
                <TableHead className="font-extrabold text-slate-500 py-3 text-[10px] uppercase tracking-wider">
                  Contact Number
                </TableHead>
                <TableHead className="font-extrabold text-slate-500 py-3 text-[10px] uppercase tracking-wider">
                  Trips Completed
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
              {filteredDrivers.map((driver) => (
                <TableRow
                  key={driver.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-[#fcfdfc] transition-all"
                >
                  <TableCell className="font-bold text-slate-800 text-xs py-3.5 pl-5">
                    {driver.name}
                  </TableCell>
                  <TableCell className="text-slate-600 text-xs font-semibold py-3.5">
                    {driver.licenseNumber}
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs py-3.5">
                    {driver.licenseCategory}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-700 font-semibold text-xs">
                        {new Date(driver.licenseExpiry).toLocaleDateString()}
                      </span>
                      {isLicenseExpired(driver.licenseExpiry) ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-red-600">
                          Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600">
                          Valid
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 text-xs font-semibold py-3.5">
                    {driver.phone || "—"}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <span className="font-bold text-xs text-slate-700">
                      {((driver as any).trips ?? []).filter((t: any) => t.status === "COMPLETED").length}
                    </span>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <Badge
                      className={`${
                        statusStyles[driver.status as DriverStatus]
                      } px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-none border-0`}
                    >
                      {driver.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3.5 pr-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-[#eef6f2] hover:text-[#0d5c3a] outline-none transition-all cursor-pointer border-0">
                        <MoreVerticalIcon className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36 bg-white border border-slate-200/80 rounded-xl shadow-lg p-1">
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-xs font-semibold text-slate-600 focus:bg-slate-50 focus:text-slate-900 rounded-lg py-2"
                          onClick={() => onEdit && onEdit(driver.id)}
                        >
                          <EditIcon className="size-3.5 text-slate-400" />
                          <span>Edit details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer text-xs font-semibold rounded-lg py-2 data-disabled:pointer-events-none data-disabled:opacity-50"
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
        <DialogContent className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-sm p-6">
          <DialogHeader className="space-y-2">
            <div className="size-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mb-2">
              <TrashIcon className="size-5" />
            </div>
            <DialogTitle className="text-base font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>Delete Driver</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete this driver? This action is permanent and cannot be undone.
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
