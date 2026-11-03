import { NextRequest, NextResponse } from "next/server";
import { extractAuthUser, createCompanyJob } from "@/lib/server-db";

export async function POST(request: NextRequest) {
  const auth = extractAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (auth.role !== "COMPANY") {
    return NextResponse.json({ error: "Only companies can post jobs." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, description, location, type } = body;

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
    }

    const job = createCompanyJob(auth.userId, { title, description, location, type });
    if (!job) {
      return NextResponse.json({ error: "Company profile not found" }, { status: 404 });
    }

    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create job" }, { status: 500 });
  }
}
