// src/app/jobs/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

interface JobDetail {
  id: number;
  title: string;
  description: string;
  location: string | null;
  type: string;
  postedAt: string;
  company: { id: number; name: string; description: string | null; website: string | null };
}

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    api.get(`/api/jobs/${id}`).then(({ data }) => setJob(data)).catch(() => setJob(null)).finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    if (!user) { router.push("/login"); return; }
    setApplying(true);
    setMessage(null);
    try {
      await api.post(`/api/applications/jobs/${id}/apply`);
      setMessage({ type: "success", text: "🎉 Application submitted successfully! You can track its live status in your Dashboard." });
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to apply.";
      setMessage({ type: "error", text: msg });
    } finally {
      setApplying(false);
    }
  };

  const typeLabel = (t: string) =>
    ({ FULL_TIME: "Full-Time", PART_TIME: "Part-Time", INTERNSHIP: "Internship", CONTRACT: "Contract" }[t] || t);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
    </div>
  );

  if (!job) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">🔍</div>
      <h3 className="text-xl font-semibold text-gray-700">Job not found</h3>
      <a href="/jobs" className="text-indigo-600 hover:underline mt-2 inline-block">← Back to Jobs</a>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-8">
      <a href="/jobs" className="text-sm text-indigo-600 hover:underline mb-4 inline-block">← Back to Jobs</a>

      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-gray-500 mt-1">{job.company.name}</p>
          </div>
          <span className="inline-block px-4 py-1.5 text-sm font-semibold rounded-full bg-indigo-100 text-indigo-700">
            {typeLabel(job.type)}
          </span>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
          {job.location && <span>📍 {job.location}</span>}
          <span>🗓 Posted {new Date(job.postedAt).toLocaleDateString()}</span>
          {job.company.website && (
            <a href={job.company.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
              🌐 {job.company.website}
            </a>
          )}
        </div>

        <div className="prose prose-gray max-w-none mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Job Description</h3>
          <p className="text-gray-600 whitespace-pre-line">{job.description}</p>
        </div>

        {job.company.description && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">About {job.company.name}</h3>
            <p className="text-gray-600">{job.company.description}</p>
          </div>
        )}

        {message && (
          <div className={`p-4 rounded-lg mb-4 text-sm ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
            {message.text}
          </div>
        )}

        {user?.role === "STUDENT" && (
          <button
            onClick={handleApply}
            disabled={applying}
            className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {applying ? "Applying..." : "Apply Now"}
          </button>
        )}

        {!user && (
          <p className="text-sm text-gray-500">
            <a href="/login" className="text-indigo-600 hover:underline font-medium">Log in</a> as a student to apply.
          </p>
        )}
      </div>
    </div>
  );
}
