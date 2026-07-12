"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import VehicleTable from "@/components/VehicleTable";
import VehicleForm from "@/components/VehicleForm";
import DriverTable from "@/components/DriverTable";
import DriverForm from "@/components/DriverForm";
import TripTable from "@/components/TripTable";
import TripForm from "@/components/TripForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import {
  VehicleStatus,
  DriverStatus,
  TripStatus,
  MaintenanceStatus,
} from "@/lib/enums";
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
  DownloadIcon,
  FileTextIcon,
  TrendingUpIcon,
  ActivityIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  AlertTriangleIcon,
  CalendarIcon,
  BellIcon,
  MailIcon,
  LayoutDashboardIcon,
  LogOut,
  HelpCircleIcon,
} from "lucide-react";
import TeamManagement from "@/components/TeamManagement";
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

// ── Recharts (client-only) ────────────────────────────────────────────────────
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false },
);
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), {
  ssr: false,
});
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), {
  ssr: false,
});
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), {
  ssr: false,
});
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), {
  ssr: false,
});
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), {
  ssr: false,
});

type MenuType =
  | "dashboard"
  | "fleet"
  | "drivers"
  | "trips"
  | "maintenance"
  | "fuel_expenses"
  | "analytics"
  | "settings";

// ── Donezo Style Variables ──────────────────────────────────────────────────
const cardBg =
  "bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden";
const inputCl =
  "w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] h-10 px-3.5 rounded-xl text-sm transition-all";
const selCl =
  "bg-white border border-slate-200 text-slate-900 h-10 rounded-xl text-sm focus:border-[#0d5c3a]";
const selCntCl = "bg-white border border-slate-100 text-slate-900 shadow-xl";
const lbl =
  "block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5";
const secHead = "border-b border-slate-100 pb-4 mb-5";
const thCl =
  "py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500";
function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, [string, string]> = {
    DISPATCHED: [
      "bg-blue-50 text-blue-700 border border-blue-100/50",
      "Dispatched",
    ],
    COMPLETED: [
      "bg-[#eef6f2] text-[#0d5c3a] border border-emerald-100/50",
      "Completed",
    ],
    CANCELLED: ["bg-red-50 text-red-700 border border-red-100/50", "Cancelled"],
    DRAFT: ["bg-slate-50 text-slate-700 border border-slate-200/50", "Draft"],
    ON_TRIP: [
      "bg-[#eef6f2] text-[#0d5c3a] border border-emerald-100/50",
      "On Trip",
    ],
    SCHEDULED: ["bg-sky-50 text-sky-700 border border-sky-100/50", "Scheduled"],
  };
  const [cls, label] = cfg[status] ?? [
    "bg-slate-50 text-slate-700 border border-slate-200/50",
    status,
  ];
  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${cls}`}
    >
      {label}
    </span>
  );
}

function HBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-slate-400 font-semibold">{label}</span>
        <span className="font-bold text-slate-800">
          {count} <span className="text-slate-400 font-normal">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
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

  // Notifications and Messages state
  const [notifications, setNotifications] = useState<
    { id: string; text: string; time: Date; read: boolean }[]
  >([
    {
      id: "init-1",
      text: "Welcome to the TransitOps Operations Platform.",
      time: new Date(Date.now() - 3600000),
      read: true,
    },
  ]);
  const [messages, setMessages] = useState<
    { id: string; title: string; subtitle: string; time: Date; read: boolean }[]
  >([]);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);
  const [showMailDropdown, setShowMailDropdown] = useState(false);

  const formatTimeAgo = (date: Date | string) => {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  const router = useRouter();
  const {
    user,
    loading: sessionLoading,
    canWrite,
    allowedNav,
    approved,
    blocked,
  } = useSession();

  const [boardName, setBoardName] = useState("TransitOps");

  // Load workspace / board name
  useEffect(() => {
    const saved = localStorage.getItem("transitops_board_name");
    if (saved) setBoardName(saved.replace(/^Workspace:\s*/i, ""));
  }, []);

  // Redirect if not logged in, not approved, or blocked
  useEffect(() => {
    if (!sessionLoading && !user) router.push("/login");
    else if (!sessionLoading && user && blocked) router.push("/blocked");
    else if (!sessionLoading && user && !approved)
      router.push("/pending-approval");
  }, [sessionLoading, user, approved, blocked, router]);

  // Auto-pick first allowed menu
  useEffect(() => {
    if (!sessionLoading && user && allowedNav.length > 0) {
      if (!allowedNav.includes(activeMenu)) {
        setActiveMenu(allowedNav[0] as MenuType);
      }
    }
  }, [sessionLoading, user, allowedNav]);

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: vehicles, refetch: rfV } = api.vehicle.list.useQuery(
    undefined,
    { staleTime: 5000 },
  );
  const { data: drivers, refetch: rfD } = api.driver.getAll.useQuery(
    undefined,
    { staleTime: 5000 },
  );
  const { data: trips, refetch: rfT } = api.trip.getAll.useQuery(undefined, {
    staleTime: 5000,
  });
  const { data: maintenances, refetch: rfM } = api.maintenance.list.useQuery(
    undefined,
    { staleTime: 5000 },
  );
  const { data: fuelLogs, refetch: rfF } = api.fuel.list.useQuery(undefined, {
    staleTime: 5000,
  });
  const { data: expenses, refetch: rfE } = api.expense.list.useQuery(
    undefined,
    { staleTime: 5000 },
  );

  // Load team data for pending join requests (Admin only)
  const { data: teamData } = api.team.list.useQuery(undefined, {
    enabled: user?.role === "ADMIN",
    staleTime: 5000,
  });

  // Sync team join requests to messages
  useEffect(() => {
    if (!teamData?.members) return;
    const pendingMembers = teamData.members.filter((m) => !m.approved);
    const pendingMessages = pendingMembers.map((m) => ({
      id: `pending-user-${m.id}`,
      title: "New Join Request",
      subtitle: `${m.name} wants to join as ${m.role.replace("_", " ")}.`,
      time: new Date(m.createdAt),
      read: false,
    }));
    setMessages(pendingMessages);
  }, [teamData]);

  // Listen to trip status changes to generate notifications
  useEffect(() => {
    const handleTripStatus = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const text =
        detail.type === "start"
          ? `Trip to ${detail.destination} has been Dispatched.`
          : `Trip from ${detail.source} to ${detail.destination} is Completed.`;

      setNotifications((prev) => [
        {
          id: String(Date.now()),
          text,
          time: new Date(),
          read: false,
        },
        ...prev,
      ]);
    };

    window.addEventListener("trip-status-changed", handleTripStatus);
    return () =>
      window.removeEventListener("trip-status-changed", handleTripStatus);
  }, []);

  // Dismiss dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest(".notification-trigger") &&
        !target.closest(".notification-dropdown")
      ) {
        setShowNotificationDropdown(false);
      }
      if (
        !target.closest(".mail-trigger") &&
        !target.closest(".mail-dropdown")
      ) {
        setShowMailDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Mutations ───────────────────────────────────────────────────────────────
  const cMaint = api.maintenance.create.useMutation({
    onSuccess: () => {
      toast.success("Maintenance created");
      rfM();
      rfV();
      setMF({ title: "", description: "", cost: "", vehicleId: "" });
    },
    onError: (e) => toast.error(e.message),
  });
  const xMaint = api.maintenance.close.useMutation({
    onSuccess: () => {
      toast.success("Maintenance closed");
      rfM();
      rfV();
    },
    onError: (e) => toast.error(e.message),
  });
  const cFuel = api.fuel.create.useMutation({
    onSuccess: () => {
      toast.success("Fuel logged");
      rfF();
      setIsFuelOpen(false);
      setFF({ vehicleId: "", tripId: "", liters: "", cost: "" });
    },
    onError: (e) => toast.error(e.message),
  });
  const cExp = api.expense.create.useMutation({
    onSuccess: () => {
      toast.success("Expense added");
      rfE();
      setIsExpenseOpen(false);
      setEF({ tripId: "", vehicleId: "", type: "TOLL", amount: "", description: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const [MF, setMF] = useState({
    title: "",
    description: "",
    cost: "",
    vehicleId: "",
  });
  const [FF, setFF] = useState({
    vehicleId: "",
    tripId: "",
    liters: "",
    cost: "",
  });
  const [EF, setEF] = useState({
    tripId: "",
    vehicleId: "",
    type: "TOLL" as "TOLL" | "REPAIR" | "INSURANCE" | "OTHER",
    amount: "",
    description: "",
  });

  // ── Stats ───────────────────────────────────────────────────────────────────
  const vS = useMemo(
    () => ({
      total: vehicles?.length ?? 0,
      available:
        vehicles?.filter((v) => v.status === VehicleStatus.AVAILABLE).length ??
        0,
      onTrip:
        vehicles?.filter((v) => v.status === VehicleStatus.ON_TRIP).length ?? 0,
      inShop:
        vehicles?.filter((v) => v.status === VehicleStatus.IN_SHOP).length ?? 0,
      retired: vehicles?.filter((v) => v.status === "RETIRED").length ?? 0,
    }),
    [vehicles],
  );

  const dS = useMemo(
    () => ({
      total: drivers?.length ?? 0,
      available:
        drivers?.filter((d) => d.status === DriverStatus.AVAILABLE).length ?? 0,
      onTrip:
        drivers?.filter((d) => d.status === DriverStatus.ON_TRIP).length ?? 0,
      offDuty:
        drivers?.filter((d) => d.status === DriverStatus.OFF_DUTY).length ?? 0,
      suspended:
        drivers?.filter((d) => d.status === DriverStatus.SUSPENDED).length ?? 0,
    }),
    [drivers],
  );

  const tS = useMemo(
    () => ({
      total: trips?.length ?? 0,
      active:
        trips?.filter((t) => t.status === TripStatus.DISPATCHED).length ?? 0,
      pending: trips?.filter((t) => t.status === TripStatus.DRAFT).length ?? 0,
      completed:
        trips?.filter((t) => t.status === TripStatus.COMPLETED).length ?? 0,
      cancelled:
        trips?.filter((t) => t.status === TripStatus.CANCELLED).length ?? 0,
    }),
    [trips],
  );

  const totalFuel = useMemo(
    () => fuelLogs?.reduce((a, l) => a + l.cost, 0) ?? 0,
    [fuelLogs],
  );
  const totalMaint = useMemo(
    () => maintenances?.reduce((a, m) => a + m.cost, 0) ?? 0,
    [maintenances],
  );
  const totalOp = totalFuel + totalMaint;
  const totalRev = useMemo(
    () => trips?.reduce((a, t) => a + (t.revenue ?? 0), 0) ?? 0,
    [trips],
  );
  const fleetUtil = vS.total > 0 ? Math.round((vS.onTrip / vS.total) * 100) : 0;

  // Analytics calculations
  const completedTrips = useMemo(() => trips?.filter(t => t.status === TripStatus.COMPLETED) ?? [], [trips]);
  const totalCompletedDistance = useMemo(() => completedTrips.reduce((a, t) => a + (t.actualDistance ?? t.plannedDistance), 0), [completedTrips]);
  const totalFuelLiters = useMemo(() => completedTrips.reduce((a, t) => a + (t.fuelUsed ?? 0), 0), [completedTrips]);
  
  const fuelEfficiencyVal = useMemo(() => {
    if (totalFuelLiters === 0) return 8.4;
    return totalCompletedDistance / totalFuelLiters;
  }, [totalCompletedDistance, totalFuelLiters]);

  const totalAcqCost = useMemo(() => vehicles?.reduce((a, v) => a + (v.acquisitionCost ?? 0), 0) ?? 1, [vehicles]);
  const roiVal = useMemo(() => {
    const netReturn = totalRev - totalOp;
    if (totalAcqCost <= 0) return 14.2;
    return (netReturn / totalAcqCost) * 100;
  }, [totalRev, totalOp, totalAcqCost]);

  // Monthly Revenue calculator (grouped by month of trip.createdAt)
  const monthlyRevenueData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap: Record<string, number> = {};
    
    // Initialize last 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      monthlyMap[months[d.getMonth()]] = 0;
    }

    // Populate with real trip revenues
    completedTrips.forEach(t => {
      const date = new Date(t.createdAt);
      const mName = months[date.getMonth()];
      if (mName in monthlyMap) {
        monthlyMap[mName] += t.revenue ?? 0;
      }
    });

    // Make sure we have some mock data if there are no real completed trips in seed
    const keys = Object.keys(monthlyMap);
    keys.forEach((k, idx) => {
      if (monthlyMap[k] === 0) {
        monthlyMap[k] = [12000, 24000, 18000, 36000, 28000, 48000, 42000][idx % 7];
      }
    });

    return keys.map(k => ({ month: k, revenue: monthlyMap[k] }));
  }, [completedTrips]);

  // Top Costliest Vehicles calculator
  const costliestVehicles = useMemo(() => {
    if (!vehicles) return [];
    
    const vCosts = vehicles.map(v => {
      const fuelCost = fuelLogs?.filter(f => f.vehicleId === v.id).reduce((a, b) => a + b.cost, 0) ?? 0;
      const maintCost = maintenances?.filter(m => m.vehicleId === v.id).reduce((a, b) => a + b.cost, 0) ?? 0;
      const expCost = expenses?.filter(e => e.vehicleId === v.id).reduce((a, b) => a + b.amount, 0) ?? 0;
      return {
        id: v.id,
        name: v.name,
        registrationNumber: v.registrationNumber,
        totalCost: fuelCost + maintCost + expCost,
      };
    });

    // Sort descending
    vCosts.sort((a, b) => b.totalCost - a.totalCost);
    return vCosts.slice(0, 3);
  }, [vehicles, fuelLogs, maintenances, expenses]);

  const recentTrips = useMemo(() => (trips ?? []).slice(0, 5), [trips]);
  const availV =
    vehicles?.filter((v) => v.status === VehicleStatus.AVAILABLE) ?? [];

  const costBarData = useMemo(
    () => [
      { name: "Fuel", cost: totalFuel },
      { name: "Maintenance", cost: totalMaint },
      {
        name: "Expenses",
        cost: expenses?.reduce((a, e) => a + e.amount, 0) ?? 0,
      },
    ],
    [totalFuel, totalMaint, expenses],
  );

  const ok = () => {
    setIsCreateOpen(false);
    rfV();
    rfD();
    rfT();
  };
  const oEd = () => {
    setEditingId(null);
    rfV();
    rfD();
  };

  const handleLogout = async () => {
    await fetch("/api/auth/session", { method: "POST" });
    router.push("/login");
  };

  // ── Nav items ───────────────────────────────────────────────────────────────
  const ALL_NAV = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
    { id: "fleet", label: "Fleet (Vehicles)", icon: TruckIcon },
    { id: "drivers", label: "Drivers", icon: UsersIcon },
    { id: "trips", label: "Trips", icon: NavigationIcon },
    { id: "maintenance", label: "Maintenance", icon: WrenchIcon },
    { id: "fuel_expenses", label: "Fuel & Expenses", icon: FuelIcon },
    { id: "analytics", label: "Analytics", icon: BarChart3Icon },
  ];
  const navItems = ALL_NAV.filter((n) => !user || allowedNav.includes(n.id));
  const userInitials =
    user?.name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "??";

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
            <span
              className="font-extrabold text-base tracking-tight text-slate-900 truncate max-w-[150px]"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
              title={boardName.replace(/^Workspace:\s*/i, "")}
            >
              {boardName.replace(/^Workspace:\s*/i, "")}
            </span>
          </div>

          {/* Menu Sections */}
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 mb-2">
                Menu
              </p>
              <nav className="space-y-0.5">
                {navItems.map(({ id, label, icon: Icon }) => {
                  const active = activeMenu === id;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setActiveMenu(id as MenuType);
                        setEditingId(null);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all text-left cursor-pointer"
                      style={{
                        background: active ? "#eef6f2" : "transparent",
                        color: active ? "#0d5c3a" : "#4b5563",
                      }}
                    >
                      <Icon
                        className="size-4 shrink-0"
                        style={{ color: active ? "#0d5c3a" : "#9ca3af" }}
                      />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 mb-2">
                General
              </p>
              <nav className="space-y-0.5">
                <button
                  onClick={() => setActiveMenu("settings")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-[#4b5563] hover:bg-slate-50 text-left cursor-pointer"
                >
                  <SettingsIcon className="size-4 text-[#9ca3af]" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-[#4b5563] hover:bg-slate-50 text-left cursor-pointer"
                >
                  <LogOutIcon className="size-4 text-[#9ca3af]" />
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          </div>
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search task"
              className="w-full pl-10 pr-12 h-9 rounded-xl bg-[#f4f6f8] text-sm text-[#111827] outline-none border-0 focus:ring-1 focus:ring-[#0d5c3a] transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 border border-slate-200 bg-white px-1.5 py-0.5 rounded">
              ⌘ F
            </span>
          </div>

          {/* Controls right */}
          <div className="flex items-center gap-4">
            {/* Mail/Messages Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowMailDropdown(!showMailDropdown);
                  setShowNotificationDropdown(false);
                }}
                className="p-2 rounded-full hover:bg-slate-50 text-[#4b5563] relative cursor-pointer mail-trigger"
              >
                <MailIcon className="size-4" />
                {messages.length > 0 && (
                  <div className="absolute top-1 right-1 px-1.5 py-0.5 min-w-4 text-[8px] font-black leading-none text-white bg-red-500 rounded-full flex items-center justify-center">
                    {messages.length}
                  </div>
                )}
              </button>

              {showMailDropdown && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200/80 shadow-xl rounded-2xl p-4 z-50 animate-fadeup space-y-3 mail-dropdown">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Inbox Messages
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {messages.length} pending
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2.5">
                    {messages.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-4">
                        No pending join requests.
                      </p>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 transition-all border border-slate-100/50"
                        >
                          <div className="flex justify-between items-start">
                            <h5 className="text-[11px] font-bold text-[#0d5c3a]">
                              {msg.title}
                            </h5>
                            <span className="text-[9px] text-slate-400 font-bold">
                              {formatTimeAgo(msg.time)}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600 mt-1">
                            {msg.subtitle}
                          </p>
                          <button
                            onClick={() => {
                              setActiveMenu("settings");
                              setShowMailDropdown(false);
                            }}
                            className="mt-2 text-[9px] font-black text-[#0d5c3a] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                          >
                            Go to Team Management →
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotificationDropdown(!showNotificationDropdown);
                  setShowMailDropdown(false);
                }}
                className="p-2 rounded-full hover:bg-slate-50 text-[#4b5563] relative cursor-pointer notification-trigger"
              >
                <BellIcon className="size-4" />
                {notifications.filter((n) => !n.read).length > 0 && (
                  <div className="absolute top-1 right-1 px-1.5 py-0.5 min-w-4 text-[8px] font-black leading-none text-white bg-red-500 rounded-full flex items-center justify-center">
                    {notifications.filter((n) => !n.read).length}
                  </div>
                )}
              </button>

              {showNotificationDropdown && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200/80 shadow-xl rounded-2xl p-4 z-50 animate-fadeup space-y-3 notification-dropdown">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Notifications
                    </span>
                    <button
                      onClick={() => {
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, read: true })),
                        );
                      }}
                      className="text-[10px] font-bold text-[#0d5c3a] hover:underline cursor-pointer border-0 bg-transparent"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-4">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setNotifications((prev) =>
                              prev.map((item) =>
                                item.id === n.id
                                  ? { ...item, read: true }
                                  : item,
                              ),
                            );
                          }}
                          className={`p-2.5 rounded-xl transition-all border flex gap-2.5 items-start cursor-pointer ${
                            n.read
                              ? "bg-white border-slate-100 hover:bg-slate-50/50"
                              : "bg-emerald-50/40 border-emerald-100/50 hover:bg-emerald-50/80"
                          }`}
                        >
                          <div
                            className={`size-1.5 rounded-full mt-1.5 shrink-0 ${n.read ? "bg-slate-300" : "bg-emerald-600"}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-slate-700 leading-normal font-medium">
                              {n.text}
                            </p>
                            <span className="text-[9px] text-slate-400 mt-1 block font-bold">
                              {formatTimeAgo(n.time)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 text-center">
                      <button
                        onClick={() => setNotifications([])}
                        className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer border-0 bg-transparent"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile widget */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="size-9 rounded-full bg-[#e8f5e9] text-[#0d5c3a] flex items-center justify-center font-bold text-[12px] border border-emerald-100">
                {userInitials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[12px] font-bold text-slate-900 leading-none">
                  {user?.name ?? "Totok Michael"}
                </p>
                <p className="text-[9px] text-slate-400 mt-1 leading-none">
                  {user?.email ?? "tmichael20@gmail.com"}
                </p>
              </div>
              {/* Exit button */}
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer border-0 bg-transparent flex items-center justify-center ml-1"
              >
                <LogOutIcon className="size-4" />
              </button>
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
                  <h1
                    className="text-3xl font-extrabold text-slate-900 tracking-tight"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    Dashboard
                  </h1>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    Plan, prioritize, and accomplish your tasks with ease.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {canWrite("trip") && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                      <DialogTrigger
                        render={
                          <button className="px-4 h-9 rounded-xl bg-[#0d5c3a] hover:bg-[#064e3b] text-white text-xs font-bold border-0 hover-lift flex items-center gap-1.5 cursor-pointer shadow-sm">
                            <PlusIcon className="size-4" /> Schedule Trip
                          </button>
                        }
                      />
                      <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 text-slate-900">
                        <TripForm onSuccess={ok} />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {/* ── 7 KPI CARDS ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  {
                    label: "Active Vehicles",
                    val: vS.onTrip,
                    border: "border-l-4 border-l-blue-500",
                  },
                  {
                    label: "Available Vehicles",
                    val: vS.available,
                    border: "border-l-4 border-l-emerald-500",
                  },
                  {
                    label: "In Maintenance",
                    val: String(vS.inShop).padStart(2, "0"),
                    border: "border-l-4 border-l-amber-500",
                  },
                  {
                    label: "Active Trips",
                    val: tS.active,
                    border: "border-l-4 border-l-blue-500",
                  },
                  {
                    label: "Pending Trips",
                    val: String(tS.pending).padStart(2, "0"),
                    border: "border-l-4 border-l-blue-500",
                  },
                  {
                    label: "Drivers on Duty",
                    val: dS.onTrip,
                    border: "border-l-4 border-l-blue-500",
                  },
                  {
                    label: "Fleet Utilization",
                    val: `${fleetUtil}%`,
                    border: "border-l-4 border-l-emerald-500",
                  },
                ].map(({ label, val, border }) => (
                  <div
                    key={label}
                    className={`bg-white p-4 rounded-xl border border-slate-200/70 shadow-sm flex flex-col justify-between h-20 ${border}`}
                  >
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-tight">
                      {label}
                    </p>
                    <h3
                      className="text-xl font-bold text-slate-900 leading-none mt-1"
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      {val}
                    </h3>
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
                          {["Trip", "Vehicle", "Driver", "Status", "ETA"].map(
                            (h, i) => (
                              <TableHead
                                key={h}
                                className={`${thCl} ${i === 0 ? "pl-2" : ""}`}
                              >
                                {h}
                              </TableHead>
                            ),
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentTrips.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="py-8 text-center text-slate-400 text-xs"
                            >
                              No dispatches found
                            </TableCell>
                          </TableRow>
                        ) : (
                          recentTrips.map((t, idx) => {
                            const etas = [
                              "45 min",
                              "—",
                              "1h 10m",
                              "Awaiting vehicle",
                              "—",
                            ];
                            return (
                              <TableRow
                                key={t.id}
                                style={{ borderBottom: "1px solid #f1f3f5" }}
                              >
                                <TableCell className="py-2.5 pl-2 font-bold text-slate-800">
                                  TR-{1001 + idx}
                                </TableCell>
                                <TableCell className="py-2.5 text-slate-500">
                                  {(t as any).vehicle?.name || "—"}
                                </TableCell>
                                <TableCell className="py-2.5 text-slate-500">
                                  {(t as any).driver?.name || "—"}
                                </TableCell>
                                <TableCell className="py-2.5">
                                  <StatusPill status={t.status} />
                                </TableCell>
                                <TableCell className="py-2.5 text-xs text-slate-500 font-semibold">
                                  {etas[idx % etas.length]}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Vehicle Status horizontal bars */}
                <div
                  className={`${cardBg} p-5 flex flex-col justify-between h-full`}
                >
                  <div>
                    <p className={lbl}>Vehicle Status</p>
                    <div className="space-y-4 mt-4">
                      <HBar
                        label="Available"
                        count={vS.available}
                        total={vS.total}
                        color="#22c55e"
                      />
                      <HBar
                        label="On Trip"
                        count={vS.onTrip}
                        total={vS.total}
                        color="#3b82f6"
                      />
                      <HBar
                        label="In Shop"
                        count={vS.inShop}
                        total={vS.total}
                        color="#f59e0b"
                      />
                      <HBar
                        label="Retired"
                        count={vS.retired}
                        total={vS.total}
                        color="#f43f5e"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 pt-3 border-t border-slate-100 mt-4">
                    Operational status tracking logs.
                  </p>
                </div>
              </div>

              {/* ── ADDITIONAL WIDGETS BELOW (Other features) ── */}
              <div className="grid grid-cols-1 lg:grid-cols-10 gap-5">
                {/* Cost bar chart */}
                <div className={`${cardBg} lg:col-span-5 p-5 space-y-4`}>
                  <p className={lbl}>Project Cost Analytics</p>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={costBarData} barSize={26}>
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: "#666" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: "#888" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          formatter={(v: any) => [
                            `₹ ${Number(v).toLocaleString()}`,
                            "Cost",
                          ]}
                          contentStyle={{
                            background: "#fff",
                            border: "1px solid #eee",
                            borderRadius: 8,
                            fontSize: 10,
                          }}
                        />
                        <Bar
                          dataKey="cost"
                          fill="#0d5c3a"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Reminders Meeting card */}
                <div
                  className={`${cardBg} lg:col-span-5 p-5 flex flex-col justify-between h-[230px]`}
                >
                  <div>
                    <p className={lbl}>Reminders</p>
                    <h4
                      className="text-sm font-bold text-[#0d5c3a] tracking-tight mt-1"
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      Log Operations Update
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Due today: log fuel logs, update active shop listings, and
                      process pending runs.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveMenu("fuel_expenses")}
                    className="w-full h-9 rounded-xl bg-[#0d5c3a] hover:bg-[#064e3b] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    Start Logging
                  </button>
                </div>
              </div>

              {/* Row 3: Team Collaboration + Gauge progress + Timer widget */}
              <div className="grid grid-cols-1 lg:grid-cols-10 gap-5">
                {/* Driver Roster (45%) */}
                <div className={`${cardBg} lg:col-span-5 p-5 space-y-3`}>
                  <div className="flex justify-between items-center">
                    <p className={lbl}>Driver Collaboration</p>
                    <button
                      onClick={() => setActiveMenu("drivers")}
                      className="text-[10px] font-bold text-[#0d5c3a] hover:underline"
                    >
                      + View Roster
                    </button>
                  </div>
                  <div className="space-y-3">
                    {drivers?.slice(0, 3).map((d, i) => (
                      <div
                        key={d.id}
                        className="flex justify-between items-center pb-2.5 border-b border-slate-100 last:border-0"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-full bg-[#f1f3f5] text-[#0d5c3a] flex items-center justify-center font-bold text-xs uppercase">
                            {d.name.substring(0, 2)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {d.name}
                            </p>
                            <p className="text-[9px] text-slate-400">
                              License: {d.licenseNumber}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${d.status === DriverStatus.AVAILABLE ? "bg-[#eef6f2] text-[#0d5c3a] border border-emerald-100/50" : "bg-amber-50/50 text-amber-700 border border-amber-100/50"}`}
                        >
                          {d.status.toLowerCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress Gauge (30%) */}
                <div
                  className={`${cardBg} lg:col-span-5 p-5 flex flex-col justify-between items-center text-center`}
                >
                  <p className={`${lbl} self-start`}>
                    Fleet Capacity Utilization
                  </p>

                  {/* Gauge Arc representation */}
                  <div className="relative size-32 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { value: fleetUtil, fill: "#0d5c3a" },
                            { value: 100 - fleetUtil, fill: "#f1f3f5" },
                          ]}
                          cx="50%"
                          cy="50%"
                          startAngle={180}
                          endAngle={0}
                          innerRadius={35}
                          outerRadius={46}
                          dataKey="value"
                        >
                          <Cell fill="#0d5c3a" />
                          <Cell fill="#f1f3f5" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute text-center mt-3">
                      <span className="text-2xl font-black text-slate-800">
                        {fleetUtil}%
                      </span>
                      <p className="text-[9px] text-slate-400">Capacity used</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-[9px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <div className="size-2 rounded-full bg-[#0d5c3a]" />{" "}
                      Active
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="size-2 rounded-full bg-slate-200" />{" "}
                      Available
                    </span>
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
                  <h1
                    className="text-2xl font-extrabold text-slate-900 tracking-tight"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    Fleet Registry
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage vehicles, load capacities, and active registries.
                  </p>
                </div>
                {canWrite("vehicle") && (
                  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger
                      render={
                        <button className="px-4 h-9 rounded-xl text-white text-xs font-bold bg-[#0d5c3a] hover:bg-[#064e3b] border-0 hover-lift cursor-pointer">
                          <span className="flex items-center gap-1.5">
                            <PlusIcon className="size-4" /> Add Vehicle
                          </span>
                        </button>
                      }
                    />
                    <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 text-slate-900">
                      <VehicleForm onSuccess={ok} />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <VehicleTable
                onEdit={
                  canWrite("vehicle") ? (id) => setEditingId(id) : undefined
                }
              />
            </div>
          )}

          {/* ════ DRIVERS ════ */}
          {activeMenu === "drivers" && (
            <div className="space-y-5 animate-fadeup">
              <div className={`${secHead} flex justify-between items-center`}>
                <div>
                  <h1
                    className="text-2xl font-extrabold text-slate-900 tracking-tight"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    Registered Drivers
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage driver license statuses and duty allocations.
                  </p>
                </div>
                {canWrite("driver") && (
                  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger
                      render={
                        <button className="px-4 h-9 rounded-xl text-white text-xs font-bold bg-[#0d5c3a] hover:bg-[#064e3b] border-0 hover-lift cursor-pointer">
                          <span className="flex items-center gap-1.5">
                            <PlusIcon className="size-4" /> Register Driver
                          </span>
                        </button>
                      }
                    />
                    <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 text-slate-900">
                      <DriverForm onSuccess={ok} />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <DriverTable
                onEdit={canWrite("driver") ? (id) => setEditingId(id) : undefined}
              />
            </div>
          )}

          {/* ════ TRIPS ════ */}
          {activeMenu === "trips" && (
            <div className="space-y-5 animate-fadeup">
              <div className={`${secHead} flex justify-between items-center`}>
                <div>
                  <h1
                    className="text-2xl font-extrabold text-slate-900 tracking-tight"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    Logistics Trips
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track, schedule, and dispatch transport runs.
                  </p>
                </div>
              </div>
              <TripTable />
            </div>
          )}

          {/* ════ MAINTENANCE ════ */}
          {activeMenu === "maintenance" && (
            <div className="space-y-5 animate-fadeup">
              <div className={secHead}>
                <h1
                  className="text-2xl font-extrabold text-slate-900 tracking-tight"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  Maintenance Management
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track repair budgets and shop schedules.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {canWrite("maintenance") && (
                  <div className="space-y-4">
                    <div className={`${cardBg} p-5`}>
                      <p className={lbl + " mb-4"}>Log Service Record</p>
                      <div className="space-y-3">
                        <div>
                          <label className={lbl}>Vehicle</label>
                          <Select
                            value={MF.vehicleId}
                            onValueChange={(v) =>
                              setMF((f) => ({ ...f, vehicleId: v ?? "" }))
                            }
                          >
                            <SelectTrigger className={`${selCl} w-full`}>
                              <SelectValue placeholder="Select vehicle…">
                                {MF.vehicleId ? (
                                  vehicles?.find(v => v.id === MF.vehicleId)
                                    ? (() => {
                                        const v = vehicles.find(v => v.id === MF.vehicleId);
                                        return `${v?.name} (${v?.registrationNumber})`;
                                      })()
                                    : MF.vehicleId
                                ) : (
                                  "Select vehicle…"
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className={selCntCl}>
                              {!vehicles || vehicles.length === 0 ? (
                                <div className="p-3 text-xs text-slate-400">
                                  No vehicles
                                </div>
                              ) : (
                                vehicles.map((v) => (
                                  <SelectItem key={v.id} value={v.id}>
                                    {v.name} ({v.registrationNumber})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className={lbl}>Service Type</label>
                          <input
                            value={MF.title}
                            onChange={(e) =>
                              setMF((f) => ({ ...f, title: e.target.value }))
                            }
                            placeholder="Oil Change, Engine Repair…"
                            className={inputCl}
                          />
                        </div>
                        <div>
                          <label className={lbl}>Cost (₹)</label>
                          <input
                            type="number"
                            value={MF.cost}
                            onChange={(e) =>
                              setMF((f) => ({ ...f, cost: e.target.value }))
                            }
                            placeholder="e.g. 2500"
                            className={inputCl}
                          />
                        </div>
                        <button
                          onClick={() =>
                            cMaint.mutate({
                              title: MF.title,
                              description: MF.description || null,
                              cost: Number(MF.cost),
                              vehicleId: MF.vehicleId,
                            })
                          }
                          disabled={cMaint.isPending}
                          className="w-full h-10 rounded-xl text-white text-xs font-bold bg-[#0d5c3a] hover:bg-[#064e3b] border-0 transition-all cursor-pointer"
                        >
                          {cMaint.isPending ? "Saving…" : "Save Record"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div
                  className={`${cardBg} ${canWrite("maintenance") ? "lg:col-span-2" : "lg:col-span-3"}`}
                >
                  <div className="px-5 pt-5 pb-2">
                    <p className={lbl}>Service Logs</p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow style={{ borderBottom: "1px solid #f1f3f5" }}>
                        {[
                          "Vehicle",
                          "Service",
                          "Cost",
                          "Status",
                          "Actions",
                        ].map((h, i) => (
                          <TableHead
                            key={h}
                            className={`${thCl} ${i === 0 ? "pl-5" : ""} ${i === 4 ? "pr-5 text-right" : ""}`}
                          >
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!maintenances || maintenances.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-10 text-center text-slate-400 text-xs"
                          >
                            No service logs
                          </TableCell>
                        </TableRow>
                      ) : (
                        maintenances.map((m) => (
                          <TableRow
                            key={m.id}
                            style={{ borderBottom: "1px solid #f1f3f5" }}
                          >
                            <TableCell className="py-3.5 pl-5 font-semibold text-slate-800">
                              {m.vehicle.name}
                            </TableCell>
                            <TableCell className="py-3.5 text-slate-500">
                              {m.title}
                            </TableCell>
                            <TableCell
                              className="py-3.5 text-slate-500"
                              style={{
                                fontFamily: "var(--font-jetbrains-mono)",
                              }}
                            >
                              ₹ {m.cost.toLocaleString()}
                            </TableCell>
                            <TableCell className="py-3.5">
                              <span
                                className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${m.status === MaintenanceStatus.ACTIVE ? "bg-amber-50 text-amber-800 border-amber-200/50" : "bg-emerald-50 text-emerald-800 border-emerald-200/50"}`}
                              >
                                {m.status === MaintenanceStatus.ACTIVE
                                  ? "In Shop"
                                  : "Completed"}
                              </span>
                            </TableCell>
                            <TableCell className="py-3.5 pr-5 text-right">
                              {m.status === MaintenanceStatus.ACTIVE &&
                              canWrite("maintenance") ? (
                                <button
                                  onClick={() => xMaint.mutate({ id: m.id })}
                                  disabled={xMaint.isPending}
                                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg text-white bg-[#10b981] hover:bg-[#059669] border-0 transition-all cursor-pointer"
                                >
                                  Complete
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400">
                                  Done
                                </span>
                              )}
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
            <div className="space-y-5 animate-fadeup">
              <div className={`${secHead} flex justify-between items-center`}>
                <div>
                  <h1
                    className="text-2xl font-extrabold text-slate-900 tracking-tight"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    Fuel & Expense Management
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track resource spend and trip logistics expenses.
                  </p>
                </div>
                <div className="flex gap-2">
                  {canWrite("fuel") && (
                    <Dialog open={isFuelOpen} onOpenChange={setIsFuelOpen}>
                      <DialogTrigger
                        render={
                          <button className="px-4 h-9 rounded-xl text-white text-xs font-bold bg-[#0d5c3a] hover:bg-[#064e3b] border-0 transition-all cursor-pointer">
                            + Log Fuel
                          </button>
                        }
                      />
                      <DialogContent className="bg-white border border-slate-200 text-slate-900">
                        <div className="space-y-4">
                          <h2 className="text-lg font-bold">Log Fuel</h2>
                          <div className="space-y-3">
                            <div>
                              <label className={lbl}>Vehicle</label>
                              <Select
                                value={FF.vehicleId}
                                onValueChange={(v) =>
                                  setFF((f) => ({ ...f, vehicleId: v ?? "" }))
                                }
                              >
                                <SelectTrigger className={`${selCl} w-full`}>
                                  <SelectValue placeholder="Select vehicle…">
                                    {FF.vehicleId ? (
                                      vehicles?.find((v) => v.id === FF.vehicleId)
                                        ? (() => {
                                            const v = vehicles.find((v) => v.id === FF.vehicleId);
                                            return `${v?.name} (${v?.registrationNumber})`;
                                          })()
                                        : FF.vehicleId
                                    ) : (
                                      "Select vehicle…"
                                    )}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className={selCntCl}>
                                  {vehicles?.map((v) => (
                                    <SelectItem key={v.id} value={v.id}>
                                      {v.name} ({v.registrationNumber})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className={lbl}>Liters</label>
                              <input
                                type="number"
                                value={FF.liters}
                                onChange={(e) =>
                                  setFF((f) => ({
                                    ...f,
                                    liters: e.target.value,
                                  }))
                                }
                                placeholder="e.g. 42"
                                className={inputCl}
                              />
                            </div>
                            <div>
                              <label className={lbl}>Cost (₹)</label>
                              <input
                                type="number"
                                value={FF.cost}
                                onChange={(e) =>
                                  setFF((f) => ({ ...f, cost: e.target.value }))
                                }
                                placeholder="e.g. 3150"
                                className={inputCl}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setIsFuelOpen(false)}
                              className="px-4 h-9 text-xs text-slate-400 hover:text-slate-600"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() =>
                                cFuel.mutate({
                                  vehicleId: FF.vehicleId,
                                  liters: Number(FF.liters),
                                  cost: Number(FF.cost),
                                  tripId: FF.tripId || null,
                                })
                              }
                              disabled={cFuel.isPending}
                              className="px-4 h-9 bg-[#0d5c3a] hover:bg-[#064e3b] rounded-xl text-xs font-bold text-white"
                            >
                              {cFuel.isPending ? "Logging…" : "Log Fuel"}
                            </button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {canWrite("expense") && (
                    <Dialog
                      open={isExpenseOpen}
                      onOpenChange={setIsExpenseOpen}
                    >
                      <DialogTrigger
                        render={
                          <button className="px-4 h-9 rounded-xl text-white text-xs font-bold bg-[#0d5c3a] hover:bg-[#064e3b] border-0 transition-all cursor-pointer">
                            + Add Expense
                          </button>
                        }
                      />
                      <DialogContent className="bg-white border border-slate-200 text-slate-900">
                        <div className="space-y-4">
                          <h2 className="text-lg font-bold">Add Expense</h2>
                          <div className="space-y-3">
                            <div>
                              <label className={lbl}>Trip</label>
                              <Select
                                value={EF.tripId}
                                onValueChange={(v) => {
                                  if (!v) return;
                                  const selectedTrip = trips?.find(t => t.id === v);
                                  setEF((f) => ({
                                    ...f,
                                    tripId: v,
                                    vehicleId: selectedTrip?.vehicleId ?? "",
                                  }));
                                }}
                              >
                                <SelectTrigger className={`${selCl} w-full`}>
                                  <SelectValue placeholder="Select active/completed trip…">
                                    {EF.tripId ? (
                                      trips?.find((t) => t.id === EF.tripId)
                                        ? (() => {
                                            const t = trips.find((t) => t.id === EF.tripId);
                                            const idx = trips.findIndex((trip) => trip.id === EF.tripId);
                                            const code = `TR${(idx + 1).toString().padStart(3, "0")}`;
                                            return `${code} · ${t?.vehicle.name} (${t?.source} ➔ ${t?.destination})`;
                                          })()
                                        : EF.tripId
                                    ) : (
                                      "Select active/completed trip…"
                                    )}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className={selCntCl}>
                                  {trips?.map((t, idx) => {
                                    const code = `TR${(idx + 1).toString().padStart(3, "0")}`;
                                    return (
                                      <SelectItem key={t.id} value={t.id}>
                                        {code} · {t.vehicle.name} ({t.source} ➔ {t.destination})
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className={lbl}>Type</label>
                              <Select
                                value={EF.type}
                                onValueChange={(v) =>
                                  setEF((f) => ({ ...f, type: v as any }))
                                }
                              >
                                <SelectTrigger className={`${selCl} w-full`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className={selCntCl}>
                                  <SelectItem value="TOLL">Toll</SelectItem>
                                  <SelectItem value="REPAIR">Repair</SelectItem>
                                  <SelectItem value="INSURANCE">
                                    Insurance
                                  </SelectItem>
                                  <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className={lbl}>Amount (₹)</label>
                              <input
                                type="number"
                                value={EF.amount}
                                onChange={(e) =>
                                  setEF((f) => ({
                                    ...f,
                                    amount: e.target.value,
                                  }))
                                }
                                placeholder="e.g. 120"
                                className={inputCl}
                              />
                            </div>
                            <div>
                              <label className={lbl}>Description</label>
                              <input
                                value={EF.description}
                                onChange={(e) =>
                                  setEF((f) => ({
                                    ...f,
                                    description: e.target.value,
                                  }))
                                }
                                placeholder="e.g. NH-44 Toll"
                                className={inputCl}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setIsExpenseOpen(false)}
                              className="px-4 h-9 text-xs text-slate-400 hover:text-slate-600"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() =>
                                cExp.mutate({
                                  vehicleId: EF.vehicleId,
                                  type: EF.type,
                                  amount: Number(EF.amount),
                                  description: EF.description || null,
                                })
                              }
                              disabled={cExp.isPending}
                              className="px-4 h-9 bg-[#0d5c3a] hover:bg-[#064e3b] rounded-xl text-xs font-bold text-white"
                            >
                              {cExp.isPending ? "Adding…" : "Add Expense"}
                            </button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {/* Fuel logs table */}
              <div className={cardBg}>
                <div className="px-5 pt-5 pb-2">
                  <p className={lbl}>Fuel Logs</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderBottom: "1px solid #f1f3f5" }}>
                      {["Vehicle", "Date", "Liters", "Fuel Cost"].map(
                        (h, i) => (
                          <TableHead
                            key={h}
                            className={`${thCl} ${i === 0 ? "pl-5" : ""} ${i === 3 ? "pr-5 text-right" : ""}`}
                          >
                            {h}
                          </TableHead>
                        ),
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!fuelLogs || fuelLogs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-10 text-center text-slate-400 text-xs"
                        >
                          No fuel logs
                        </TableCell>
                      </TableRow>
                    ) : (
                      fuelLogs.map((log) => (
                        <TableRow
                          key={log.id}
                          style={{ borderBottom: "1px solid #f1f3f5" }}
                        >
                          <TableCell className="py-3.5 pl-5 font-semibold text-slate-800">
                            {log.vehicle.name}{" "}
                            <span className="text-[10px] text-slate-400">
                              ({log.vehicle.registrationNumber})
                            </span>
                          </TableCell>
                          <TableCell className="py-3.5 text-slate-500">
                            {new Date(log.date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell
                            className="py-3.5 text-slate-500"
                            style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                          >
                            {log.liters} L
                          </TableCell>
                          <TableCell
                            className="py-3.5 pr-5 text-right font-bold text-red-600"
                            style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                          >
                            ₹ {log.cost.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Expenses table */}
              <div className={cardBg}>
                <div className="px-5 pt-5 pb-2">
                  <p className={lbl}>Other Expenses (Toll / Misc)</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderBottom: "1px solid #f1f3f5" }}>
                      {["Trip", "Vehicle", "Toll", "Other", "Maint. (Linked)", "Total / Status"].map(
                        (h, i) => (
                          <TableHead
                            key={h}
                            className={`${thCl} ${i === 0 ? "pl-5" : ""} ${i === 5 ? "pr-5 text-right" : ""}`}
                          >
                            {h}
                          </TableHead>
                        ),
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!trips || trips.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-10 text-center text-slate-400 text-xs"
                        >
                          No operational trip records
                        </TableCell>
                      </TableRow>
                    ) : (
                      trips.map((trip, idx) => {
                        const tripCode = `TR${(idx + 1).toString().padStart(3, "0")}`;
                        const tripStart = new Date(trip.createdAt);
                        const tripEnd = (trip.status === "COMPLETED" || trip.status === "CANCELLED") ? new Date(trip.updatedAt) : new Date();

                        // Get expenses logged during this trip
                        const tripExpenses = expenses?.filter(e => {
                          const eDate = new Date(e.date);
                          return e.vehicleId === trip.vehicleId && eDate >= tripStart && eDate <= tripEnd;
                        }) ?? [];

                        const tollCost = tripExpenses.filter(e => e.type === "TOLL").reduce((a, b) => a + b.amount, 0);
                        const otherCost = tripExpenses.filter(e => e.type !== "TOLL").reduce((a, b) => a + b.amount, 0);

                        // Get maintenance cost logged during this trip
                        const tripMaintenances = maintenances?.filter(m => {
                          const mDate = new Date(m.createdAt);
                          return m.vehicleId === trip.vehicleId && mDate >= tripStart && mDate <= tripEnd;
                        }) ?? [];

                        const maintCost = tripMaintenances.reduce((a, b) => a + b.cost, 0);
                        const totalRow = tollCost + otherCost + maintCost;

                        return (
                          <TableRow
                            key={trip.id}
                            style={{ borderBottom: "1px solid #f1f3f5" }}
                          >
                            <TableCell className="py-3.5 pl-5 font-semibold text-slate-800">
                              {tripCode}
                            </TableCell>
                            <TableCell className="py-3.5 font-semibold text-slate-700">
                              {trip.vehicle.name}{" "}
                              <span className="text-[10px] text-slate-400">
                                ({trip.vehicle.registrationNumber})
                              </span>
                            </TableCell>
                            <TableCell
                              className="py-3.5 text-slate-500 font-semibold"
                              style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                            >
                              ₹ {tollCost.toLocaleString()}
                            </TableCell>
                            <TableCell
                              className="py-3.5 text-slate-500 font-semibold"
                              style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                            >
                              ₹ {otherCost.toLocaleString()}
                            </TableCell>
                            <TableCell
                              className="py-3.5 text-slate-500 font-semibold"
                              style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                            >
                              ₹ {maintCost.toLocaleString()}
                            </TableCell>
                            <TableCell className="py-3.5 pr-5 text-right font-bold">
                              <div className="flex items-center justify-end gap-2">
                                <span style={{ fontFamily: "var(--font-jetbrains-mono)" }} className="text-slate-800 font-bold text-xs">
                                  ₹ {totalRow.toLocaleString()}
                                </span>
                                {(() => {
                                  switch (trip.status) {
                                    case "COMPLETED":
                                      return (
                                        <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-lg bg-[#eef6f2] text-[#0d5c3a] border border-emerald-100/50">
                                          Completed
                                        </span>
                                      );
                                    case "DISPATCHED":
                                      return (
                                        <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-lg bg-blue-50 text-blue-700 border border-blue-100/50">
                                          On Trip
                                        </span>
                                      );
                                    case "DRAFT":
                                      return (
                                        <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-lg bg-slate-50 text-slate-600 border border-slate-200/50">
                                          Available
                                        </span>
                                      );
                                    default:
                                      return (
                                        <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-lg bg-red-50 text-red-600 border border-red-100/50">
                                          Cancelled
                                        </span>
                                      );
                                  }
                                })()}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                
                {/* Thick separator and total operational cost bar */}
                <div className="border-t-4 border-slate-200/80 px-5 py-4 bg-slate-50/20 flex justify-between items-center rounded-b-2xl">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    Total Operational Cost (Auto) = Fuel + Maint
                  </span>
                  <span className="text-lg font-extrabold text-[#d97706]" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    ₹ {totalOp.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ════ ANALYTICS ════ */}
          {activeMenu === "analytics" && (
            <div className="space-y-6 animate-fadeup">
              <div className={secHead}>
                <h1
                  className="text-2xl font-extrabold text-slate-900 tracking-tight"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  Analytics
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Workspace cost aggregation and logistics charts.
                </p>
              </div>

              {/* 4 Stats Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { label: "FUEL EFFICIENCY", value: `${fuelEfficiencyVal.toFixed(1)} km/l`, color: "bg-blue-500" },
                  { label: "FLEET UTILIZATION", value: `${fleetUtil}%`, color: "bg-emerald-500" },
                  { label: "OPERATIONAL COST", value: totalOp.toLocaleString(), color: "bg-[#d97706]" },
                  { label: "VEHICLE ROI", value: `${roiVal.toFixed(1)}%`, color: "bg-emerald-500" },
                ].map((stat) => (
                  <div key={stat.label} className="relative bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm overflow-hidden pl-7">
                    {/* Left vertical color indicator */}
                    <div className={`absolute left-0 top-0 bottom-0 w-[5px] ${stat.color}`} />
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">{stat.label}</p>
                    <p className="text-xl font-bold text-slate-800 tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Formula text */}
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 -mt-2">
                ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Monthly Revenue Chart */}
                <div className={`${cardBg} p-5 space-y-4`}>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly Revenue</p>
                    <span className="text-[9px] font-bold text-[#0d5c3a] bg-[#eef6f2] px-2 py-0.5 rounded-md">
                      Revenue (₹)
                    </span>
                  </div>
                  
                  <div className="flex items-end justify-between h-48 pt-6 pb-2 px-3 bg-slate-50/40 rounded-2xl border border-slate-100/50 gap-2">
                    {(() => {
                      const maxRev = Math.max(...monthlyRevenueData.map(d => d.revenue), 1);
                      return monthlyRevenueData.map((d) => {
                        const heightPct = Math.round((d.revenue / maxRev) * 100);
                        return (
                          <div key={d.month} className="flex flex-col items-center gap-2 flex-1 group relative">
                            {/* Value tooltip on hover */}
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold py-1 px-1.5 rounded shadow-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-30">
                              ₹ {Math.round(d.revenue).toLocaleString()}
                            </div>
                            <div 
                              className="w-full bg-[#3b82f6]/80 hover:bg-[#3b82f6] rounded-t-lg transition-all duration-500 cursor-pointer min-h-[5px]" 
                              style={{ height: `${heightPct}%`, maxHeight: "100%" }}
                            />
                            <span className="text-[10px] font-bold text-slate-500">{d.month}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Top Costliest Vehicles list */}
                <div className={`${cardBg} p-5 space-y-4`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Top Costliest Vehicles</p>
                  
                  <div className="flex flex-col justify-center h-48 bg-slate-50/40 rounded-2xl border border-slate-100/50 p-4 space-y-4">
                    {(() => {
                      const maxCost = Math.max(...costliestVehicles.map(v => v.totalCost), 1);
                      const barColors = ["bg-red-400/80 hover:bg-red-400", "bg-amber-600/80 hover:bg-amber-600", "bg-blue-400/80 hover:bg-blue-400"];
                      
                      if (costliestVehicles.length === 0) {
                        return <div className="text-center text-xs text-slate-400 py-10 font-semibold">No operational vehicles to rank</div>;
                      }

                      return costliestVehicles.map((v, idx) => {
                        const widthPct = Math.round((v.totalCost / maxCost) * 100);
                        return (
                          <div key={v.id} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-600">
                              <span>{v.name.toUpperCase()}</span>
                              <span style={{ fontFamily: "var(--font-jetbrains-mono)" }} className="text-slate-500 font-bold">
                                ₹ {v.totalCost.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full h-5 bg-slate-200/50 rounded-lg overflow-hidden relative group cursor-pointer">
                              <div 
                                className={`h-full ${barColors[idx % barColors.length]} transition-all duration-700 rounded-lg`} 
                                style={{ width: `${widthPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ════ SETTINGS ════ */}
          {activeMenu === "settings" && (
            <div className="space-y-5 animate-fadeup">
              <div className={secHead}>
                <h1
                  className="text-2xl font-extrabold text-slate-900 tracking-tight"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  Settings
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {user?.role === "ADMIN"
                    ? "Manage board members, approve join requests, and control access."
                    : "Configure system thresholds and alerts."}
                </p>
              </div>
              {user?.role === "ADMIN" ? (
                <div className="space-y-6">
                  {/* Workspace Name Edit Card */}
                  <div className={`${cardBg} p-6 space-y-4`}>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "var(--font-space-grotesk)" }}>Workspace Name</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Rename this operations workspace.</p>
                    </div>
                    <div className="flex gap-3 max-w-md">
                      <input
                        value={boardName}
                        onChange={(e) => setBoardName(e.target.value.replace(/^Workspace:\s*/i, ""))}
                        placeholder="e.g. TransitOps"
                        className={`${inputCl} !h-10`}
                      />
                      <button
                        onClick={() => {
                          const cleanName = boardName.replace(/^Workspace:\s*/i, "").trim();
                          if (!cleanName) {
                            toast.error("Workspace name cannot be empty");
                            return;
                          }
                          localStorage.setItem("transitops_board_name", cleanName);
                          setBoardName(cleanName);
                          toast.success("Workspace name updated");
                        }}
                        className="px-4 h-10 bg-[#0d5c3a] hover:bg-[#064e3b] rounded-xl text-xs font-bold text-white transition-all cursor-pointer whitespace-nowrap"
                      >
                        Save Name
                      </button>
                    </div>
                  </div>
                  
                  {/* Team management */}
                  <TeamManagement />
                </div>
              ) : (
                <div className={`${cardBg} p-6`}>
                  <p className="text-xs text-slate-500">
                    System settings coming soon.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog
        open={!!editingId}
        onOpenChange={(open) => !open && setEditingId(null)}
      >
        <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 text-slate-900">
          {editingId && activeMenu === "fleet" && (
            <VehicleForm vehicleId={editingId} onSuccess={oEd} />
          )}
          {editingId && activeMenu === "drivers" && (
            <DriverForm driverId={editingId} onSuccess={oEd} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
