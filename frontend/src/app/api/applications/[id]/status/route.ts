import { NextRequest, NextResponse } from "next/server";
import { extractAuthUser, updateApplicationStatus } from "@/lib/server-db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = extractAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (auth.role !== "COMPANY") {
    return NextResponse.json(
      { error: "Unauthorized: Only company accounts can update applicant status." },
      { status: 403 }
    );
  }

  const appId = parseInt(params.id, 10);
  if (isNaN(appId)) {
    return NextResponse.json({ error: "Invalid application ID." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { status } = body;

    const allowed = ["APPLIED", "ACCEPTED", "REJECTED"];
    if (!status || !allowed.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status '${status}'. Must be one of: ${allowed.join(", ")}` },
        { status: 400 }
      );
    }

    const result = updateApplicationStatus(auth.userId, appId, status);
    return NextResponse.json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json({ error: error.message || "Failed to update status." }, { status: statusCode });
  }
}
