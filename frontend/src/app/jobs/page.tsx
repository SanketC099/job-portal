// src/app/jobs/page.tsx
"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Job {
  id: number;
  title: string;
  description: string;
  location: string | null;
  type: string;
  postedAt: string;
  company: { id: number; name: string };
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 10;

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.q = search;
      if (typeFilter) params.type = typeFilter;
      const { data } = await api.get("/api/jobs", { params });
      setJobs(data.jobs);
      setTotal(data.total);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const totalPages = Math.ceil(total / limit);

  const typeLabel = (t: string) =>
    ({ FULL_TIME: "Full-Time", PART_TIME: "Part-Time", INTERNSHIP: "Internship", CONTRACT: "Contract" }[t] || t);

  const typeBadgeColor = (t: string) =>
    ({
      FULL_TIME: "bg-green-100 text-green-700",
      PART_TIME: "bg-blue-100 text-blue-700",
      INTERNSHIP: "bg-purple-100 text-purple-700",
      CONTRACT: "bg-orange-100 text-orange-700",
    }[t] || "bg-gray-100 text-gray-700");

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Browse Jobs</h1>

      {/* Search & Filters */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or keyword..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">All Types</option>
          <option value="FULL_TIME">Full-Time</option>
          <option value="PART_TIME">Part-Time</option>
          <option value="INTERNSHIP">Internship</option>
          <option value="CONTRACT">Contract</option>
        </select>
        <button
          type="submit"
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Search
        </button>
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No jobs found</h3>
          <p className="text-gray-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{total} job{total !== 1 ? "s" : ""} found</p>
          <div className="space-y-4">
            {jobs.map((job) => (
              <a
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{job.title}</h3>
                    <p className="text-sm text-gray-500">{job.company.name}</p>
                  </div>
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${typeBadgeColor(job.type)}`}>
                    {typeLabel(job.type)}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mt-3 line-clamp-2">{job.description}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  {job.location && <span>📍 {job.location}</span>}
                  <span>🗓 {new Date(job.postedAt).toLocaleDateString()}</span>
                </div>
              </a>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-30 hover:bg-gray-100 transition"
              >
                ← Prev
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-30 hover:bg-gray-100 transition"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
