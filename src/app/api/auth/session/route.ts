import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/server/db";

export async function POST() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ isLoggedIn: false });
  }

  // Fetch the fresh user status from database
  const user = await db.user.findUnique({
    where: { id: session.userId }
  });

  // If user got deleted/removed
  if (!user) {
    session.destroy();
    return NextResponse.json({ isLoggedIn: false });
  }

  // Return live status (approved, blocked, boardId)
  return NextResponse.json({
    isLoggedIn: true,
    approved: user.approved,
    blocked: user.blocked,
    user: {
      id:      user.id,
      name:    user.name,
      email:   user.email,
      role:    user.role,
      boardId: user.boardId,
    },
  });
}
