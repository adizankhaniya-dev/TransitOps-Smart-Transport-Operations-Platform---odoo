import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { compare } from "bcryptjs";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.json() as { email: string; password: string };

    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: body.email } });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Compare hashed password
    const valid = await compare(body.password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.blocked) {
      return NextResponse.json({ error: "Your access to this board has been blocked." }, { status: 403 });
    }

    // Write session
    const session = await getSession();
    session.userId    = user.id;
    session.name      = user.name;
    session.email     = user.email;
    session.role      = user.role as any;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      ok: true,
      approved: user.approved,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, boardId: user.boardId },
    });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
