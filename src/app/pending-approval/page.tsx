"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { ClockIcon, LogOutIcon } from "lucide-react";

export default function PendingApprovalPage() {
  const router = useRouter();
  const { user, loading, approved, blocked, refetch } = useSession();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user) {
      if (blocked) {
        router.replace("/blocked");
      } else if (approved) {
        router.replace("/dashboard");
      }
    }
  }, [loading, user, approved, blocked, router]);

  // Poll for approval status every 5 seconds
  useEffect(() => {
    if (!user || approved) return;
    const interval = setInterval(() => refetch(), 5000);
    return () => clearInterval(interval);
  }, [user, approved, refetch]);

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
        <div className="mx-auto size-16 rounded-2xl bg-amber-50 flex items-center justify-center">
          <ClockIcon className="size-8 text-amber-600" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Awaiting Approval
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Your request to join the board has been sent to the administrator.
            You&apos;ll get access once they approve your request.
          </p>
        </div>

        <div className="bg-[#f4f6f8] rounded-xl p-4 text-left space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 font-semibold">Name</span>
            <span className="font-bold text-slate-800">{user.name}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 font-semibold">Email</span>
            <span className="font-bold text-slate-800">{user.email}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 font-semibold">Board ID</span>
            <span className="font-bold text-[#0d5c3a]" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>{user.boardId}</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          This page will automatically refresh when your request is approved.
        </p>

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
