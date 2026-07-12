"use client";

import { useState, useMemo } from "react";
import VehicleTable from "@/components/VehicleTable";
import VehicleForm from "@/components/VehicleForm";
import DriverTable from "@/components/DriverTable";
import DriverForm from "@/components/DriverForm";
import TripTable from "@/components/TripTable";
import TripForm from "@/components/TripForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus } from "@/lib/enums";
import {
  PlusIcon,
  TruckIcon,
  UsersIcon,
  NavigationIcon,
  SendIcon,
  WrenchIcon,
  FuelIcon,
  BarChart3Icon,
  SettingsIcon,
  ArrowRightIcon,
  LogOutIcon,
  BadgeDollarSignIcon,
  SearchIcon,
  ChevronDownIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MenuType =
  | "dashboard"
  | "fleet"
  | "drivers"
  | "trips"
  | "maintenance"
  | "fuel_expenses"
  | "analytics"
  | "settings";

// ─── helpers ─────────────────────────────────────────────────────────────────
const cardCls =
  "bg-[#f9f7f4] border border-[rgba(0,0,0,0.08)] shadow-sm rounded-xl overflow-hidden";
const inputCls =
  "bg-[#faf8f5] border border-[rgba(0,0,0,0.09)] text-[#111] placeholder:text-[#aaa] focus-visible:ring-1 focus-visible:ring-[rgba(0,0,0,0.2)] h-9 rounded-lg text-sm";
const selectCls =
  "bg-[#faf8f5] border border-[rgba(0,0,0,0.09)] text-[#111] h-9 rounded-lg text-sm";
const selectContentCls =
  "bg-[#f9f7f4] border border-[rgba(0,0,0,0.1)] text-[#111] shadow-lg";
const labelCls =
  "block text-[10px] font-semibold tracking-widest uppercase text-[#888] mb-1";
const sectionHead = "border-b border-[rgba(0,0,0,0.07)] pb-5 mb-6";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SCHEDULED:  "bg-sky-100 text-sky-700 border-sky-200",
    DISPATCHED: "bg-blue-100 text-blue-700 border-blue-200",
    ON_TRIP:    "bg-green-100 text-green-700 border-green-200",
    COMPLETED:  "bg-emerald-100 text-emerald-700 border-emerald-200",
    CANCELLED:  "bg-red-100 text-red-600 border-red-200",
    DRAFT:      "bg-gray-100 text-gray-500 border-gray-200",
  };
  const label: Record<string, string> = {
    SCHEDULED: "Scheduled", DISPATCHED: "Dispatched",
    ON_TRIP: "On Trip", COMPLETED: "Completed",
    CANCELLED: "Cancelled", DRAFT: "Draft",
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold border ${map[status] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
      {label[status] ?? status}
    </span>
  );
}

function VehicleStatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[12px] text-[#555]">{label}</span>
        <span className="text-[12px] font-semibold text-[#111]" style={{ fontFamily: "var(--font-space-grotesk)" }}>{count}</span>
      </div>
      <div className="h-4 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [activeMenu, setActiveMenu] = useState<MenuType>("dashboard");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFuelOpen, setIsFuelOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: vehicles, refetch: refetchVehicles } = api.vehicle.list.useQuery(undefined, { staleTime: 5000 });
  const { data: drivers,  refetch: refetchDrivers  } = api.driver.getAll.useQuery(undefined, { staleTime: 5000 });
  const { data: trips,   refetch: refetchTrips   } = api.trip.getAll.useQuery(undefined, { staleTime: 5000 });
  const { data: maintenances, refetch: refetchMaintenances } = api.maintenance.list.useQuery(undefined, { staleTime: 5000 });
  const { data: fuelLogs, refetch: refetchFuelLogs } = api.fuel.list.useQuery(undefined, { staleTime: 5000 });
  const { data: expenses, refetch: refetchExpenses } = api.expense.list.useQuery(undefined, { staleTime: 5000 });

  const createMaintenanceMutation = api.maintenance.create.useMutation({
    onSuccess: () => { toast.success("Maintenance log created"); refetchMaintenances(); refetchVehicles(); setMaintForm({ title: "", description: "", cost: "", vehicleId: "" }); },
    onError: (err) => toast.error(err.message || "Failed"),
  });
  const closeMaintenanceMutation = api.maintenance.close.useMutation({
    onSuccess: () => { toast.success("Maintenance closed"); refetchMaintenances(); refetchVehicles(); },
    onError: (err) => toast.error(err.message || "Failed"),
  });
  const createFuelMutation = api.fuel.create.useMutation({
    onSuccess: () => { toast.success("Fuel logged"); refetchFuelLogs(); setIsFuelOpen(false); setFuelForm({ vehicleId: "", tripId: "", liters: "", cost: "" }); },
    onError: (err) => toast.error(err.message || "Failed"),
  });
  const createExpenseMutation = api.expense.create.useMutation({
    onSuccess: () => { toast.success("Expense added"); refetchExpenses(); setIsExpenseOpen(false); setExpenseForm({ vehicleId: "", type: "TOLL", amount: "", description: "" }); },
    onError: (err) => toast.error(err.message || "Failed"),
  });

  const [maintForm, setMaintForm] = useState({ title: "", description: "", cost: "", vehicleId: "" });
  const [fuelForm, setFuelForm] = useState({ vehicleId: "", tripId: "", liters: "", cost: "" });
  const [expenseForm, setExpenseForm] = useState({ vehicleId: "", type: "TOLL" as "TOLL" | "REPAIR" | "INSURANCE" | "OTHER", amount: "", description: "" });

  // Stats
  const vStat = useMemo(() => ({
    total:     vehicles?.length ?? 0,
    available: vehicles?.filter((v) => v.status === VehicleStatus.AVAILABLE).length ?? 0,
    onTrip:    vehicles?.filter((v) => v.status === VehicleStatus.ON_TRIP).length ?? 0,
    inShop:    vehicles?.filter((v) => v.status === VehicleStatus.IN_SHOP).length ?? 0,
    retired:   vehicles?.filter((v) => v.status === "RETIRED").length ?? 0,
  }), [vehicles]);

  const dStat = useMemo(() => ({
    total:  drivers?.length ?? 0,
    onDuty: drivers?.filter((d) => d.status === DriverStatus.ON_TRIP).length ?? 0,
  }), [drivers]);

  const tStat = useMemo(() => ({
    active:    trips?.filter((t) => t.status === TripStatus.DISPATCHED).length ?? 0,
    pending:   trips?.filter((t) => t.status === TripStatus.DRAFT).length ?? 0,
    completed: trips?.filter((t) => t.status === TripStatus.COMPLETED).length ?? 0,
  }), [trips]);

  const fleetUtil = vStat.total > 0 ? Math.round(((vStat.onTrip) / vStat.total) * 100) : 0;
  const totalFuelCost = useMemo(() => fuelLogs?.reduce((a, l) => a + l.cost, 0) ?? 0, [fuelLogs]);
  const totalMaintCost = useMemo(() => maintenances?.reduce((a, m) => a + m.cost, 0) ?? 0, [maintenances]);
  const totalOpCost = totalFuelCost + totalMaintCost;

  const recentTrips = useMemo(() => (trips ?? []).slice(0, 6), [trips]);
  const availableVehiclesForMaint = vehicles?.filter((v) => v.status === VehicleStatus.AVAILABLE) ?? [];

  const handleCreateSuccess = () => { setIsCreateOpen(false); refetchVehicles(); refetchDrivers(); refetchTrips(); };
  const handleEditSuccess   = () => { setEditingId(null); refetchVehicles(); refetchDrivers(); };

  // ─── Nav items ────────────────────────────────────────────────────────────
  const navItems = [
    { id: "dashboard",    label: "Dashboard",     icon: BarChart3Icon },
    { id: "fleet",        label: "Fleet",         icon: TruckIcon },
    { id: "drivers",      label: "Drivers",       icon: UsersIcon },
    { id: "trips",        label: "Trips",         icon: SendIcon },
    { id: "maintenance",  label: "Maintenance",   icon: WrenchIcon },
    { id: "fuel_expenses",label: "Fuel & Expenses",icon: FuelIcon },
    { id: "analytics",   label: "Analytics",     icon: BadgeDollarSignIcon },
    { id: "settings",    label: "Settings",      icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-outer)", fontFamily: "var(--font-inter)" }}>

      {/* ══════════ SIDEBAR ══════════ */}
      <aside
        className="w-52 flex flex-col justify-between py-6 px-3 shrink-0"
        style={{ background: "var(--bg-elevated)", borderRight: "1.5px solid rgba(0,0,0,0.09)" }}
      >
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-2 mb-2">
            <div
              className="size-8 rounded-xl flex items-center justify-center text-white font-bold text-xs tracking-widest shadow-md"
              style={{ background: "var(--brand)", boxShadow: "0 4px 14px rgba(224,112,0,0.3)" }}
            >TO</div>
            <span className="font-bold text-base text-[#111]" style={{ fontFamily: "var(--font-space-grotesk)" }}>TransitOps</span>
          </div>

          {/* Nav */}
          <nav className="space-y-0.5">
            {navItems.map(({ id, label, icon: Icon }) => {
              const active = activeMenu === id;
              return (
                <button
                  key={id}
                  onClick={() => { setActiveMenu(id as MenuType); setEditingId(null); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 text-left"
                  style={active
                    ? { background: "var(--brand-soft)", color: "var(--brand)", fontWeight: 600 }
                    : { color: "#555" }
                  }
                >
                  <Icon className="size-4 shrink-0" style={{ color: active ? "var(--brand)" : "#999" }} />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-2 pt-4" style={{ borderTop: "1.5px solid rgba(0,0,0,0.08)" }}>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full flex items-center justify-center font-bold text-[11px]"
              style={{ background: "var(--brand-muted)", color: "var(--brand)", border: "1.5px solid rgba(224,112,0,0.2)" }}>
              RK
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#111]" style={{ fontFamily: "var(--font-space-grotesk)" }}>Raven K.</p>
              <p className="text-[9px] text-[#aaa]">Dispatcher</p>
            </div>
          </div>
          <button className="text-[#ccc] hover:text-red-500 transition-colors">
            <LogOutIcon className="size-3.5" />
          </button>
        </div>
      </aside>

      {/* ══════════ MAIN AREA ══════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── TOP BAR ── */}
        <header
          className="h-14 flex items-center justify-between px-6 gap-4 shrink-0"
          style={{ background: "var(--bg-card)", borderBottom: "1.5px solid rgba(0,0,0,0.07)" }}
        >
          <div className="relative flex-1 max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#bbb]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-8 pr-3 h-8 rounded-lg text-sm text-[#111] placeholder:text-[#bbb] outline-none"
              style={{ background: "var(--bg-elevated)", border: "1px solid rgba(0,0,0,0.08)" }}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#555]">Raven K.</span>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger render={
                <button
                  className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-white text-[12px] font-semibold border-0 hover-lift"
                  style={{ background: "var(--brand)" }}
                >
                  <SendIcon className="size-3" /> Dispatch
                </button>
              } />
              <DialogContent className="sm:max-w-2xl" style={{ background: "#f9f7f4", border: "1.5px solid rgba(0,0,0,0.09)" }}>
                <TripForm onSuccess={handleCreateSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* ── SCROLLABLE PAGE CONTENT ── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ════ DASHBOARD VIEW ════ */}
          {activeMenu === "dashboard" && (
            <div className="space-y-6">

              {/* Filter Row */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#aaa]">Filters</p>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { label: "Vehicle Type: All", opts: ["All", "Van", "Truck", "Mini"] },
                    { label: "Status: All", opts: ["All", "Available", "On Trip", "In Shop"] },
                    { label: "Region: All", opts: ["All", "North", "South", "East", "West"] },
                  ].map(({ label, opts }) => (
                    <div key={label} className="relative">
                      <select
                        className="appearance-none pl-3 pr-8 h-8 rounded-lg text-[12px] font-medium text-[#444] cursor-pointer outline-none"
                        style={{ background: "var(--bg-card)", border: "1px solid rgba(0,0,0,0.1)" }}
                      >
                        {opts.map((o) => <option key={o}>{label.split(":")[0]}: {o}</option>)}
                      </select>
                      <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-[#aaa] pointer-events-none" />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 7 STAT CARDS ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { label: "Active Vehicles",       value: vStat.total,     accent: "#3b82f6" },
                  { label: "Available Vehicles",    value: vStat.available, accent: "#22c55e" },
                  { label: "Vehicles in Maintenance", value: vStat.inShop,  accent: "var(--brand)" },
                  { label: "Active Trips",          value: tStat.active,    accent: "#3b82f6" },
                  { label: "Pending Trips",         value: tStat.pending,   accent: "#a78bfa" },
                  { label: "Drivers on Duty",       value: dStat.onDuty,    accent: "#22c55e" },
                  { label: "Fleet Utilization",     value: `${fleetUtil}%`, accent: "#f59e0b" },
                ].map(({ label, value, accent }) => (
                  <div
                    key={label}
                    className="rounded-xl p-4 hover-lift transition-all"
                    style={{
                      background: "var(--bg-card)",
                      border: "1.5px solid rgba(0,0,0,0.07)",
                      borderTop: `3px solid ${accent}`,
                    }}
                  >
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-[#888] leading-tight mb-2">{label}</p>
                    <p className="text-[28px] font-bold leading-none" style={{ color: accent, fontFamily: "var(--font-space-grotesk)" }}>
                      {String(value).padStart(2, "0")}
                    </p>
                  </div>
                ))}
              </div>

              {/* ── RECENT TRIPS + VEHICLE STATUS ── */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* Recent Trips */}
                <div className={`${cardCls} lg:col-span-3`}>
                  <div className="px-5 pt-5 pb-2 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#888]">Recent Trips</p>
                    <button
                      onClick={() => setActiveMenu("trips")}
                      className="text-[11px] font-semibold hover:underline"
                      style={{ color: "var(--brand)" }}
                    >View All →</button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow style={{ background: "var(--bg-elevated)", borderBottom: "1.5px solid rgba(0,0,0,0.06)" }}>
                        {["Trip", "Vehicle", "Driver", "Status", "ETA"].map((h) => (
                          <TableHead key={h} className="py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#999] first:pl-5 last:pr-5">
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTrips.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="py-10 text-center text-[#bbb] text-sm">No trips yet</TableCell></TableRow>
                      ) : (
                        recentTrips.map((t) => (
                          <TableRow key={t.id} className="transition-colors" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                            <TableCell className="py-3 pl-5 font-mono text-[12px] font-semibold text-[#111]">
                              {t.id.slice(0, 6).toUpperCase()}
                            </TableCell>
                            <TableCell className="py-3 text-[12px] font-semibold text-[#444]">
                              {(t as any).vehicle?.name ?? "—"}
                            </TableCell>
                            <TableCell className="py-3 text-[12px] text-[#555]">
                              {(t as any).driver?.name ?? "—"}
                            </TableCell>
                            <TableCell className="py-3"><StatusBadge status={t.status} /></TableCell>
                            <TableCell className="py-3 pr-5 text-[11px] text-[#888]">
                              {t.status === TripStatus.DISPATCHED ? "~45 min" : t.status === TripStatus.DRAFT ? "Awaiting" : "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Vehicle Status */}
                <div className={`${cardCls} lg:col-span-2 p-5 space-y-5`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#888]">Vehicle Status</p>

                  <div className="space-y-4">
                    <VehicleStatusBar label="Available" count={vStat.available} total={vStat.total} color="#22c55e" />
                    <VehicleStatusBar label="On Trip"   count={vStat.onTrip}    total={vStat.total} color="#3b82f6" />
                    <VehicleStatusBar label="In Shop"   count={vStat.inShop}    total={vStat.total} color="#e07000" />
                    <VehicleStatusBar label="Retired"   count={vStat.retired}   total={vStat.total} color="#f43f5e" />
                  </div>

                  <div
                    className="rounded-lg p-4 mt-2"
                    style={{ background: "var(--bg-elevated)", border: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    <p className="text-[9px] uppercase tracking-widest text-[#aaa] mb-1">Operational Cost</p>
                    <p className="text-xl font-bold text-red-600" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      ₹ {totalOpCost.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[#aaa] mt-0.5">Fuel + Maintenance (Auto)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ FLEET ════ */}
          {activeMenu === "fleet" && (
            <div className="space-y-5">
              <div className={`${sectionHead} flex justify-between items-center`}>
                <div>
                  <h1 className="text-2xl font-bold text-[#111]" style={{ fontFamily: "var(--font-space-grotesk)" }}>Fleet Registry</h1>
                  <p className="text-sm text-[#888] mt-0.5">Manage vehicles, specs, and load capacities.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger render={
                    <button className="px-4 h-9 rounded-lg text-white text-sm font-semibold border-0 hover-lift" style={{ background: "var(--brand)" }}>
                      <span className="flex items-center gap-1.5"><PlusIcon className="size-4" /> Add Vehicle</span>
                    </button>
                  } />
                  <DialogContent className="sm:max-w-2xl" style={{ background: "#f9f7f4", border: "1.5px solid rgba(0,0,0,0.09)" }}>
                    <VehicleForm onSuccess={handleCreateSuccess} />
                  </DialogContent>
                </Dialog>
              </div>
              <div className={cardCls}><VehicleTable onEdit={(id) => setEditingId(id)} /></div>
            </div>
          )}

          {/* ════ DRIVERS ════ */}
          {activeMenu === "drivers" && (
            <div className="space-y-5">
              <div className={`${sectionHead} flex justify-between items-center`}>
                <div>
                  <h1 className="text-2xl font-bold text-[#111]" style={{ fontFamily: "var(--font-space-grotesk)" }}>Registered Drivers</h1>
                  <p className="text-sm text-[#888] mt-0.5">Manage operators, license categories, and expiry.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger render={
                    <button className="px-4 h-9 rounded-lg text-white text-sm font-semibold border-0 hover-lift" style={{ background: "var(--brand)" }}>
                      <span className="flex items-center gap-1.5"><PlusIcon className="size-4" /> Register Driver</span>
                    </button>
                  } />
                  <DialogContent className="sm:max-w-2xl" style={{ background: "#f9f7f4", border: "1.5px solid rgba(0,0,0,0.09)" }}>
                    <DriverForm onSuccess={handleCreateSuccess} />
                  </DialogContent>
                </Dialog>
              </div>
              <div className={cardCls}><DriverTable onEdit={(id) => setEditingId(id)} /></div>
            </div>
          )}

          {/* ════ TRIPS ════ */}
          {activeMenu === "trips" && (
            <div className="space-y-5">
              <div className={`${sectionHead} flex justify-between items-center`}>
                <div>
                  <h1 className="text-2xl font-bold text-[#111]" style={{ fontFamily: "var(--font-space-grotesk)" }}>Logistics Trips</h1>
                  <p className="text-sm text-[#888] mt-0.5">Dispatch, cancel, or complete delivery assignments.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger render={
                    <button className="px-4 h-9 rounded-lg text-white text-sm font-semibold border-0 hover-lift" style={{ background: "var(--brand)" }}>
                      <span className="flex items-center gap-1.5"><PlusIcon className="size-4" /> Schedule Trip</span>
                    </button>
                  } />
                  <DialogContent className="sm:max-w-2xl" style={{ background: "#f9f7f4", border: "1.5px solid rgba(0,0,0,0.09)" }}>
                    <TripForm onSuccess={handleCreateSuccess} />
                  </DialogContent>
                </Dialog>
              </div>
              <div className={cardCls}><TripTable /></div>
            </div>
          )}

          {/* ════ MAINTENANCE ════ */}
          {activeMenu === "maintenance" && (
            <div className="space-y-5">
              <div className={sectionHead}>
                <h1 className="text-2xl font-bold text-[#111]" style={{ fontFamily: "var(--font-space-grotesk)" }}>Maintenance Management</h1>
                <p className="text-sm text-[#888] mt-0.5">Log service records and track vehicles in shop.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className={`${cardCls} p-5`}>
                    <p className={labelCls + " mb-4"}>Log Service Record</p>
                    <div className="space-y-3">
                      <div>
                        <label className={labelCls}>Vehicle</label>
                        <Select value={maintForm.vehicleId} onValueChange={(v) => setMaintForm((f) => ({ ...f, vehicleId: v ?? "" }))}>
                          <SelectTrigger className={selectCls}><SelectValue placeholder="Select vehicle…" /></SelectTrigger>
                          <SelectContent className={selectContentCls}>
                            {availableVehiclesForMaint.length === 0
                              ? <div className="p-3 text-xs text-[#aaa]">No vehicles available</div>
                              : availableVehiclesForMaint.map((v) => <SelectItem key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</SelectItem>)
                            }
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className={labelCls}>Service Type</label>
                        <input value={maintForm.title} onChange={(e) => setMaintForm((f) => ({ ...f, title: e.target.value }))} placeholder="Oil Change, Engine Repair…" className={`w-full ${inputCls}`} />
                      </div>
                      <div>
                        <label className={labelCls}>Cost (₹)</label>
                        <input type="number" value={maintForm.cost} onChange={(e) => setMaintForm((f) => ({ ...f, cost: e.target.value }))} placeholder="e.g. 2500" className={`w-full ${inputCls}`} />
                      </div>
                      <div>
                        <label className={labelCls}>Status</label>
                        <input value="Active" disabled className={`w-full ${inputCls} opacity-50 cursor-not-allowed`} />
                      </div>
                      <button
                        onClick={() => createMaintenanceMutation.mutate({ title: maintForm.title, description: maintForm.description || null, cost: Number(maintForm.cost), vehicleId: maintForm.vehicleId })}
                        disabled={createMaintenanceMutation.isPending}
                        className="w-full h-9 rounded-lg text-white text-sm font-semibold border-0 hover-lift"
                        style={{ background: "var(--brand)" }}
                      >
                        {createMaintenanceMutation.isPending ? "Saving…" : "Save Record"}
                      </button>
                    </div>
                  </div>

                  <div className={`${cardCls} p-5`} style={{ background: "var(--bg-elevated)" }}>
                    <p className={labelCls + " mb-3"}>Status Lifecycle</p>
                    <div className="space-y-2.5" style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 12 }}>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 font-semibold">Available</span>
                        <ArrowRightIcon className="size-3 text-[#ccc]" />
                        <span className="font-semibold" style={{ color: "var(--brand)" }}>In Shop</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{ color: "var(--brand)" }}>In Shop</span>
                        <ArrowRightIcon className="size-3 text-[#ccc]" />
                        <span className="text-emerald-600 font-semibold">Available</span>
                      </div>
                      <p className="text-[10px] text-[#aaa] pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                        In Shop vehicles are removed from dispatch.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`${cardCls} lg:col-span-2`}>
                  <div className="px-5 pt-5 pb-2"><p className={labelCls}>Service Logs</p></div>
                  <Table>
                    <TableHeader>
                      <TableRow style={{ background: "var(--bg-elevated)", borderBottom: "1.5px solid rgba(0,0,0,0.07)" }}>
                        {["Vehicle", "Service", "Cost", "Status", "Actions"].map((h, i) => (
                          <TableHead key={h} className={`py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#999] ${i === 0 ? "pl-5" : ""} ${i === 4 ? "pr-5 text-right" : ""}`}>{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!maintenances || maintenances.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-10 text-[#bbb] text-sm">No service logs</TableCell></TableRow>
                      ) : (
                        maintenances.map((m) => (
                          <TableRow key={m.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                            <TableCell className="py-3.5 pl-5 font-semibold text-[#111]">{m.vehicle.name}</TableCell>
                            <TableCell className="py-3.5 text-[#444]">{m.title}</TableCell>
                            <TableCell className="py-3.5 text-[#444]" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>₹ {m.cost.toLocaleString()}</TableCell>
                            <TableCell className="py-3.5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${m.status === MaintenanceStatus.ACTIVE ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"}`}>
                                {m.status === MaintenanceStatus.ACTIVE ? "In Shop" : "Completed"}
                              </span>
                            </TableCell>
                            <TableCell className="py-3.5 pr-5 text-right">
                              {m.status === MaintenanceStatus.ACTIVE ? (
                                <button onClick={() => closeMaintenanceMutation.mutate({ id: m.id })} disabled={closeMaintenanceMutation.isPending} className="text-[11px] font-semibold px-3 py-1.5 rounded-lg text-white border-0 hover-lift" style={{ background: "#16a34a" }}>Complete</button>
                              ) : <span className="text-[11px] text-[#bbb]">Done</span>}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* ════ FUEL & EXPENSES ════ */}
          {activeMenu === "fuel_expenses" && (
            <div className="space-y-6">
              <div className={`${sectionHead} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3`}>
                <div>
                  <h1 className="text-2xl font-bold text-[#111]" style={{ fontFamily: "var(--font-space-grotesk)" }}>Fuel & Expense Management</h1>
                  <p className="text-sm text-[#888] mt-0.5">Track fuel, tolls, and other operational expenses.</p>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isFuelOpen} onOpenChange={setIsFuelOpen}>
                    <DialogTrigger render={<button className="px-4 h-9 rounded-lg text-white text-sm font-semibold border-0 hover-lift" style={{ background: "var(--brand)" }}>+ Log Fuel</button>} />
                    <DialogContent style={{ background: "#f9f7f4", border: "1.5px solid rgba(0,0,0,0.09)" }}>
                      <div className="space-y-5">
                        <h2 className="text-lg font-bold text-[#111]" style={{ fontFamily: "var(--font-space-grotesk)" }}>Log Fuel</h2>
                        <div className="space-y-3">
                          <div><label className={labelCls}>Vehicle</label>
                            <Select value={fuelForm.vehicleId} onValueChange={(v) => setFuelForm((f) => ({ ...f, vehicleId: v ?? "" }))}>
                              <SelectTrigger className={selectCls}><SelectValue placeholder="Select vehicle…" /></SelectTrigger>
                              <SelectContent className={selectContentCls}>{vehicles?.map((v) => <SelectItem key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div><label className={labelCls}>Liters</label><input type="number" value={fuelForm.liters} onChange={(e) => setFuelForm((f) => ({ ...f, liters: e.target.value }))} placeholder="e.g. 42" className={`w-full ${inputCls}`} /></div>
                          <div><label className={labelCls}>Cost (₹)</label><input type="number" value={fuelForm.cost} onChange={(e) => setFuelForm((f) => ({ ...f, cost: e.target.value }))} placeholder="e.g. 3150" className={`w-full ${inputCls}`} /></div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button onClick={() => setIsFuelOpen(false)} className="px-4 h-9 rounded-lg text-sm text-[#666] hover:bg-[rgba(0,0,0,0.04)]">Cancel</button>
                          <button onClick={() => createFuelMutation.mutate({ vehicleId: fuelForm.vehicleId, liters: Number(fuelForm.liters), cost: Number(fuelForm.cost), tripId: fuelForm.tripId || null })} disabled={createFuelMutation.isPending} className="px-5 h-9 rounded-lg text-white text-sm font-semibold border-0 hover-lift" style={{ background: "var(--brand)" }}>{createFuelMutation.isPending ? "Logging…" : "Log Fuel"}</button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
                    <DialogTrigger render={<button className="px-4 h-9 rounded-lg text-white text-sm font-semibold border-0 hover-lift" style={{ background: "var(--brand)" }}>+ Add Expense</button>} />
                    <DialogContent style={{ background: "#f9f7f4", border: "1.5px solid rgba(0,0,0,0.09)" }}>
                      <div className="space-y-5">
                        <h2 className="text-lg font-bold text-[#111]" style={{ fontFamily: "var(--font-space-grotesk)" }}>Add Expense</h2>
                        <div className="space-y-3">
                          <div><label className={labelCls}>Vehicle</label>
                            <Select value={expenseForm.vehicleId} onValueChange={(v) => setExpenseForm((f) => ({ ...f, vehicleId: v ?? "" }))}>
                              <SelectTrigger className={selectCls}><SelectValue placeholder="Select vehicle…" /></SelectTrigger>
                              <SelectContent className={selectContentCls}>{vehicles?.map((v) => <SelectItem key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div><label className={labelCls}>Type</label>
                            <Select value={expenseForm.type} onValueChange={(v) => setExpenseForm((f) => ({ ...f, type: v as any }))}>
                              <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
                              <SelectContent className={selectContentCls}>
                                <SelectItem value="TOLL">Toll</SelectItem><SelectItem value="REPAIR">Repair</SelectItem>
                                <SelectItem value="INSURANCE">Insurance</SelectItem><SelectItem value="OTHER">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div><label className={labelCls}>Amount (₹)</label><input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))} placeholder="e.g. 120" className={`w-full ${inputCls}`} /></div>
                          <div><label className={labelCls}>Description</label><input value={expenseForm.description} onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))} placeholder="e.g. NH-44 Toll" className={`w-full ${inputCls}`} /></div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button onClick={() => setIsExpenseOpen(false)} className="px-4 h-9 rounded-lg text-sm text-[#666] hover:bg-[rgba(0,0,0,0.04)]">Cancel</button>
                          <button onClick={() => createExpenseMutation.mutate({ vehicleId: expenseForm.vehicleId, type: expenseForm.type, amount: Number(expenseForm.amount), description: expenseForm.description || null })} disabled={createExpenseMutation.isPending} className="px-5 h-9 rounded-lg text-white text-sm font-semibold border-0 hover-lift" style={{ background: "var(--brand)" }}>{createExpenseMutation.isPending ? "Adding…" : "Add Expense"}</button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Fuel Logs */}
              <div className={cardCls}>
                <div className="px-5 pt-5 pb-2"><p className={labelCls}>Fuel Logs</p></div>
                <Table>
                  <TableHeader>
                    <TableRow style={{ background: "var(--bg-elevated)", borderBottom: "1.5px solid rgba(0,0,0,0.07)" }}>
                      {["Vehicle", "Date", "Liters", "Fuel Cost"].map((h, i) => (
                        <TableHead key={h} className={`py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#999] ${i === 0 ? "pl-5" : ""} ${i === 3 ? "pr-5 text-right" : ""}`}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!fuelLogs || fuelLogs.length === 0
                      ? <TableRow><TableCell colSpan={4} className="py-10 text-center text-[#bbb] text-sm">No fuel logs</TableCell></TableRow>
                      : fuelLogs.map((log) => (
                          <TableRow key={log.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                            <TableCell className="py-3.5 pl-5 font-semibold text-[#111]">{log.vehicle.name} <span className="text-[11px] text-[#bbb]">({log.vehicle.registrationNumber})</span></TableCell>
                            <TableCell className="py-3.5 text-[#555]">{new Date(log.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</TableCell>
                            <TableCell className="py-3.5 text-[#555]" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>{log.liters} L</TableCell>
                            <TableCell className="py-3.5 pr-5 text-right font-bold text-red-600" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>₹ {log.cost.toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                    }
                  </TableBody>
                </Table>
              </div>

              {/* Other Expenses */}
              <div className={cardCls}>
                <div className="px-5 pt-5 pb-2"><p className={labelCls}>Other Expenses (Toll / Misc)</p></div>
                <Table>
                  <TableHeader>
                    <TableRow style={{ background: "var(--bg-elevated)", borderBottom: "1.5px solid rgba(0,0,0,0.07)" }}>
                      {["Vehicle", "Type", "Description", "Date", "Amount"].map((h, i) => (
                        <TableHead key={h} className={`py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#999] ${i === 0 ? "pl-5" : ""} ${i === 4 ? "pr-5 text-right" : ""}`}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!expenses || expenses.length === 0
                      ? <TableRow><TableCell colSpan={5} className="py-10 text-center text-[#bbb] text-sm">No expenses</TableCell></TableRow>
                      : expenses.map((exp) => (
                          <TableRow key={exp.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                            <TableCell className="py-3.5 pl-5 font-semibold text-[#111]">{exp.vehicle.name} <span className="text-[11px] text-[#bbb]">({exp.vehicle.registrationNumber})</span></TableCell>
                            <TableCell className="py-3.5 capitalize text-[#555]">{exp.type.toLowerCase()}</TableCell>
                            <TableCell className="py-3.5 text-[#888]">{exp.description || "—"}</TableCell>
                            <TableCell className="py-3.5 text-[#555]">{new Date(exp.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</TableCell>
                            <TableCell className="py-3.5 pr-5 text-right font-bold text-red-600" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>₹ {exp.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                    }
                  </TableBody>
                </Table>
              </div>

              {/* Total Cost Banner */}
              <div className="flex justify-between items-center px-6 py-4 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1.5px solid rgba(0,0,0,0.09)" }}>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#888]">Total Operational Cost (Auto) = Fuel + Maint</span>
                <span className="text-2xl font-bold text-red-600" style={{ fontFamily: "var(--font-space-grotesk)" }}>₹ {totalOpCost.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* ════ ANALYTICS ════ */}
          {activeMenu === "analytics" && (
            <div className="space-y-5">
              <div className={sectionHead}>
                <h1 className="text-2xl font-bold text-[#111]" style={{ fontFamily: "var(--font-space-grotesk)" }}>Logistics Analytics</h1>
                <p className="text-sm text-[#888] mt-0.5">Performance, revenue, and operational indicators.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  {
                    title: "Operational Costs",
                    rows: [
                      { label: "Total Fuel Costs", value: `₹ ${totalFuelCost.toLocaleString()}`, color: "text-red-600" },
                      { label: "Total Maintenance Cost", value: `₹ ${totalMaintCost.toLocaleString()}`, color: "text-red-600" },
                    ],
                    total: { label: "Total Cost", value: `₹ ${totalOpCost.toLocaleString()}`, color: "text-red-600" },
                  },
                  {
                    title: "Revenue & ROI",
                    rows: [
                      { label: "Total Revenue", value: `₹ ${(trips?.reduce((a, t) => a + (t.revenue ?? 0), 0) ?? 0).toLocaleString()}`, color: "text-emerald-600" },
                      { label: "Completed Deliveries", value: `${tStat.completed} trips`, color: "text-[#111]" },
                    ],
                    total: { label: "Net ROI", value: `₹ ${((trips?.reduce((a, t) => a + (t.revenue ?? 0), 0) ?? 0) - totalOpCost).toLocaleString()}`, color: "text-emerald-600" },
                  },
                ].map(({ title, rows, total }) => (
                  <div key={title} className={`${cardCls} p-6 space-y-3`}>
                    <p className={labelCls}>{title}</p>
                    {rows.map(({ label, value, color }) => (
                      <div key={label} className="flex justify-between py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                        <span className="text-sm text-[#555]">{label}</span>
                        <span className={`font-bold ${color}`} style={{ fontFamily: "var(--font-space-grotesk)" }}>{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2">
                      <span className="font-semibold text-[#111]">{total.label}</span>
                      <span className={`text-xl font-bold ${total.color}`} style={{ fontFamily: "var(--font-space-grotesk)" }}>{total.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ SETTINGS ════ */}
          {activeMenu === "settings" && (
            <div className="space-y-5">
              <div className={sectionHead}>
                <h1 className="text-2xl font-bold text-[#111]" style={{ fontFamily: "var(--font-space-grotesk)" }}>Settings</h1>
                <p className="text-sm text-[#888] mt-0.5">Configure workspace alerts and operational thresholds.</p>
              </div>
              <div className={`${cardCls} p-6`}>
                <p className="text-sm text-[#888]">System configuration panels coming soon.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="sm:max-w-2xl" style={{ background: "#f9f7f4", border: "1.5px solid rgba(0,0,0,0.09)" }}>
          {editingId && activeMenu === "fleet"   && <VehicleForm vehicleId={editingId} onSuccess={handleEditSuccess} />}
          {editingId && activeMenu === "drivers" && <DriverForm  driverId={editingId}  onSuccess={handleEditSuccess} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
