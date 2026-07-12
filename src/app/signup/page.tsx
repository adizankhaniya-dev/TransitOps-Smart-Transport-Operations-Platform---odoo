"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EyeIcon, EyeOffIcon, AlertTriangleIcon, MailIcon, LockIcon, UserIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const ROLES = [
  { value: "FLEET_MANAGER",  label: "Fleet Manager",     access: "Fleet, Maintenance" },
  { value: "DISPATCHER",     label: "Dispatcher",         access: "Dashboard, Trips" },
  { value: "SAFETY_OFFICER", label: "Safety Officer",     access: "Drivers, Compliance" },
  { value: "FINANCE",        label: "Financial Analyst",  access: "Fuel & Expenses, Analytics" },
];

export default function SignupPage() {
  const router = useRouter();
  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [role,        setRole]        = useState("FLEET_MANAGER");
  const [showPwd,     setShowPwd]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  // Create vs Join Board Options
  const [boardMode,   setBoardMode]   = useState<"CREATE" | "JOIN">("CREATE");
  const [boardName,   setBoardName]   = useState("");
  const [boardId,     setBoardId]     = useState("");

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then((d: { isLoggedIn?: boolean; approved?: boolean; blocked?: boolean }) => {
        if (d.isLoggedIn) {
          if (d.blocked) router.replace("/blocked");
          else if (!d.approved) router.replace("/pending-approval");
          else router.replace("/dashboard");
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: boardMode === "CREATE" ? "ADMIN" : role, boardMode, boardName, boardId }),
      });

      const data = await res.json() as { ok?: boolean; error?: string; user?: { approved?: boolean } };

      if (!res.ok || !data.ok) {
        setError(data.error || "An error occurred during signup");
      } else {
        // Save board information to LocalStorage
        if (boardMode === "CREATE") {
          localStorage.setItem("transitops_board_name", boardName || "TransitOps Workspace");
          router.push("/dashboard");
        } else {
          localStorage.setItem("transitops_board_name", boardId ? `Workspace: ${boardId}` : "Joined Workspace");
          router.push("/pending-approval");
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 bg-[#f4f6f8] dark:bg-[#0b0f17] relative overflow-hidden transition-colors duration-300">
      
      <style>{`
        @keyframes flow {
          0% {
            stroke-dashoffset: 200;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        .animate-flow {
          stroke-dasharray: 40, 160;
          animation: flow 4s linear infinite;
        }
        .glow-effect {
          filter: drop-shadow(0 0 3px #0d5c3a);
        }
      `}</style>

      {/* Top bar */}
      <div className="flex justify-end w-full max-w-4xl mx-auto z-10">
        <ThemeToggle />
      </div>

      {/* Centered Signup Card */}
      <div className="flex-1 flex items-center justify-center py-8 z-10">
        <div className="relative w-full max-w-[420px]">
          
          {/* ── BACKGROUND SCHEMATIC CIRCUITS ── */}
          <div className="hidden lg:block absolute inset-0 pointer-events-none opacity-40 dark:opacity-25">
            {/* Top-Left Node */}
            <div className="absolute top-[-30px] left-[-220px] z-0 w-24 h-12 bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center shadow-sm">
              <div className="flex gap-1"><div className="size-1 bg-slate-300 dark:bg-slate-700 rounded-full" /><div className="size-1 bg-slate-300 dark:bg-slate-700 rounded-full" /></div>
            </div>
            <svg className="absolute top-[-8px] left-[-124px] w-[124px] h-[80px]" fill="none" strokeWidth="1.5">
              <path d="M 0 0 L 50 0 L 90 50 L 124 50" className="stroke-slate-200 dark:stroke-slate-800" />
              <path d="M 0 0 L 50 0 L 90 50 L 124 50" stroke="#0d5c3a" strokeWidth="2.5" strokeLinecap="round" className="animate-flow glow-effect" />
            </svg>

            {/* Top-Right Node */}
            <div className="absolute top-[-30px] right-[-220px] z-0 w-24 h-12 bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center shadow-sm">
              <div className="flex gap-1"><div className="size-1 bg-slate-300 dark:bg-slate-700 rounded-full" /><div className="size-1 bg-slate-300 dark:bg-slate-700 rounded-full" /></div>
            </div>
            <svg className="absolute top-[-8px] right-[-124px] w-[124px] h-[80px]" fill="none" strokeWidth="1.5">
              <path d="M 124 0 L 74 0 L 34 50 L 0 50" className="stroke-slate-200 dark:stroke-slate-800" />
              <path d="M 124 0 L 74 0 L 34 50 L 0 50" stroke="#0d5c3a" strokeWidth="2.5" strokeLinecap="round" className="animate-flow glow-effect" />
            </svg>

            {/* Bottom-Left Node */}
            <div className="absolute bottom-[-30px] left-[-220px] z-0 w-24 h-12 bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center shadow-sm">
              <div className="flex gap-1"><div className="size-1 bg-slate-300 dark:bg-slate-700 rounded-full" /><div className="size-1 bg-slate-300 dark:bg-slate-700 rounded-full" /></div>
            </div>
            <svg className="absolute bottom-[-8px] left-[-124px] w-[124px] h-[80px]" fill="none" strokeWidth="1.5">
              <path d="M 0 80 L 50 80 L 90 30 L 124 30" className="stroke-slate-200 dark:stroke-slate-800" />
              <path d="M 0 80 L 50 80 L 90 30 L 124 30" stroke="#0d5c3a" strokeWidth="2.5" strokeLinecap="round" className="animate-flow glow-effect" />
            </svg>

            {/* Bottom-Right Node */}
            <div className="absolute bottom-[-30px] right-[-220px] z-0 w-24 h-12 bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center shadow-sm">
              <div className="flex gap-1"><div className="size-1 bg-slate-300 dark:bg-slate-700 rounded-full" /><div className="size-1 bg-slate-300 dark:bg-slate-700 rounded-full" /></div>
            </div>
            <svg className="absolute bottom-[-8px] right-[-124px] w-[124px] h-[80px]" fill="none" strokeWidth="1.5">
              <path d="M 124 80 L 74 80 L 34 30 L 0 30" className="stroke-slate-200 dark:stroke-slate-800" />
              <path d="M 124 80 L 74 80 L 34 30 L 0 30" stroke="#0d5c3a" strokeWidth="2.5" strokeLinecap="round" className="animate-flow glow-effect" />
            </svg>
          </div>

          <div className="w-full bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800 shadow-xl rounded-3xl p-8 space-y-5 relative z-10 transition-colors duration-300">
            
            {/* Logo / Ring icon on top */}
            <div className="flex flex-col items-center space-y-4">
              <div className="size-12 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center relative bg-white dark:bg-[#161f30] shadow-sm">
                <div className="absolute inset-0.5 rounded-full border-4 border-t-[#0d5c3a] border-r-transparent border-b-[#0d5c3a] border-l-transparent animate-spin" style={{ animationDuration: '3s' }} />
                <div className="size-5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700" />
              </div>
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  Create Account
                </h1>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Already have an account?{" "}
                  <Link href="/login" className="font-bold text-[#0d5c3a] dark:text-[#10b981] hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-950/20 border border-dashed border-red-300 dark:border-red-800 text-red-700 dark:text-red-400">
                <AlertTriangleIcon className="size-4 shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Full Name" required disabled={loading}
                  className="w-full h-11 pl-11 pr-3.5 rounded-xl text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] outline-none transition-all"
                />
              </div>

              {/* Email Address */}
              <div className="relative">
                <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Email Address" required disabled={loading}
                  className="w-full h-11 pl-11 pr-3.5 rounded-xl text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] outline-none transition-all"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400/80 dark:text-slate-500" />
                <input
                  type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Password" required disabled={loading}
                  className="w-full h-11 pl-11 pr-10 rounded-xl text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors">
                  {showPwd ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>

              {/* Board Selection */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Tracking Board Mode
                </label>
                <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <button
                    type="button" onClick={() => setBoardMode("CREATE")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border-0 cursor-pointer ${
                      boardMode === "CREATE"
                        ? "bg-white dark:bg-[#161f30] text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-400 dark:text-slate-500 bg-transparent hover:text-slate-600 dark:hover:text-slate-400"
                    }`}
                  >
                    Create Board
                  </button>
                  <button
                    type="button" onClick={() => setBoardMode("JOIN")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border-0 cursor-pointer ${
                      boardMode === "JOIN"
                        ? "bg-white dark:bg-[#161f30] text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-400 dark:text-slate-500 bg-transparent hover:text-slate-600 dark:hover:text-slate-400"
                    }`}
                  >
                    Join Board
                  </button>
                </div>
              </div>

              {boardMode === "CREATE" ? (
                <div className="relative animate-fadeup">
                  <input
                    type="text" value={boardName} onChange={e => setBoardName(e.target.value)}
                    placeholder="Workspace / Board Name (e.g. Donezo Tech)" required disabled={loading}
                    className="w-full h-11 px-3.5 rounded-xl text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] outline-none transition-all"
                  />
                </div>
              ) : (
                <div className="relative animate-fadeup">
                  <input
                    type="text" value={boardId} onChange={e => setBoardId(e.target.value)}
                    placeholder="Existing Board ID / Invite Code" required disabled={loading}
                    className="w-full h-11 px-3.5 rounded-xl text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] outline-none transition-all"
                  />
                </div>
              )}

              {/* Role Selection Grid */}
              {boardMode === "JOIN" && (
                <div className="space-y-1 animate-fadeup">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Select Scope / Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map(({ value, label, access }) => {
                      const selected = role === value;
                      return (
                        <div
                          key={value}
                          onClick={() => setRole(value)}
                          className="p-3 rounded-xl cursor-pointer transition-all border text-left"
                          style={{
                            background: selected ? "#eef6f2" : "transparent",
                            borderColor: selected ? "#0d5c3a" : "rgba(120,120,120,0.15)",
                            borderWidth: selected ? "2px" : "1px",
                          }}
                        >
                          <p className="text-[11px] font-bold text-slate-900 dark:text-white">{label}</p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{access}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full h-11 rounded-xl text-white font-bold text-sm bg-[#0d5c3a] hover:bg-[#064e3b] active:scale-[0.99] transition-all border-0 flex items-center justify-center gap-2 cursor-pointer mt-2 shadow-sm">
                {loading ? "Creating Account…" : "Create Account"}
              </button>
            </form>

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-400 dark:text-slate-600 z-10">
        © 2026 TransitOps Inc. All rights reserved.
      </div>

    </div>
  );
}
