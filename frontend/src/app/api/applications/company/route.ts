import { NextRequest, NextResponse } from "next/server";
import { extractAuthUser, getCompanyApplicants } from "@/lib/server-db";

export async function GET(request: NextRequest) {
  const auth = extractAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (auth.role !== "COMPANY") {
    return NextResponse.json({ error: "Access denied. Company profile required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const jobIdParam = searchParams.get("jobId");
  const jobId = jobIdParam ? parseInt(jobIdParam, 10) : undefined;

  const applicants = getCompanyApplicants(auth.userId, isNaN(jobId as number) ? undefined : jobId);
  return NextResponse.json(applicants);
}
