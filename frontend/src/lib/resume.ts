import api from "@/lib/api";

export async function downloadResume(studentId: number) {
  try {
    const response = await api.get(`/api/students/${studentId}/resume`, { responseType: "blob" });
    const disposition = response.headers["content-disposition"] || "";
    const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `resume-${studentId}.txt`;
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch (error: any) {
    const payload = error?.response?.data;
    let message = "Resume download failed.";
    if (payload instanceof Blob) {
      try {
        const body = JSON.parse(await payload.text());
        if (body?.error) message = body.error;
      } catch {
        // Keep the generic message when the server did not return JSON.
      }
    }
    window.alert(message);
  }
}
