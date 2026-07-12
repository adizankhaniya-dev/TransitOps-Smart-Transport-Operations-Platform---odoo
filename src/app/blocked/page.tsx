"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { BanIcon, LogOutIcon } from "lucide-react";

export default function BlockedPage() {
  const router = useRouter();
  const { user, loading, blocked } = useSession();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && !blocked) {
      router.replace("/dashboard");
    }
  }, [loading, user, blocked, router]);

  const handleLogout = async () => {
    await fetch("/api/auth/session", { method: "POST" });
    router.push("/login");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8]">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8] p-6">
      <div className="max-w-md w-full bg-white border border-slate-200/80 shadow-sm rounded-2xl p-8 text-center space-y-6">
        <div className="mx-auto size-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <BanIcon className="size-8 text-red-600" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Access Blocked
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Your access to this board has been blocked by the administrator.
            Please contact your board admin if you believe this is a mistake.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all cursor-pointer"
        >
          <LogOutIcon className="size-4" /> Logout
        </button>
      </div>
    </div>
  );
}
