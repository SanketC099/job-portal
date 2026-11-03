import { NextRequest, NextResponse } from "next/server";
import { extractAuthUser, getStudentApplications } from "@/lib/server-db";

export async function GET(request: NextRequest) {
  const auth = extractAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const applications = getStudentApplications(auth.userId);
  return NextResponse.json(applications);
}
