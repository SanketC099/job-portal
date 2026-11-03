import { NextRequest, NextResponse } from "next/server";
import { registerUser, generateToken } from "@/lib/server-db";

const allowedRoles = new Set(["STUDENT", "COMPANY"]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = typeof body.role === "string" ? body.role.toUpperCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Email, password, and role are required." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    if (password.length < 10 || password.length > 72) {
      return NextResponse.json({ error: "Password must be between 10 and 72 characters." }, { status: 400 });
    }

    if (!allowedRoles.has(role)) {
      return NextResponse.json({ error: "Role must be STUDENT or COMPANY." }, { status: 400 });
    }

    const user = await registerUser({
      email,
      password,
      role: role as "STUDENT" | "COMPANY",
      name: name || (role === "STUDENT" ? "Student" : "Company"),
    });

    const token = generateToken({ userId: user.id, role: user.role, email: user.email });
    return NextResponse.json(
      {
        token,
        userId: user.id,
        role: user.role,
        email: user.email,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "User already exists") {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Registration failed." }, { status: 500 });
  }
}
