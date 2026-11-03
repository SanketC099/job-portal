import { NextRequest, NextResponse } from "next/server";
import { generateResumeDocument, getStudentById } from "@/lib/server-db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const studentId = parseInt(params.id, 10);
  if (isNaN(studentId)) {
    return NextResponse.json({ error: "Invalid student ID." }, { status: 400 });
  }

  const student = getStudentById(studentId);
  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const { filename, content } = generateResumeDocument(studentId);

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
