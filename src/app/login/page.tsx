"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EyeIcon, EyeOffIcon, AlertTriangleIcon, MailIcon, LockIcon, KeyIcon } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function LoginPage() {
  const router = useRouter();
  const [email,         setEmail]        = useState("");
  const [password,      setPassword]     = useState("");
  const [rememberMe,    setRememberMe]   = useState(false);
  const [showPwd,       setShowPwd]      = useState(false);
  const [loading,       setLoading]      = useState(false);
  const [error,         setError]        = useState("");
  const [attempts,      setAttempts]     = useState(0);
  const [locked,        setLocked]       = useState(false);
  
  // Forgot Password modal state
  const [forgotOpen,    setForgotOpen]   = useState(false);
  const [forgotEmail,   setForgotEmail]  = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Check logged in state & remember me
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

    // Remember me check
    const saved = localStorage.getItem("transitops_remember_email");
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    setLoading(true);
    setError("");

    // Save or clear remembered email
    if (rememberMe) {
      localStorage.setItem("transitops_remember_email", email);
    } else {
      localStorage.removeItem("transitops_remember_email");
    }

    try {
      const res  = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { ok?: boolean; error?: string; approved?: boolean };
      if (!res.ok || !data.ok) {
        const n = attempts + 1;
        setAttempts(n);
        if (n >= 5) {
          setLocked(true);
          setError("Account locked after 5 failed attempts.");
        } else {
          setError(data.error || `Invalid credentials. ${5 - n} attempt${5 - n === 1 ? "" : "s"} remaining.`);
        }
      } else {
        toast.success("Successfully logged in!");
        if (data.approved === false) {
          router.push("/pending-approval");
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Real-time forgot password simulated handler
  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter a valid email address");
      return;
    }
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotOpen(false);
      toast.success(`Reset link successfully sent to ${forgotEmail}`);
      setForgotEmail("");
    }, 1200);
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



      {/* Centered Login Card */}
      <div className="flex-1 flex items-center justify-center py-12 z-10">
        <div className="relative w-full max-w-[420px]">
          
          {/* ── BACKGROUND SCHEMATIC CIRCUITS ── */}
          <div className="hidden lg:block absolute inset-0 pointer-events-none opacity-40 dark:opacity-25">
            {/* Top-Left Node */}
            <div className="absolute top-[-30px] left-[-220px] w-24 h-12 bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center shadow-sm z-0">
              <div className="flex gap-1"><div className="size-1 bg-slate-300 dark:bg-slate-700 rounded-full" /><div className="size-1 bg-slate-300 dark:bg-slate-700 rounded-full" /></div>
            </div>
            <svg className="absolute top-[-8px] left-[-124px] w-[124px] h-[80px]" fill="none" strokeWidth="1.5">
              <path d="M 0 0 L 50 0 L 90 50 L 124 50" className="stroke-slate-200 dark:stroke-slate-800" />
              <path d="M 0 0 L 50 0 L 90 50 L 124 50" stroke="#0d5c3a" strokeWidth="2.5" strokeLinecap="round" className="animate-flow glow-effect" />
            </svg>

            {/* Top-Right Node */}
            <div className="absolute top-[-30px] right-[-220px] w-24 h-12 bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center shadow-sm z-0">
              <div className="flex gap-1"><div className="size-1 bg-slate-300 dark:bg-slate-700 rounded-full" /><div className="size-1 bg-slate-300 dark:bg-slate-700 rounded-full" /></div>
            </div>
            <svg className="absolute top-[-8px] right-[-124px] w-[124px] h-[80px]" fill="none" strokeWidth="1.5">
              <path d="M 124 0 L 74 0 L 34 50 L 0 50" className="stroke-slate-200 dark:stroke-slate-800" />
              <path d="M 124 0 L 74 0 L 34 50 L 0 50" stroke="#0d5c3a" strokeWidth="2.5" strokeLinecap="round" className="animate-flow glow-effect" />
            </svg>

            {/* Bottom-Left Node */}
            <div className="absolute bottom-[-30px] left-[-220px] w-24 h-12 bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center shadow-sm z-0">
              <div className="flex gap-1"><div className="size-1 bg-slate-300 dark:bg-slate-700 rounded-full" /><div className="size-1 bg-slate-300 dark:bg-slate-700 rounded-full" /></div>
            </div>
            <svg className="absolute bottom-[-8px] left-[-124px] w-[124px] h-[80px]" fill="none" strokeWidth="1.5">
              <path d="M 0 80 L 50 80 L 90 30 L 124 30" className="stroke-slate-200 dark:stroke-slate-800" />
              <path d="M 0 80 L 50 80 L 90 30 L 124 30" stroke="#0d5c3a" strokeWidth="2.5" strokeLinecap="round" className="animate-flow glow-effect" />
            </svg>

            {/* Bottom-Right Node */}
            <div className="absolute bottom-[-30px] right-[-220px] w-24 h-12 bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center shadow-sm z-0">
              <div className="flex gap-1"><div className="size-1 bg-slate-300 dark:bg-slate-700 rounded-full" /><div className="size-1 bg-slate-300 dark:bg-slate-700 rounded-full" /></div>
            </div>
            <svg className="absolute bottom-[-8px] right-[-124px] w-[124px] h-[80px]" fill="none" strokeWidth="1.5">
              <path d="M 124 80 L 74 80 L 34 30 L 0 30" className="stroke-slate-200 dark:stroke-slate-800" />
              <path d="M 124 80 L 74 80 L 34 30 L 0 30" stroke="#0d5c3a" strokeWidth="2.5" strokeLinecap="round" className="animate-flow glow-effect" />
            </svg>
          </div>

          <div className="w-full bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800 shadow-xl rounded-3xl p-8 space-y-6 relative z-10 transition-colors duration-300">
            
            {/* Logo / Ring icon on top */}
            <div className="flex flex-col items-center space-y-4">
              <div className="size-12 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center relative bg-white dark:bg-[#161f30] shadow-sm">
                <div className="absolute inset-0.5 rounded-full border-4 border-t-[#0d5c3a] border-r-transparent border-b-[#0d5c3a] border-l-transparent animate-spin" style={{ animationDuration: '3s' }} />
                <div className="size-5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700" />
              </div>
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  Welcome Back
                </h1>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Don't have an account yet?{" "}
                  <Link href="/signup" className="font-bold text-[#0d5c3a] dark:text-[#10b981] hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl text-xs font-medium bg-red-50 dark:bg-red-950/20 border border-dashed border-red-300 dark:border-red-800 text-red-700 dark:text-red-400">
                <AlertTriangleIcon className="size-4 shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address */}
            <div className="relative">
              <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-slate-500" />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email address" required disabled={locked}
                className="w-full h-11 pl-11 pr-3.5 rounded-xl text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-slate-500" />
              <input
                type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Password" required disabled={locked}
                className="w-full h-11 pl-11 pr-10 rounded-xl text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] outline-none transition-all"
              />
              <button type="button" onClick={() => setShowPwd(s => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors">
                {showPwd ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>

            {/* Remember Me (White Box Styled) & Forgot Password Row */}
            <div className="flex items-center justify-between px-0.5">
              <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold cursor-pointer select-none">
                <input
                  type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161f30] text-[#0d5c3a] focus:ring-[#0d5c3a] size-4 accent-[#0d5c3a]"
                />
                Remember me
              </label>
              <button
                type="button" onClick={() => setForgotOpen(true)}
                className="text-xs font-bold text-[#0d5c3a] dark:text-[#10b981] hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading || locked}
              className="w-full h-11 rounded-xl text-white font-bold text-sm bg-[#0d5c3a] hover:bg-[#064e3b] active:scale-[0.99] transition-all border-0 flex items-center justify-center gap-2 cursor-pointer shadow-sm pt-0.5 z-10 relative">
              {loading ? "Logging in…" : locked ? "Account Locked" : "Login"}
            </button>
          </form>

          </div>
        </div>
      </div>

      {/* ── FORGOT PASSWORD DIALOG ── */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-3xl max-w-sm p-6 z-[100]">
          <DialogHeader className="space-y-2">
            <div className="size-10 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <KeyIcon className="size-5" />
            </div>
            <DialogTitle className="text-lg font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Forgot Password
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Enter your email address and we'll send you a recovery link instantly.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotPassword} className="space-y-4 mt-3">
            <div className="relative">
              <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-slate-500" />
              <input
                type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                placeholder="Enter your email" required
                className="w-full h-10 pl-10 pr-3.5 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 focus:border-[#0d5c3a] focus:ring-1 focus:ring-[#0d5c3a] outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button" onClick={() => setForgotOpen(false)}
                className="px-4 h-9 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit" disabled={forgotLoading}
                className="px-4 h-9 bg-[#0d5c3a] hover:bg-[#064e3b] text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center cursor-pointer"
              >
                {forgotLoading ? "Sending…" : "Send Reset Link"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-400 dark:text-slate-600 z-10">
        © 2026 TransitOps Inc. All rights reserved.
      </div>

    </div>
  );
}
