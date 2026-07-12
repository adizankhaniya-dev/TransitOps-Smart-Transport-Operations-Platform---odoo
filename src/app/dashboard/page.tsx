"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import VehicleTable from "@/components/VehicleTable";
import VehicleForm from "@/components/VehicleForm";
import DriverTable from "@/components/DriverTable";
import DriverForm from "@/components/DriverForm";
import TripTable from "@/components/TripTable";
import TripForm from "@/components/TripForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus } from "@/lib/enums";
import {
  PlusIcon, TruckIcon, UsersIcon, NavigationIcon, SendIcon, WrenchIcon, FuelIcon,
  BarChart3Icon, SettingsIcon, ArrowRightIcon, LogOutIcon, BadgeDollarSignIcon,
  SearchIcon, ChevronDownIcon, DownloadIcon, FileTextIcon, TrendingUpIcon,
  ActivityIcon, CheckCircle2Icon, XCircleIcon, ClockIcon, AlertTriangleIcon,
  CalendarIcon, BellIcon, MailIcon, LayoutDashboardIcon, LogOut, HelpCircleIcon
} from "lucide-react";
import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ── Recharts (client-only) ────────────────────────────────────────────────────
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const BarChart           = dynamic(() => import("recharts").then((m) => m.BarChart),            { ssr: false });
const Bar                = dynamic(() => import("recharts").then((m) => m.Bar),                 { ssr: false });
const XAxis              = dynamic(() => import("recharts").then((m) => m.XAxis),               { ssr: false });
const YAxis              = dynamic(() => import("recharts").then((m) => m.YAxis),               { ssr: false });
const Tooltip            = dynamic(() => import("recharts").then((m) => m.Tooltip),             { ssr: false });
const PieChart           = dynamic(() => import("recharts").then((m) => m.PieChart),            { ssr: false });
const Pie                = dynamic(() => import("recharts").then((m) => m.Pie),                 { ssr: false });
const Cell               = dynamic(() => import("recharts").then((m) => m.Cell),                { ssr: false });

type MenuType = "dashboard" | "fleet" | "drivers" | "trips" | "maintenance" | "fuel_expenses" | "analytics" | "settings";

// ── Donezo Style Variables ──────────────────────────────────────────────────
const cardBg    = "bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden";
const inputCl   = "w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] h-10 px-3.5 rounded-xl text-sm transition-all";
const selCl     = "bg-white border border-slate-200 text-slate-900 h-10 rounded-xl text-sm focus:border-[#0d5c3a]";
const selCntCl  = "bg-white border border-slate-100 text-slate-900 shadow-xl";
const lbl       = "block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5";
const secHead   = "border-b border-slate-100 pb-4 mb-5";
const thCl      = "py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500";
function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, [string, string]> = {
    DISPATCHED: ["bg-blue-50 text-blue-700 border-blue-200/50", "Dispatched"],
    COMPLETED:  ["bg-emerald-50 text-emerald-700 border-emerald-200/50", "Completed"],
    CANCELLED:  ["bg-red-50 text-red-700 border-red-200/50", "Cancelled"],
    DRAFT:      ["bg-slate-50 text-slate-700 border-slate-200/50", "Draft"],
    ON_TRIP:    ["bg-[#eef6f2] text-[#0d5c3a] border-emerald-200/50", "On Trip"],
    SCHEDULED:  ["bg-sky-50 text-sky-700 border-sky-200/50", "Scheduled"],
  };
  const [cls, label] = cfg[status] ?? ["bg-slate-50 text-slate-700 border-slate-200", status];
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>{label}</span>;
}

function HBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-slate-400 font-semibold">{label}</span>
        <span className="font-bold text-slate-800">{count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [activeMenu, setActiveMenu] = useState<MenuType>("dashboard");
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFuelOpen, setIsFuelOpen]     = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  // Timer state for Time Tracker mockup
  const [time, setTime] = useState({ h: 1, m: 24, s: 8 });
  const [timerActive, setTimerActive] = useState(true);

  const router = useRouter();
  const { user, loading: sessionLoading, canWrite, allowedNav } = useSession();

  const [boardName, setBoardName] = useState("TransitOps");

  // Load workspace / board name
  useEffect(() => {
    const saved = localStorage.getItem("transitops_board_name");
    if (saved) setBoardName(saved);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!sessionLoading && !user) router.push("/login");
  }, [sessionLoading, user, router]);

  // Seeding timer
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTime(t => {
        let ns = t.s + 1;
        let nm = t.m;
        let nh = t.h;
        if (ns >= 60) { ns = 0; nm += 1; }
        if (nm >= 60) { nm = 0; nh += 1; }
        return { h: nh, m: nm, s: ns };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  // Auto-pick first allowed menu
  useEffect(() => {
    if (!sessionLoading && user && allowedNav.length > 0) {
      if (!allowedNav.includes(activeMenu)) {
        setActiveMenu(allowedNav[0] as MenuType);
      }
    }
  }, [sessionLoading, user, allowedNav]);

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: vehicles,     refetch: rfV  } = api.vehicle.list.useQuery(undefined, { staleTime: 5000 });
  const { data: drivers,      refetch: rfD  } = api.driver.getAll.useQuery(undefined, { staleTime: 5000 });
  const { data: trips,        refetch: rfT  } = api.trip.getAll.useQuery(undefined, { staleTime: 5000 });
  const { data: maintenances, refetch: rfM  } = api.maintenance.list.useQuery(undefined, { staleTime: 5000 });
  const { data: fuelLogs,     refetch: rfF  } = api.fuel.list.useQuery(undefined, { staleTime: 5000 });
  const { data: expenses,     refetch: rfE  } = api.expense.list.useQuery(undefined, { staleTime: 5000 });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const cMaint = api.maintenance.create.useMutation({ onSuccess: () => { toast.success("Maintenance created"); rfM(); rfV(); setMF({ title:"",description:"",cost:"",vehicleId:"" }); }, onError: (e) => toast.error(e.message) });
  const xMaint = api.maintenance.close.useMutation({  onSuccess: () => { toast.success("Maintenance closed");  rfM(); rfV(); }, onError: (e) => toast.error(e.message) });
  const cFuel  = api.fuel.create.useMutation({   onSuccess: () => { toast.success("Fuel logged"); rfF(); setIsFuelOpen(false); setFF({ vehicleId:"",tripId:"",liters:"",cost:"" }); }, onError: (e) => toast.error(e.message) });
  const cExp   = api.expense.create.useMutation({ onSuccess: () => { toast.success("Expense added"); rfE(); setIsExpenseOpen(false); setEF({ vehicleId:"",type:"TOLL",amount:"",description:"" }); }, onError: (e) => toast.error(e.message) });

  const [MF, setMF] = useState({ title:"", description:"", cost:"", vehicleId:"" });
  const [FF, setFF] = useState({ vehicleId:"", tripId:"", liters:"", cost:"" });
  const [EF, setEF] = useState({ vehicleId:"", type:"TOLL" as "TOLL"|"REPAIR"|"INSURANCE"|"OTHER", amount:"", description:"" });

  // ── Stats ───────────────────────────────────────────────────────────────────
  const vS = useMemo(() => ({
    total:     vehicles?.length ?? 0,
    available: vehicles?.filter(v => v.status === VehicleStatus.AVAILABLE).length ?? 0,
    onTrip:    vehicles?.filter(v => v.status === VehicleStatus.ON_TRIP).length    ?? 0,
    inShop:    vehicles?.filter(v => v.status === VehicleStatus.IN_SHOP).length    ?? 0,
    retired:   vehicles?.filter(v => v.status === "RETIRED").length                ?? 0,
  }), [vehicles]);

  const dS = useMemo(() => ({
    total:     drivers?.length ?? 0,
    available: drivers?.filter(d => d.status === DriverStatus.AVAILABLE).length  ?? 0,
    onTrip:    drivers?.filter(d => d.status === DriverStatus.ON_TRIP).length    ?? 0,
    offDuty:   drivers?.filter(d => d.status === DriverStatus.OFF_DUTY).length   ?? 0,
    suspended: drivers?.filter(d => d.status === DriverStatus.SUSPENDED).length  ?? 0,
  }), [drivers]);

  const tS = useMemo(() => ({
    total:     trips?.length ?? 0,
    active:    trips?.filter(t => t.status === TripStatus.DISPATCHED).length  ?? 0,
    pending:   trips?.filter(t => t.status === TripStatus.DRAFT).length       ?? 0,
    completed: trips?.filter(t => t.status === TripStatus.COMPLETED).length   ?? 0,
    cancelled: trips?.filter(t => t.status === TripStatus.CANCELLED).length   ?? 0,
  }), [trips]);

  const totalFuel  = useMemo(() => fuelLogs?.reduce((a,l) => a+l.cost, 0) ?? 0, [fuelLogs]);
  const totalMaint = useMemo(() => maintenances?.reduce((a,m) => a+m.cost, 0) ?? 0, [maintenances]);
  const totalOp    = totalFuel + totalMaint;
  const totalRev   = useMemo(() => trips?.reduce((a,t) => a+(t.revenue??0), 0) ?? 0, [trips]);
  const fleetUtil  = vS.total > 0 ? Math.round((vS.onTrip / vS.total) * 100) : 0;

  const recentTrips = useMemo(() => (trips ?? []).slice(0,5), [trips]);
  const availV      = vehicles?.filter(v => v.status === VehicleStatus.AVAILABLE) ?? [];

  const costBarData = useMemo(() => [
    { name: "Fuel",        cost: totalFuel  },
    { name: "Maintenance", cost: totalMaint },
    { name: "Expenses",    cost: expenses?.reduce((a,e) => a+e.amount, 0) ?? 0 },
  ], [totalFuel, totalMaint, expenses]);

  const ok  = () => { setIsCreateOpen(false); rfV(); rfD(); rfT(); };
  const oEd = () => { setEditingId(null); rfV(); rfD(); };

  const handleLogout = async () => {
    await fetch("/api/auth/session", { method: "POST" });
    router.push("/login");
  };

  // ── Nav items ───────────────────────────────────────────────────────────────
  const ALL_NAV = [
    { id: "dashboard",    label: "Dashboard",      icon: LayoutDashboardIcon },
    { id: "fleet",        label: "Fleet (Vehicles)", icon: TruckIcon },
    { id: "drivers",      label: "Drivers",        icon: UsersIcon },
    { id: "trips",        label: "Trips",          icon: NavigationIcon },
    { id: "maintenance",  label: "Maintenance",    icon: WrenchIcon },
    { id: "fuel_expenses",label: "Fuel & Expenses",icon: FuelIcon },
    { id: "analytics",   label: "Analytics",      icon: BarChart3Icon },
    { id: "settings",    label: "Settings",       icon: SettingsIcon },
  ];
  const navItems = ALL_NAV.filter(n => !user || allowedNav.includes(n.id));
  const userInitials = user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) ?? "??";

  return (
    <div className="min-h-screen flex bg-[#f4f6f8] text-[#111827] font-sans antialiased">
      
      {/* ══ SIDEBAR (LEFT) ══ */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between p-6 shrink-0">
        <div className="space-y-8">
          
          {/* Donezo Logo style */}
          <div className="flex items-center gap-2 px-2">
            <div className="size-8 rounded-xl bg-[#0d5c3a] flex items-center justify-center text-white">
              <CheckCircle2Icon className="size-5" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 truncate max-w-[150px]" style={{ fontFamily: "var(--font-space-grotesk)" }} title={boardName}>
              {boardName}
            </span>
          </div>

          {/* Menu Sections */}
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 mb-2">Menu</p>
              <nav className="space-y-0.5">
                {navItems.map(({ id, label, icon: Icon }) => {
                  const active = activeMenu === id;
                  return (
                    <button
                      key={id}
                      onClick={() => { setActiveMenu(id as MenuType); setEditingId(null); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all text-left cursor-pointer"
                      style={{
                        background: active ? "#eef6f2" : "transparent",
                        color: active ? "#0d5c3a" : "#4b5563",
                      }}
                    >
                      <Icon className="size-4 shrink-0" style={{ color: active ? "#0d5c3a" : "#9ca3af" }} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 mb-2">General</p>
              <nav className="space-y-0.5">
                <button onClick={() => setActiveMenu("settings")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-[#4b5563] hover:bg-slate-50 text-left cursor-pointer">
                  <SettingsIcon className="size-4 text-[#9ca3af]" />
                  <span>Settings</span>
                </button>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-[#4b5563] hover:bg-slate-50 text-left cursor-pointer">
                  <LogOutIcon className="size-4 text-[#9ca3af]" />
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          </div>

        </div>

        {/* Promo Download app card */}
        <div className="rounded-2xl p-4 text-white relative overflow-hidden flex flex-col gap-3 justify-end h-[160px] shadow"
          style={{
            background: "linear-gradient(135deg, #093c25 0%, #0d5c3a 100%)",
            backgroundImage: "radial-gradient(circle at 100% 0%, rgba(255,255,255,0.06) 0%, transparent 80%)"
          }}>
          <div className="size-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs border border-white/20">
            📱
          </div>
          <div>
            <h4 className="text-[12px] font-bold">Download our MOBILE APP</h4>
            <p className="text-[9px] text-white/70 mt-0.5">Get easy in another way.</p>
          </div>
          <button className="w-full h-8 rounded-lg bg-white text-[#0d5c3a] hover:bg-slate-100 text-[10px] font-bold transition-all cursor-pointer">
            Download
          </button>
        </div>

      </aside>

      {/* ══ MAIN WORKSPACE (RIGHT) ══ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200/80 bg-white flex items-center justify-between px-8 gap-4 shrink-0">
          
          {/* Search bar Donezo style */}
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#9ca3af]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search task"
              className="w-full pl-10 pr-12 h-9 rounded-xl bg-[#f4f6f8] text-sm text-[#111827] outline-none border-0 focus:ring-1 focus:ring-[#0d5c3a] transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 border border-slate-200 bg-white px-1.5 py-0.5 rounded">
              ⌘ F
            </span>
          </div>

          {/* Controls right */}
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-slate-50 text-[#4b5563] relative cursor-pointer">
              <MailIcon className="size-4" />
            </button>
            <button className="p-2 rounded-full hover:bg-slate-50 text-[#4b5563] relative cursor-pointer">
              <BellIcon className="size-4" />
              <div className="absolute top-1.5 right-1.5 size-1.5 bg-[#0d5c3a] rounded-full" />
            </button>
            
            {/* Theme toggle */}
            <ThemeToggle />

            {/* Profile widget */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="size-9 rounded-full bg-[#e8f5e9] text-[#0d5c3a] flex items-center justify-center font-bold text-[12px] border border-emerald-100">
                {userInitials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[12px] font-bold text-slate-900 leading-none">{user?.name ?? "Totok Michael"}</p>
                <p className="text-[9px] text-slate-400 mt-1 leading-none">{user?.email ?? "tmichael20@gmail.com"}</p>
              </div>
            </div>
          </div>

        </header>

        {/* Content Workspace */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#f4f6f8]">
          
          {/* ════ DASHBOARD VIEW ════ */}
          {activeMenu === "dashboard" && (
            <div className="space-y-6 animate-fadeup">
              
              {/* Header Title with buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    Dashboard
                  </h1>
                  <p className="text-[12px] text-slate-500 mt-0.5">Plan, prioritize, and accomplish your tasks with ease.</p>
                </div>
                <div className="flex items-center gap-2">
                  {canWrite("trip") && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                      <DialogTrigger render={
                        <button className="px-4 h-9 rounded-xl bg-[#0d5c3a] hover:bg-[#064e3b] text-white text-xs font-bold border-0 hover-lift flex items-center gap-1 cursor-pointer shadow-sm">
                          <PlusIcon className="size-4" /> Add Project
                        </button>
                      } />
                      <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 text-slate-900">
                        <TripForm onSuccess={ok} />
                      </DialogContent>
                    </Dialog>
                  )}
                  <button onClick={() => setActiveMenu("trips")} className="px-4 h-9 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all hover-lift cursor-pointer shadow-sm">
                    Import Data
                  </button>
                </div>
              </div>

              {/* ── FILTERS BAR ── */}
              <div className="flex flex-wrap gap-3 p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
                <div className="flex-1 min-w-[150px]">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Vehicle Type</p>
                  <Select defaultValue="all"><SelectTrigger className="h-8 text-xs bg-slate-50 border border-slate-200 rounded-lg"><SelectValue placeholder="All" /></SelectTrigger><SelectContent className="bg-white"><SelectItem value="all">All</SelectItem><SelectItem value="heavy">Heavy Trucks</SelectItem><SelectItem value="van">Vans</SelectItem></SelectContent></Select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Status</p>
                  <Select defaultValue="all"><SelectTrigger className="h-8 text-xs bg-slate-50 border border-slate-200 rounded-lg"><SelectValue placeholder="All" /></SelectTrigger><SelectContent className="bg-white"><SelectItem value="all">All</SelectItem><SelectItem value="available">Available</SelectItem><SelectItem value="on-trip">On Trip</SelectItem></SelectContent></Select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Region</p>
                  <Select defaultValue="all"><SelectTrigger className="h-8 text-xs bg-slate-50 border border-slate-200 rounded-lg"><SelectValue placeholder="All" /></SelectTrigger><SelectContent className="bg-white"><SelectItem value="all">All</SelectItem><SelectItem value="north">North</SelectItem><SelectItem value="south">South</SelectItem></SelectContent></Select>
                </div>
              </div>

              {/* ── 7 KPI CARDS ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { label: "Active Vehicles",   val: vS.onTrip,     border: "border-l-4 border-l-blue-500" },
                  { label: "Available Vehicles",val: vS.available,  border: "border-l-4 border-l-emerald-500" },
                  { label: "In Maintenance",    val: String(vS.inShop).padStart(2,"0"), border: "border-l-4 border-l-amber-500" },
                  { label: "Active Trips",      val: tS.active,     border: "border-l-4 border-l-blue-500" },
                  { label: "Pending Trips",     val: String(tS.pending).padStart(2,"0"), border: "border-l-4 border-l-blue-500" },
                  { label: "Drivers on Duty",   val: dS.onTrip,     border: "border-l-4 border-l-blue-500" },
                  { label: "Fleet Utilization", val: `${fleetUtil}%`,border: "border-l-4 border-l-emerald-500" },
                ].map(({ label, val, border }) => (
                  <div key={label} className={`bg-white p-4 rounded-xl border border-slate-200/70 shadow-sm flex flex-col justify-between h-20 ${border}`}>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-tight">{label}</p>
                    <h3 className="text-xl font-bold text-slate-900 leading-none mt-1" style={{ fontFamily: "var(--font-space-grotesk)" }}>{val}</h3>
                  </div>
                ))}
              </div>

              {/* ── RECENT TRIPS & VEHICLE STATUS SIDE-BY-SIDE ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* Recent Trips Table */}
                <div className={`${cardBg} lg:col-span-2 p-5 space-y-4`}>
                  <p className={lbl}>Recent Trips</p>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow style={{ borderBottom: "1px solid #f1f3f5" }}>
                          {["Trip", "Vehicle", "Driver", "Status", "ETA"].map((h, i) => (
                            <TableHead key={h} className={`${thCl} ${i === 0 ? "pl-2" : ""}`}>{h}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentTrips.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-400 text-xs">No dispatches found</TableCell></TableRow>
                        ) : (
                          recentTrips.map((t, idx) => {
                            const etas = ["45 min", "—", "1h 10m", "Awaiting vehicle", "—"];
                            return (
                              <TableRow key={t.id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                                <TableCell className="py-2.5 pl-2 font-bold text-slate-800">TR-{1001 + idx}</TableCell>
                                <TableCell className="py-2.5 text-slate-500">{(t as any).vehicle?.name || "—"}</TableCell>
                                <TableCell className="py-2.5 text-slate-500">{(t as any).driver?.name || "—"}</TableCell>
                                <TableCell className="py-2.5">
                                  <StatusPill status={t.status} />
                                </TableCell>
                                <TableCell className="py-2.5 text-xs text-slate-500 font-semibold">{etas[idx % etas.length]}</TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Vehicle Status horizontal bars */}
                <div className={`${cardBg} p-5 flex flex-col justify-between h-full`}>
                  <div>
                    <p className={lbl}>Vehicle Status</p>
                    <div className="space-y-4 mt-4">
                      <HBar label="Available" count={vS.available} total={vS.total} color="#22c55e" />
                      <HBar label="On Trip"   count={vS.onTrip}    total={vS.total} color="#3b82f6" />
                      <HBar label="In Shop"   count={vS.inShop}    total={vS.total} color="#f59e0b" />
                      <HBar label="Retired"   count={vS.retired}   total={vS.total} color="#f43f5e" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 pt-3 border-t border-slate-100 mt-4">Operational status tracking logs.</p>
                </div>

              </div>

              {/* ── ADDITIONAL WIDGETS BELOW (Other features) ── */}
              <div className="grid grid-cols-1 lg:grid-cols-10 gap-5">
                
                {/* Cost bar chart */}
                <div className={`${cardBg} lg:col-span-4 p-5 space-y-4`}>
                  <p className={lbl}>Project Cost Analytics</p>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={costBarData} barSize={26}>
                        <XAxis dataKey="name" tick={{ fontSize:10, fill:"#666" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize:9, fill:"#888" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: any) => [`₹ ${Number(v).toLocaleString()}`, "Cost"]} contentStyle={{ background:"#fff", border:"1px solid #eee", borderRadius:8, fontSize:10 }} />
                        <Bar dataKey="cost" fill="#0d5c3a" radius={[6,6,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Reminders Meeting card */}
                <div className={`${cardBg} lg:col-span-3 p-5 flex flex-col justify-between h-[230px]`}>
                  <div>
                    <p className={lbl}>Reminders</p>
                    <h4 className="text-sm font-bold text-[#0d5c3a] tracking-tight mt-1" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      Log Operations Update
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1">Due today: log fuel logs, update active shop listings, and process pending runs.</p>
                  </div>
                  <button onClick={() => setActiveMenu("fuel_expenses")} className="w-full h-9 rounded-xl bg-[#0d5c3a] hover:bg-[#064e3b] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                    Start Logging
                  </button>
                </div>

                {/* Time Tracker widget */}
                <div className="lg:col-span-3 rounded-2xl p-5 text-white flex flex-col justify-between h-[230px] relative overflow-hidden shadow-sm"
                  style={{
                    background: "linear-gradient(135deg, #093c25 0%, #0d5c3a 100%)",
                  }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Trip Clock Tracker</p>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      {String(time.h).padStart(2, "0")}:{String(time.m).padStart(2, "0")}:{String(time.s).padStart(2, "0")}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setTimerActive(a => !a)} className="size-8 rounded-full bg-white text-[#0d5c3a] flex items-center justify-center font-bold text-xs hover:bg-slate-100 transition-all border-0 cursor-pointer">
                      {timerActive ? "⏸" : "▶"}
                    </button>
                  </div>
                </div>

              </div>

              {/* Row 3: Team Collaboration + Gauge progress + Timer widget */}
              <div className="grid grid-cols-1 lg:grid-cols-10 gap-5">
                
                {/* Driver Roster (45%) */}
                <div className={`${cardBg} lg:col-span-4 p-5 space-y-3`}>
                  <div className="flex justify-between items-center">
                    <p className={lbl}>Driver Collaboration</p>
                    <button onClick={() => setActiveMenu("drivers")} className="text-[10px] font-bold text-[#0d5c3a] hover:underline">+ View Roster</button>
                  </div>
                  <div className="space-y-3">
                    {drivers?.slice(0,3).map((d, i) => (
                      <div key={d.id} className="flex justify-between items-center pb-2.5 border-b border-slate-100 last:border-0">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-full bg-[#f1f3f5] text-[#0d5c3a] flex items-center justify-center font-bold text-xs uppercase">
                            {d.name.substring(0,2)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{d.name}</p>
                            <p className="text-[9px] text-slate-400">License: {d.licenseNumber}</p>
                          </div>
                        </div>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold ${d.status === DriverStatus.AVAILABLE ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                          {d.status.toLowerCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress Gauge (30%) */}
                <div className={`${cardBg} lg:col-span-3 p-5 flex flex-col justify-between items-center text-center`}>
                  <p className={`${lbl} self-start`}>Fleet Capacity Utilization</p>
                  
                  {/* Gauge Arc representation */}
                  <div className="relative size-32 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[
                          { value: fleetUtil, fill: "#0d5c3a" },
                          { value: 100 - fleetUtil, fill: "#f1f3f5" }
                        ]} cx="50%" cy="50%" startAngle={180} endAngle={0} innerRadius={35} outerRadius={46} dataKey="value">
                          <Cell fill="#0d5c3a" />
                          <Cell fill="#f1f3f5" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute text-center mt-3">
                      <span className="text-2xl font-black text-slate-800">{fleetUtil}%</span>
                      <p className="text-[9px] text-slate-400">Capacity used</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-[9px] text-slate-400">
                    <span className="flex items-center gap-1"><div className="size-2 rounded-full bg-[#0d5c3a]" /> Active</span>
                    <span className="flex items-center gap-1"><div className="size-2 rounded-full bg-slate-200" /> Available</span>
                  </div>
                </div>

                {/* Time Tracker green visual widget (25%) */}
                <div className="lg:col-span-3 rounded-2xl p-5 text-white flex flex-col justify-between h-[210px] relative overflow-hidden shadow-sm"
                  style={{
                    background: "linear-gradient(135deg, #093c25 0%, #0d5c3a 100%)",
                  }}>
                  {/* Decorative wave element */}
                  <div className="absolute -right-6 -bottom-6 size-24 rounded-full bg-white/5 border border-white/10" />
                  
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Trip Clock Tracker</p>
                  
                  <div>
                    <h3 className="text-3xl font-black tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      {String(time.h).padStart(2, "0")}:{String(time.m).padStart(2, "0")}:{String(time.s).padStart(2, "0")}
                    </h3>
                    <p className="text-[9px] text-emerald-200/80 mt-0.5">Monitoring current active dispatch interval.</p>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setTimerActive(a => !a)} className="size-8 rounded-full bg-white text-[#0d5c3a] flex items-center justify-center font-bold text-xs hover:bg-slate-100 transition-all border-0 cursor-pointer">
                      {timerActive ? "⏸" : "▶"}
                    </button>
                    <button onClick={() => setTime({ h:0, m:0, s:0 })} className="size-8 rounded-full bg-red-600/90 text-white flex items-center justify-center font-bold text-xs hover:bg-red-700 transition-all border-0 cursor-pointer">
                      ⏹
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ════ FLEET ════ */}
          {activeMenu === "fleet" && (
            <div className="space-y-5 animate-fadeup">
              <div className={`${secHead} flex justify-between items-center`}>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily:"var(--font-space-grotesk)" }}>Fleet Registry</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Manage vehicles, load capacities, and active registries.</p>
                </div>
                {canWrite("vehicle") && (
                  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger render={<button className="px-4 h-9 rounded-xl text-white text-xs font-bold bg-[#0d5c3a] hover:bg-[#064e3b] border-0 hover-lift cursor-pointer"><span className="flex items-center gap-1.5"><PlusIcon className="size-4" /> Add Vehicle</span></button>} />
                    <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 text-slate-900"><VehicleForm onSuccess={ok} /></DialogContent>
                  </Dialog>
                )}
              </div>
              <div className={cardBg}><VehicleTable onEdit={canWrite("vehicle") ? id => setEditingId(id) : undefined} /></div>
            </div>
          )}

          {/* ════ DRIVERS ════ */}
          {activeMenu === "drivers" && (
            <div className="space-y-5 animate-fadeup">
              <div className={`${secHead} flex justify-between items-center`}>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily:"var(--font-space-grotesk)" }}>Registered Drivers</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Manage driver license statuses and duty allocations.</p>
                </div>
                {canWrite("driver") && (
                  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger render={<button className="px-4 h-9 rounded-xl text-white text-xs font-bold bg-[#0d5c3a] hover:bg-[#064e3b] border-0 hover-lift cursor-pointer"><span className="flex items-center gap-1.5"><PlusIcon className="size-4" /> Register Driver</span></button>} />
                    <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 text-slate-900"><DriverForm onSuccess={ok} /></DialogContent>
                  </Dialog>
                )}
              </div>
              <div className={cardBg}><DriverTable onEdit={canWrite("driver") ? id => setEditingId(id) : undefined} /></div>
            </div>
          )}

          {/* ════ TRIPS ════ */}
          {activeMenu === "trips" && (
            <div className="space-y-5 animate-fadeup">
              <div className={`${secHead} flex justify-between items-center`}>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily:"var(--font-space-grotesk)" }}>Logistics Trips</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Track, schedule, and dispatch transport runs.</p>
                </div>
                {canWrite("trip") && (
                  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger render={<button className="px-4 h-9 rounded-xl text-white text-xs font-bold bg-[#0d5c3a] hover:bg-[#064e3b] border-0 hover-lift cursor-pointer"><span className="flex items-center gap-1.5"><PlusIcon className="size-4" /> Schedule Trip</span></button>} />
                    <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 text-slate-900"><TripForm onSuccess={ok} /></DialogContent>
                  </Dialog>
                )}
              </div>
              <div className={cardBg}><TripTable /></div>
            </div>
          )}

          {/* ════ MAINTENANCE ════ */}
          {activeMenu === "maintenance" && (
            <div className="space-y-5 animate-fadeup">
              <div className={secHead}>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily:"var(--font-space-grotesk)" }}>Maintenance Management</h1>
                <p className="text-xs text-slate-500 mt-0.5">Track repair budgets and shop schedules.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {canWrite("maintenance") && (
                  <div className="space-y-4">
                    <div className={`${cardBg} p-5`}>
                      <p className={lbl + " mb-4"}>Log Service Record</p>
                      <div className="space-y-3">
                        <div>
                          <label className={lbl}>Vehicle</label>
                          <Select value={MF.vehicleId} onValueChange={v => setMF(f => ({ ...f, vehicleId:v ?? "" }))}>
                            <SelectTrigger className={selCl}><SelectValue placeholder="Select vehicle…" /></SelectTrigger>
                            <SelectContent className={selCntCl}>
                              {availV.length === 0 ? <div className="p-3 text-xs text-slate-400">None available</div>
                                : availV.map(v => <SelectItem key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div><label className={lbl}>Service Type</label><input value={MF.title} onChange={e => setMF(f => ({ ...f, title:e.target.value }))} placeholder="Oil Change, Engine Repair…" className={inputCl} /></div>
                        <div><label className={lbl}>Cost (₹)</label><input type="number" value={MF.cost} onChange={e => setMF(f => ({ ...f, cost:e.target.value }))} placeholder="e.g. 2500" className={inputCl} /></div>
                        <button onClick={() => cMaint.mutate({ title:MF.title, description:MF.description||null, cost:Number(MF.cost), vehicleId:MF.vehicleId })} disabled={cMaint.isPending} className="w-full h-10 rounded-xl text-white text-xs font-bold bg-[#0d5c3a] hover:bg-[#064e3b] border-0 transition-all cursor-pointer">
                          {cMaint.isPending ? "Saving…" : "Save Record"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className={`${cardBg} ${canWrite("maintenance") ? "lg:col-span-2" : "lg:col-span-3"}`}>
                  <div className="px-5 pt-5 pb-2"><p className={lbl}>Service Logs</p></div>
                  <Table>
                    <TableHeader>
                      <TableRow style={{ borderBottom: "1px solid #f1f3f5" }}>
                        {["Vehicle","Service","Cost","Status","Actions"].map((h,i) => <TableHead key={h} className={`${thCl} ${i===0?"pl-5":""} ${i===4?"pr-5 text-right":""}`}>{h}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!maintenances || maintenances.length === 0
                        ? <TableRow><TableCell colSpan={5} className="py-10 text-center text-slate-400 text-xs">No service logs</TableCell></TableRow>
                        : maintenances.map(m => (
                          <TableRow key={m.id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                            <TableCell className="py-3.5 pl-5 font-semibold text-slate-800">{m.vehicle.name}</TableCell>
                            <TableCell className="py-3.5 text-slate-500">{m.title}</TableCell>
                            <TableCell className="py-3.5 text-slate-500" style={{ fontFamily:"var(--font-jetbrains-mono)" }}>₹ {m.cost.toLocaleString()}</TableCell>
                            <TableCell className="py-3.5">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${m.status===MaintenanceStatus.ACTIVE ? "bg-amber-50 text-amber-800 border-amber-200/50" : "bg-emerald-50 text-emerald-800 border-emerald-200/50"}`}>
                                {m.status === MaintenanceStatus.ACTIVE ? "In Shop" : "Completed"}
                              </span>
                            </TableCell>
                            <TableCell className="py-3.5 pr-5 text-right">
                              {m.status === MaintenanceStatus.ACTIVE && canWrite("maintenance")
                                ? <button onClick={() => xMaint.mutate({ id:m.id })} disabled={xMaint.isPending} className="text-[11px] font-bold px-3 py-1.5 rounded-lg text-white bg-[#10b981] hover:bg-[#059669] border-0 transition-all cursor-pointer">Complete</button>
                                : <span className="text-[11px] text-slate-400">Done</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* ════ FUEL & EXPENSES ════ */}
          {activeMenu === "fuel_expenses" && (
            <div className="space-y-5 animate-fadeup">
              <div className={`${secHead} flex justify-between items-center`}>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily:"var(--font-space-grotesk)" }}>Fuel & Expense Management</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Track resource spend and trip logistics expenses.</p>
                </div>
                <div className="flex gap-2">
                  {canWrite("fuel") && (
                    <Dialog open={isFuelOpen} onOpenChange={setIsFuelOpen}>
                      <DialogTrigger render={<button className="px-4 h-9 rounded-xl text-white text-xs font-bold bg-[#0d5c3a] hover:bg-[#064e3b] border-0 transition-all cursor-pointer">+ Log Fuel</button>} />
                      <DialogContent className="bg-white border border-slate-200 text-slate-900">
                        <div className="space-y-4">
                          <h2 className="text-lg font-bold">Log Fuel</h2>
                          <div className="space-y-3">
                            <div><label className={lbl}>Vehicle</label>
                              <Select value={FF.vehicleId} onValueChange={v => setFF(f => ({ ...f, vehicleId:v ?? "" }))}>
                                <SelectTrigger className={selCl}><SelectValue placeholder="Select vehicle…" /></SelectTrigger>
                                <SelectContent className={selCntCl}>{vehicles?.map(v => <SelectItem key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div><label className={lbl}>Liters</label><input type="number" value={FF.liters} onChange={e => setFF(f => ({ ...f, liters:e.target.value }))} placeholder="e.g. 42" className={inputCl} /></div>
                            <div><label className={lbl}>Cost (₹)</label><input type="number" value={FF.cost} onChange={e => setFF(f => ({ ...f, cost:e.target.value }))} placeholder="e.g. 3150" className={inputCl} /></div>
                          </div>
                          <div className="flex justify-end gap-2"><button onClick={() => setIsFuelOpen(false)} className="px-4 h-9 text-xs text-slate-400 hover:text-slate-600">Cancel</button><button onClick={() => cFuel.mutate({ vehicleId:FF.vehicleId, liters:Number(FF.liters), cost:Number(FF.cost), tripId:FF.tripId||null })} disabled={cFuel.isPending} className="px-4 h-9 bg-[#0d5c3a] hover:bg-[#064e3b] rounded-xl text-xs font-bold text-white">{cFuel.isPending?"Logging…":"Log Fuel"}</button></div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {canWrite("expense") && (
                    <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
                      <DialogTrigger render={<button className="px-4 h-9 rounded-xl text-white text-xs font-bold bg-[#0d5c3a] hover:bg-[#064e3b] border-0 transition-all cursor-pointer">+ Add Expense</button>} />
                      <DialogContent className="bg-white border border-slate-200 text-slate-900">
                        <div className="space-y-4">
                          <h2 className="text-lg font-bold">Add Expense</h2>
                          <div className="space-y-3">
                            <div><label className={lbl}>Vehicle</label>
                              <Select value={EF.vehicleId} onValueChange={v => setEF(f => ({ ...f, vehicleId:v ?? "" }))}>
                                <SelectTrigger className={selCl}><SelectValue placeholder="Select vehicle…" /></SelectTrigger>
                                <SelectContent className={selCntCl}>{vehicles?.map(v => <SelectItem key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div><label className={lbl}>Type</label>
                              <Select value={EF.type} onValueChange={v => setEF(f => ({ ...f, type:v as any }))}>
                                <SelectTrigger className={selCl}><SelectValue /></SelectTrigger>
                                <SelectContent className={selCntCl}><SelectItem value="TOLL">Toll</SelectItem><SelectItem value="REPAIR">Repair</SelectItem><SelectItem value="INSURANCE">Insurance</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent>
                              </Select>
                            </div>
                            <div><label className={lbl}>Amount (₹)</label><input type="number" value={EF.amount} onChange={e => setEF(f => ({ ...f, amount:e.target.value }))} placeholder="e.g. 120" className={inputCl} /></div>
                            <div><label className={lbl}>Description</label><input value={EF.description} onChange={e => setEF(f => ({ ...f, description:e.target.value }))} placeholder="e.g. NH-44 Toll" className={inputCl} /></div>
                          </div>
                          <div className="flex justify-end gap-2"><button onClick={() => setIsExpenseOpen(false)} className="px-4 h-9 text-xs text-slate-400 hover:text-slate-600">Cancel</button><button onClick={() => cExp.mutate({ vehicleId:EF.vehicleId, type:EF.type, amount:Number(EF.amount), description:EF.description||null })} disabled={cExp.isPending} className="px-4 h-9 bg-[#0d5c3a] hover:bg-[#064e3b] rounded-xl text-xs font-bold text-white">{cExp.isPending?"Adding…":"Add Expense"}</button></div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {/* Fuel logs table */}
              <div className={cardBg}>
                <div className="px-5 pt-5 pb-2"><p className={lbl}>Fuel Logs</p></div>
                <Table>
                  <TableHeader><TableRow style={{ borderBottom:"1px solid #f1f3f5" }}>{["Vehicle","Date","Liters","Fuel Cost"].map((h,i) => <TableHead key={h} className={`${thCl} ${i===0?"pl-5":""} ${i===3?"pr-5 text-right":""}`}>{h}</TableHead>)}</TableRow></TableHeader>
                  <TableBody>
                    {!fuelLogs || fuelLogs.length===0 ? <TableRow><TableCell colSpan={4} className="py-10 text-center text-slate-400 text-xs">No fuel logs</TableCell></TableRow>
                      : fuelLogs.map(log => (
                        <TableRow key={log.id} style={{ borderBottom:"1px solid #f1f3f5" }}>
                          <TableCell className="py-3.5 pl-5 font-semibold text-slate-800">{log.vehicle.name} <span className="text-[10px] text-slate-400">({log.vehicle.registrationNumber})</span></TableCell>
                          <TableCell className="py-3.5 text-slate-500">{new Date(log.date).toLocaleDateString("en-IN",{ day:"2-digit",month:"short",year:"numeric" })}</TableCell>
                          <TableCell className="py-3.5 text-slate-500" style={{ fontFamily:"var(--font-jetbrains-mono)" }}>{log.liters} L</TableCell>
                          <TableCell className="py-3.5 pr-5 text-right font-bold text-red-600" style={{ fontFamily:"var(--font-jetbrains-mono)" }}>₹ {log.cost.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>

              {/* Expenses table */}
              <div className={cardBg}>
                <div className="px-5 pt-5 pb-2"><p className={lbl}>Other Expenses (Toll / Misc)</p></div>
                <Table>
                  <TableHeader><TableRow style={{ borderBottom:"1px solid #f1f3f5" }}>{["Vehicle","Type","Description","Date","Amount"].map((h,i) => <TableHead key={h} className={`${thCl} ${i===0?"pl-5":""} ${i===4?"pr-5 text-right":""}`}>{h}</TableHead>)}</TableRow></TableHeader>
                  <TableBody>
                    {!expenses || expenses.length===0 ? <TableRow><TableCell colSpan={5} className="py-10 text-center text-slate-400 text-xs">No expenses</TableCell></TableRow>
                      : expenses.map(exp => (
                        <TableRow key={exp.id} style={{ borderBottom:"1px solid #f1f3f5" }}>
                          <TableCell className="py-3.5 pl-5 font-semibold text-slate-800">{exp.vehicle.name} <span className="text-[10px] text-slate-400">({exp.vehicle.registrationNumber})</span></TableCell>
                          <TableCell className="py-3.5 capitalize text-slate-500">{exp.type.toLowerCase()}</TableCell>
                          <TableCell className="py-3.5 text-slate-500">{exp.description||"—"}</TableCell>
                          <TableCell className="py-3.5 text-slate-500">{new Date(exp.date).toLocaleDateString("en-IN",{ day:"2-digit",month:"short",year:"numeric" })}</TableCell>
                          <TableCell className="py-3.5 pr-5 text-right font-bold text-red-600" style={{ fontFamily:"var(--font-jetbrains-mono)" }}>₹ {exp.amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ════ ANALYTICS ════ */}
          {activeMenu === "analytics" && (
            <div className="space-y-5 animate-fadeup">
              <div className={secHead}>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily:"var(--font-space-grotesk)" }}>Analytics</h1>
                <p className="text-xs text-slate-500 mt-0.5">Workspace cost aggregation and logistics charts.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { title:"Operational Costs", rows:[{ l:"Total Fuel", v:`₹ ${totalFuel.toLocaleString()}`, c:"text-red-600" },{ l:"Maintenance", v:`₹ ${totalMaint.toLocaleString()}`, c:"text-red-600" }], total:{ l:"Total Cost", v:`₹ ${totalOp.toLocaleString()}`, c:"text-red-600" } },
                  { title:"Revenue & ROI",     rows:[{ l:"Revenue Logged", v:`₹ ${totalRev.toLocaleString()}`, c:"text-emerald-700" },{ l:"Completed Deliveries", v:`${tS.completed} runs`, c:"text-slate-800" }], total:{ l:"Net ROI", v:`₹ ${(totalRev-totalOp).toLocaleString()}`, c:"text-emerald-700" } },
                ].map(({ title, rows, total }) => (
                  <div key={title} className={`${cardBg} p-6 space-y-4`}>
                    <p className={lbl}>{title}</p>
                    {rows.map(({ l, v, c }) => (
                      <div key={l} className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-xs text-slate-500">{l}</span>
                        <span className={`font-bold text-sm ${c}`} style={{ fontFamily:"var(--font-space-grotesk)" }}>{v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2">
                      <span className="font-semibold text-xs text-slate-800">{total.l}</span>
                      <span className={`text-lg font-bold ${total.c}`} style={{ fontFamily:"var(--font-space-grotesk)" }}>{total.v}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ SETTINGS ════ */}
          {activeMenu === "settings" && (
            <div className="space-y-5 animate-fadeup">
              <div className={secHead}>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily:"var(--font-space-grotesk)" }}>Settings</h1>
                <p className="text-xs text-slate-500 mt-0.5">Configure system thresholds and alerts.</p>
              </div>
              <div className={`${cardBg} p-6`}><p className="text-xs text-slate-500">System settings coming soon.</p></div>
            </div>
          )}

        </div>

      </div>

      {/* Edit dialog */}
      <Dialog open={!!editingId} onOpenChange={open => !open && setEditingId(null)}>
        <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 text-slate-900">
          {editingId && activeMenu==="fleet"   && <VehicleForm vehicleId={editingId} onSuccess={oEd} />}
          {editingId && activeMenu==="drivers" && <DriverForm  driverId={editingId}  onSuccess={oEd} />}
        </DialogContent>
      </Dialog>

    </div>
  );
}
