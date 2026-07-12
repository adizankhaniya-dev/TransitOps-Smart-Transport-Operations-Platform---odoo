import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { hash } from "bcryptjs";
import { getSession } from "@/lib/session";
import { UserRole } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      name: string;
      email: string;
      password: string;
      role: string;
      boardMode?: "CREATE" | "JOIN";
      boardName?: string;
      boardId?: string;
    };

    if (!body.name || !body.email || !body.password || !body.role) {
      return NextResponse.json({ error: "Name, email, password, and role are required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (body.password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Validate role is one of the enum values
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(body.role as any)) {
      return NextResponse.json({ error: "Invalid user role specified" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email address is already registered" }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await hash(body.password, 10);

    let assignedBoardId = "default-board";
    let isApproved = true;

    if (body.boardMode === "CREATE") {
      // Generate a friendly uppercase board invite code: BOARD-XXXXXX
      assignedBoardId = "BOARD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      isApproved = true; // Board creator is auto-approved as Admin
    } else if (body.boardMode === "JOIN") {
      const targetId = body.boardId?.trim() || "";
      if (!targetId) {
        return NextResponse.json({ error: "Board ID is required to join" }, { status: 400 });
      }

      // Check if board exists
      const boardExists = await db.user.findFirst({
        where: { boardId: targetId }
      });
      if (!boardExists) {
        return NextResponse.json({ error: "The specified Board ID does not exist" }, { status: 404 });
      }

      assignedBoardId = targetId;
      isApproved = false; // Requires admin approval
    }

    // Create user
    const user = await db.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: (body.boardMode === "CREATE" ? "ADMIN" : body.role) as UserRole,
        boardId: assignedBoardId,
        approved: isApproved,
        blocked: false,
      },
    });

    // Write session cookie directly (auto-login on signup)
    const session = await getSession();
    session.userId    = user.id;
    session.name      = user.name;
    session.email     = user.email;
    session.role      = user.role as any;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, boardId: user.boardId, approved: user.approved },
    });
  } catch (err) {
    console.error("[auth/signup]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
