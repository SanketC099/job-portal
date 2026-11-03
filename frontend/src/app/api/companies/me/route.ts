import { NextRequest, NextResponse } from "next/server";
import { extractAuthUser, getCompanyByUserId } from "@/lib/server-db";

export async function GET(request: NextRequest) {
  const auth = extractAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const company = getCompanyByUserId(auth.userId);
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json(company);
}
