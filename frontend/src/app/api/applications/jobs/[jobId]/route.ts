import { NextRequest, NextResponse } from "next/server";
import { extractAuthUser, getCompanyApplicants } from "@/lib/server-db";

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const auth = extractAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const jobId = parseInt(params.jobId, 10);
  if (isNaN(jobId)) {
    return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  }

  const applicants = getCompanyApplicants(auth.userId, jobId);
  return NextResponse.json(applicants);
}
