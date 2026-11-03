import { NextRequest, NextResponse } from "next/server";
import { extractAuthUser, getAdminStats } from "@/lib/server-db";

export async function GET(request: NextRequest) {
  const auth = extractAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const stats = getAdminStats();
  return NextResponse.json(stats);
}
