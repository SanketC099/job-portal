import { NextRequest, NextResponse } from "next/server";
import { extractAuthUser, applyToJob } from "@/lib/server-db";

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const auth = extractAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (auth.role !== "STUDENT") {
    return NextResponse.json({ error: "Only student accounts can apply for jobs." }, { status: 403 });
  }

  const jobId = parseInt(params.jobId, 10);
  if (isNaN(jobId)) {
    return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  }

  try {
    const application = applyToJob(auth.userId, jobId);
    return NextResponse.json(application, { status: 201 });
  } catch (error: any) {
    const status = error.statusCode || 400;
    return NextResponse.json({ error: error.message || "Failed to apply" }, { status });
  }
}
