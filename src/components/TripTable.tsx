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
} from "lucide-react";
import { TripStatus } from "@/lib/enums";
import { toast } from "sonner";

const statusStyles = {
  [TripStatus.DRAFT]: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  [TripStatus.DISPATCHED]: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  [TripStatus.COMPLETED]: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  [TripStatus.CANCELLED]: "bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700",
};

interface CompleteFormData {
  actualDistance: string;
  fuelUsed: string;
  revenue: string;
  endOdometer: string;
}

export default function TripTable() {
  const router = useRouter();
  const utils = api.useUtils();
  const { data: trips, isLoading } = api.trip.getAll.useQuery();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completeForm, setCompleteForm] = useState<CompleteFormData>({
    actualDistance: "",
    fuelUsed: "",
    revenue: "",
    endOdometer: "",
  });

  const dispatchMutation = api.trip.dispatch.useMutation({
    onSuccess: () => {
      toast.success("Trip dispatched successfully");
      utils.trip.getAll.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to dispatch trip");
    },
  });

  const completeMutation = api.trip.complete.useMutation({
    onSuccess: () => {
      toast.success("Trip completed successfully");
      utils.trip.getAll.invalidate();
      setCompletingId(null);
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

  const filteredTrips = useMemo(() => {
    if (!trips) return [];
    return trips.filter((trip) => {
      const matchesSearch =
        trip.source.toLowerCase().includes(search.toLowerCase()) ||
        trip.destination.toLowerCase().includes(search.toLowerCase()) ||
        trip.vehicle.name.toLowerCase().includes(search.toLowerCase()) ||
        trip.driver.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || trip.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [trips, search, statusFilter]);

  const handleComplete = () => {
    if (!completingId) return;
    completeMutation.mutate({
      id: completingId,
      actualDistance: Number(completeForm.actualDistance),
      fuelUsed: Number(completeForm.fuelUsed),
      revenue: Number(completeForm.revenue),
      endOdometer: Number(completeForm.endOdometer),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex-1 animate-pulse" />
          <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-36 animate-pulse" />
        </div>
        <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden shadow-sm animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="px-4 py-4 flex items-center border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <div className="w-full grid grid-cols-8 gap-4">
                {Array.from({ length: 8 }).map((_, j) => (
                  <div key={j} className="h-4 bg-zinc-100 dark:bg-zinc-800/50 rounded w-3/4" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input
            placeholder="Search by source, destination, vehicle or driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 border-zinc-200 dark:border-zinc-800"
          />
        </div>
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-44 h-10 border-zinc-200 dark:border-zinc-800">
            <SelectValue placeholder="Status: All">
              {statusFilter === "ALL" ? "Status: All" : statusFilter}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Status: All</SelectItem>
            {Object.values(TripStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty State */}
      {filteredTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/20 dark:bg-zinc-950/20">
          {search || statusFilter !== "ALL" ? (
            <>
              <SearchXIcon className="size-8 text-zinc-400 mb-3" />
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">No trips found</h3>
              <p className="text-sm text-zinc-500 mt-1">Try adjusting your search or filters.</p>
            </>
          ) : (
            <>
              <PackageIcon className="size-8 text-zinc-400 mb-3" />
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">No trips scheduled</h3>
              <p className="text-sm text-zinc-500 mt-1">Create a new trip to get started.</p>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50 dark:bg-zinc-950/20">
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3 pl-4">Source</TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">Destination</TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">Vehicle</TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">Driver</TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">Cargo (kg)</TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">Distance (km)</TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">Status</TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3 pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.map((trip) => (
                <TableRow
                  key={trip.id}
                  className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10"
                >
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100 py-3.5 pl-4">{trip.source}</TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400 py-3.5">{trip.destination}</TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400 py-3.5">{trip.vehicle.name}</TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400 py-3.5">{trip.driver.name}</TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400 py-3.5">{trip.cargoWeight.toLocaleString()}</TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400 py-3.5">{trip.plannedDistance.toLocaleString()}</TableCell>
                  <TableCell className="py-3.5">
                    <Badge className={`${statusStyles[trip.status as TripStatus]} px-2 py-0.5 rounded-full`}>
                      {trip.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3.5 pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 outline-none transition-colors">
                        <MoreVerticalIcon className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer"
                          onClick={() => router.push(`/trips/${trip.id}`)}
                        >
                          <ExternalLinkIcon className="size-3.5" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {trip.status === TripStatus.DRAFT && (
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-amber-600 focus:bg-amber-50 focus:text-amber-700"
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
                              className="gap-2 cursor-pointer text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700"
                              onClick={() => {
                                setCompletingId(trip.id);
                                setCompleteForm({ actualDistance: "", fuelUsed: "", revenue: "", endOdometer: "" });
                              }}
                            >
                              <CheckCircle2Icon className="size-3.5" />
                              <span>Complete</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                              onClick={() => setCancellingId(trip.id)}
                            >
                              <XCircleIcon className="size-3.5" />
                              <span>Cancel</span>
                            </DropdownMenuItem>
                          </>
                        )}
                        {trip.status === TripStatus.DRAFT && (
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onClick={() => setCancellingId(trip.id)}
                          >
                            <XCircleIcon className="size-3.5" />
                            <span>Cancel</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancellingId} onOpenChange={(open) => !open && setCancellingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Trip</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this trip? The vehicle and driver will be released back to available.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCancellingId(null)}>Keep</Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => cancellingId && cancelMutation.mutate({ id: cancellingId })}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel Trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Trip Dialog */}
      <Dialog open={!!completingId} onOpenChange={(open) => !open && setCompletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Trip</DialogTitle>
            <DialogDescription>Enter the final trip metrics to mark this trip as completed.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Actual Distance (km)</label>
              <Input type="number" value={completeForm.actualDistance} onChange={(e) => setCompleteForm((f) => ({ ...f, actualDistance: e.target.value }))} placeholder="e.g. 280" className="h-9" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Fuel Used (L)</label>
              <Input type="number" value={completeForm.fuelUsed} onChange={(e) => setCompleteForm((f) => ({ ...f, fuelUsed: e.target.value }))} placeholder="e.g. 45" className="h-9" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Revenue ($)</label>
              <Input type="number" value={completeForm.revenue} onChange={(e) => setCompleteForm((f) => ({ ...f, revenue: e.target.value }))} placeholder="e.g. 1200" className="h-9" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">End Odometer (km)</label>
              <Input type="number" value={completeForm.endOdometer} onChange={(e) => setCompleteForm((f) => ({ ...f, endOdometer: e.target.value }))} placeholder="e.g. 130000" className="h-9" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompletingId(null)}>Cancel</Button>
            <Button
              disabled={completeMutation.isPending}
              onClick={handleComplete}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {completeMutation.isPending ? "Saving..." : "Mark as Completed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
