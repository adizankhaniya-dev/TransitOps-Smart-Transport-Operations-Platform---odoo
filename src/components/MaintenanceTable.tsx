"use client";

import * as React from "react";
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
import { Button } from "@/components/ui/button";
import { MoreVerticalIcon, CheckCircleIcon } from "lucide-react";
import { MaintenanceStatus } from "@/lib/enums";
import { toast } from "sonner";

const statusStyles = {
  [MaintenanceStatus.ACTIVE]: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  [MaintenanceStatus.CLOSED]: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
};

export default function MaintenanceTable() {
  const utils = api.useUtils();
  const { data: maintenances, isLoading } = api.maintenance.list.useQuery();

  const closeMutation = api.maintenance.close.useMutation({
    onSuccess: () => {
      toast.success("Maintenance closed successfully");
      utils.maintenance.list.invalidate();
      utils.vehicle.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to close maintenance");
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden shadow-sm animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="px-4 py-4 flex items-center border-b border-zinc-100 dark:border-zinc-800 last:border-0">
            <div className="w-full grid grid-cols-7 gap-4">
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className="h-4 bg-zinc-100 dark:bg-zinc-800/50 rounded w-3/4" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-50/50 dark:bg-zinc-950/20">
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3 pl-4">Vehicle</TableHead>
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">Title</TableHead>
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">Cost</TableHead>
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">Status</TableHead>
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">Opened</TableHead>
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3">Closed</TableHead>
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 py-3 pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!maintenances || maintenances.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-zinc-500">No maintenance records found</TableCell>
            </TableRow>
          ) : (
            maintenances.map((m) => (
              <TableRow
                key={m.id}
                className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10"
              >
                <TableCell className="font-medium text-zinc-900 dark:text-zinc-100 py-3.5 pl-4">
                  {m.vehicle.name} <span className="text-xs text-zinc-400 font-normal">({m.vehicle.registrationNumber})</span>
                </TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-400 py-3.5">{m.title}</TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-400 py-3.5">${m.cost.toLocaleString()}</TableCell>
                <TableCell className="py-3.5">
                  <Badge className={`${statusStyles[m.status as MaintenanceStatus]} px-2 py-0.5 rounded-full`}>
                    {m.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-400 py-3.5">
                  {new Date(m.openedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-400 py-3.5">
                  {m.closedAt
                    ? new Date(m.closedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "—"}
                </TableCell>
                <TableCell className="py-3.5 pr-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 outline-none transition-colors">
                      <MoreVerticalIcon className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {m.status === MaintenanceStatus.ACTIVE && (
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700"
                          onClick={() => closeMutation.mutate({ id: m.id })}
                          disabled={closeMutation.isPending}
                        >
                          <CheckCircleIcon className="size-3.5" />
                          <span>Close Service</span>
                        </DropdownMenuItem>
                      )}
                      {m.status === MaintenanceStatus.CLOSED && (
                        <div className="px-2 py-1.5 text-xs text-zinc-400">No actions</div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
