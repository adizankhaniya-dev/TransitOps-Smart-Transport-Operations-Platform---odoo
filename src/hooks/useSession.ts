"use client";

import { useEffect, useState } from "react";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "FLEET_MANAGER" | "DISPATCHER" | "SAFETY_OFFICER" | "FINANCE";
  permission: "VIEW_ONLY" | "WRITE";
  boardId: string;
  boardName: string | null;
}

interface SessionResponse {
  isLoggedIn: boolean;
  approved?: boolean;
  blocked?: boolean;
  user?: SessionUser;
}

// Which sidebar sections each role can see
export const ROLE_NAV: Record<string, string[]> = {
  ADMIN:          ["dashboard","fleet","drivers","trips","maintenance","fuel_expenses","analytics","settings"],
  FLEET_MANAGER:  ["fleet","maintenance"],
  DISPATCHER:     ["dashboard","trips"],
  SAFETY_OFFICER: ["drivers"],
  FINANCE:        ["fuel_expenses","analytics"],
};

// What each role can do (write operations)
export const ROLE_CAN_WRITE: Record<string, string[]> = {
  ADMIN:          ["vehicle","driver","trip","maintenance","fuel","expense"],
  FLEET_MANAGER:  ["vehicle","maintenance"],
  DISPATCHER:     ["trip"],
  SAFETY_OFFICER: ["driver"],
  FINANCE:        ["fuel","expense"],
};

export function useSession() {
  const [user,     setUser]     = useState<SessionUser | null>(null);
  const [approved, setApproved] = useState<boolean>(true);
  const [blocked,  setBlocked]  = useState<boolean>(false);
  const [loading,  setLoading]  = useState(true);

  const fetchSession = () => {
    return fetch("/api/auth/session")
      .then(r => r.json())
      .then((d: SessionResponse) => {
        if (d.isLoggedIn && d.user) {
          setUser(d.user);
          setApproved(d.approved ?? true);
          setBlocked(d.blocked ?? false);
        } else {
          setUser(null);
          setApproved(true);
          setBlocked(false);
        }
        return d;
      })
      .catch(() => {
        setUser(null);
        return null;
      });
  };

  useEffect(() => {
    fetchSession().finally(() => setLoading(false));
  }, []);

  const canWrite = (resource: string) => {
    if (!user || !approved || blocked) return false;
    if (user.permission === "VIEW_ONLY") return false;
    return (ROLE_CAN_WRITE[user.role] ?? []).includes(resource);
  };

  const allowedNav = user && approved && !blocked ? (ROLE_NAV[user.role] ?? []) : [];

  return { user, loading, canWrite, allowedNav, approved, blocked, refetch: fetchSession };
}
