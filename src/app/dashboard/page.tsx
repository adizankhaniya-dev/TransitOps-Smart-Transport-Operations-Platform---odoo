"use client";

import { useState } from "react";
import VehicleTable from "@/components/VehicleTable";
import VehicleForm from "@/components/VehicleForm";
import DriverTable from "@/components/DriverTable";
import DriverForm from "@/components/DriverForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { VehicleStatus, DriverStatus } from "@/lib/enums";
import {
  PlusIcon,
  TruckIcon,
  UsersIcon,
  CheckCircle2Icon,
  NavigationIcon,
  AlertCircleIcon,
  ShieldAlertIcon,
} from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"vehicles" | "drivers">("vehicles");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Queries for stats
  const { data: vehicles } = api.vehicle.list.useQuery(undefined, {
    staleTime: 5000,
  });
  const { data: drivers } = api.driver.getAll.useQuery(undefined, {
    staleTime: 5000,
  });

  // Calculate Vehicle Stats
  const vehicleStats = {
    total: vehicles?.length ?? 0,
    available: vehicles?.filter((v) => v.status === VehicleStatus.AVAILABLE).length ?? 0,
    onTrip: vehicles?.filter((v) => v.status === VehicleStatus.ON_TRIP).length ?? 0,
    inShop: vehicles?.filter((v) => v.status === VehicleStatus.IN_SHOP).length ?? 0,
  };

  // Calculate Driver Stats
  const driverStats = {
    total: drivers?.length ?? 0,
    available: drivers?.filter((d) => d.status === DriverStatus.AVAILABLE).length ?? 0,
    onTrip: drivers?.filter((d) => d.status === DriverStatus.ON_TRIP).length ?? 0,
    suspended: drivers?.filter((d) => d.status === DriverStatus.SUSPENDED).length ?? 0,
  };

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
  };

  const handleEditSuccess = () => {
    setEditingId(null);
  };

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6 md:p-10 space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            TransitOps Fleet & Dispatch
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time management dashboard for smart transport operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Segment Toggle */}
          <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-900 p-0.5 border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => {
                setActiveTab("vehicles");
                setEditingId(null);
              }}
              className={`h-9 rounded-md px-4 text-xs font-semibold transition-all ${
                activeTab === "vehicles"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              }`}
            >
              Vehicles
            </button>
            <button
              onClick={() => {
                setActiveTab("drivers");
                setEditingId(null);
              }}
              className={`h-9 rounded-md px-4 text-xs font-semibold transition-all ${
                activeTab === "drivers"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              }`}
            >
              Drivers
            </button>
          </div>

          {/* Add Entry Action Button */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger
              render={
                <Button className="h-10 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 font-semibold gap-2">
                  <PlusIcon className="size-4" />
                  {activeTab === "vehicles" ? "Add Vehicle" : "Register Driver"}
                </Button>
              }
            />
            <DialogContent className="sm:max-w-2xl">
              {activeTab === "vehicles" ? (
                <VehicleForm onSuccess={handleCreateSuccess} />
              ) : (
                <DriverForm onSuccess={handleCreateSuccess} />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {activeTab === "vehicles" ? (
          <>
            <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Total Vehicles
                </CardTitle>
                <TruckIcon className="size-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {vehicleStats.total}
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">Active fleet registry</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Available
                </CardTitle>
                <CheckCircle2Icon className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {vehicleStats.available}
                </div>
                <p className="text-[10px] text-emerald-500/80 mt-1">Ready for dispatch</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  On Trip
                </CardTitle>
                <NavigationIcon className="size-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {vehicleStats.onTrip}
                </div>
                <p className="text-[10px] text-blue-500/80 mt-1">Currently in transit</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  In Shop
                </CardTitle>
                <AlertCircleIcon className="size-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {vehicleStats.inShop}
                </div>
                <p className="text-[10px] text-amber-500/80 mt-1">Undergoing maintenance</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Total Drivers
                </CardTitle>
                <UsersIcon className="size-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {driverStats.total}
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">Registered operators</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Available
                </CardTitle>
                <CheckCircle2Icon className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {driverStats.available}
                </div>
                <p className="text-[10px] text-emerald-500/80 mt-1">On duty & standby</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  On Trip
                </CardTitle>
                <NavigationIcon className="size-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {driverStats.onTrip}
                </div>
                <p className="text-[10px] text-blue-500/80 mt-1">Active assignment</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Suspended
                </CardTitle>
                <ShieldAlertIcon className="size-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {driverStats.suspended}
                </div>
                <p className="text-[10px] text-rose-500/80 mt-1">Access restricted</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Table Content */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl p-4 md:p-6 shadow-xs">
        {activeTab === "vehicles" ? (
          <VehicleTable onEdit={(id) => setEditingId(id)} />
        ) : (
          <DriverTable onEdit={(id) => setEditingId(id)} />
        )}
      </div>

      {/* Reusable Edit Dialog Modal */}
      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="sm:max-w-2xl">
          {editingId && activeTab === "vehicles" && (
            <VehicleForm vehicleId={editingId} onSuccess={handleEditSuccess} />
          )}
          {editingId && activeTab === "drivers" && (
            <DriverForm driverId={editingId} onSuccess={handleEditSuccess} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
