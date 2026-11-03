import { NextRequest, NextResponse } from "next/server";
import { extractAuthUser, getStudentByUserId, updateStudentProfile } from "@/lib/server-db";

export async function GET(request: NextRequest) {
  const auth = extractAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const student = getStudentByUserId(auth.userId);
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  return NextResponse.json(student);
}

export async function PUT(request: NextRequest) {
  const auth = extractAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updated = updateStudentProfile(auth.userId, {
      name: typeof body.name === "string" ? body.name.trim() : undefined,
      bio: typeof body.bio === "string" ? body.bio.trim() : undefined,
      skills: Array.isArray(body.skills) ? body.skills : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
