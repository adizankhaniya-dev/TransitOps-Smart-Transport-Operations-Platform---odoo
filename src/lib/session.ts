import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId: string;
  name: string;
  email: string;
  role: "ADMIN" | "FLEET_MANAGER" | "DISPATCHER" | "SAFETY_OFFICER" | "FINANCE";
  isLoggedIn: boolean;
}

const rawSecret = process.env.NEXTAUTH_SECRET ?? "";
// iron-session requires password >= 32 chars
const sessionPassword = rawSecret.length >= 32
  ? rawSecret
  : (rawSecret + "transitops-secret-padding-key-!!").slice(0, 32);

export const sessionOptions = {
  password: sessionPassword,
  cookieName: "transitops_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  return session;
}

/** Returns session data or null if not logged in */
export async function getSessionData(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session.isLoggedIn) return null;
  return session;
}

/** Role → allowed nav sections */
export const roleAccess: Record<string, string[]> = {
  ADMIN:          ["dashboard", "fleet", "drivers", "trips", "maintenance", "fuel_expenses", "analytics", "settings"],
  FLEET_MANAGER:  ["dashboard", "fleet", "maintenance"],
  DISPATCHER:     ["dashboard", "trips"],
  SAFETY_OFFICER: ["dashboard", "drivers"],
  FINANCE:        ["dashboard", "fuel_expenses", "analytics"],
};

export const roleLabels: Record<string, string> = {
  ADMIN:          "Admin",
  FLEET_MANAGER:  "Fleet Manager",
  DISPATCHER:     "Dispatcher",
  SAFETY_OFFICER: "Safety Officer",
  FINANCE:        "Financial Analyst",
};
