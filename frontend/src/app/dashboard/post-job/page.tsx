// src/app/dashboard/post-job/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

export default function PostJobPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState({ title: "", description: "", location: "", type: "INTERNSHIP" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.title || !form.description) {
      setError("Title and description are required.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/companies/jobs", form);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to post job.");
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "COMPANY") {
    return <p className="text-center py-20 text-gray-500">Only company accounts can post jobs.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Post a New Job</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
          <input type="text" value={form.title} onChange={(e) => update("title", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Frontend Developer Intern" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-y" placeholder="Describe the role, requirements, and benefits..." />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input type="text" value={form.location} onChange={(e) => update("location", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Remote, New York" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
            <select value={form.type} onChange={(e) => update("type", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="INTERNSHIP">Internship</option>
              <option value="FULL_TIME">Full-Time</option>
              <option value="PART_TIME">Part-Time</option>
              <option value="CONTRACT">Contract</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
          {loading ? "Posting..." : "Post Job"}
        </button>
      </form>
    </div>
  );
}
