// src/app/jobs/page.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
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

const JOB_TYPE_OPTIONS = [
  { value: "", label: "All Types", badge: "bg-gray-100 text-gray-700" },
  { value: "FULL_TIME", label: "Full-Time", badge: "bg-green-100 text-green-700" },
  { value: "PART_TIME", label: "Part-Time", badge: "bg-blue-100 text-blue-700" },
  { value: "INTERNSHIP", label: "Internship", badge: "bg-purple-100 text-purple-700" },
  { value: "CONTRACT", label: "Contract", badge: "bg-orange-100 text-orange-700" },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 10;

  // Initialize from URL search params on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlType = params.get("type");
      const urlQ = params.get("q");
      if (urlType) setTypeFilter(urlType.toUpperCase());
      if (urlQ) setSearch(urlQ);
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.q = search;
      if (typeFilter) params.type = typeFilter;
      const { data } = await api.get("/api/jobs", { params });
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
    } catch {
      setJobs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, search, limit]);

  useEffect(() => {
    fetchJobs();
  }, [page, typeFilter, fetchJobs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleClearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  const typeLabel = (t: string) =>
    ({ FULL_TIME: "Full-Time", PART_TIME: "Part-Time", INTERNSHIP: "Internship", CONTRACT: "Contract" }[t] || t);

  const typeBadgeColor = (t: string) =>
    ({
      FULL_TIME: "bg-green-100 text-green-700 border-green-200",
      PART_TIME: "bg-blue-100 text-blue-700 border-blue-200",
      INTERNSHIP: "bg-purple-100 text-purple-700 border-purple-200",
      CONTRACT: "bg-orange-100 text-orange-700 border-orange-200",
    }[t] || "bg-gray-100 text-gray-700 border-gray-200");

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Browse Opportunities</h1>
        <p className="text-gray-500 text-sm mt-1">
          Explore internships, part-time, full-time, and contract openings tailored for students and graduates.
        </p>
      </div>

      {/* Search Bar & Type Dropdown */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, skill, or keyword..."
            className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm bg-white"
          />
          <span className="absolute left-3.5 top-3 text-gray-400 text-sm">🔍</span>
        </div>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm bg-white"
        >
          {JOB_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium text-sm shadow-sm"
        >
          Search
        </button>
      </form>

      {/* Quick Filter Clickable Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <span className="text-xs font-semibold text-gray-500 mr-1">Filter by Type:</span>
        {JOB_TYPE_OPTIONS.map((opt) => {
          const isActive = typeFilter === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setTypeFilter(opt.value);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition border ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
        {(typeFilter || search) && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium ml-2 underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mb-3"></div>
          <p className="text-xs text-gray-400">Loading opportunities...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">No jobs match your criteria</h3>
          <p className="text-gray-500 text-sm mb-4">
            Try switching to &quot;All Types&quot; or clearing your search keywords.
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition"
          >
            Show All Jobs
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {total} {total === 1 ? "Job Opportunity" : "Job Opportunities"} Available
            </p>
            {typeFilter && (
              <span className="text-xs text-gray-500">
                Filtered by <span className="font-semibold text-gray-700">{typeLabel(typeFilter)}</span>
              </span>
            )}
          </div>

          <div className="space-y-4">
            {jobs.map((job) => (
              <a
                key={job.id}
                href={`/jobs/${job.id}`}
                className="group block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-indigo-300 transition duration-150"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition">
                      {job.title}
                    </h3>
                    <p className="text-sm text-gray-500">{job.company?.name || "Partner Company"}</p>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${typeBadgeColor(
                      job.type
                    )}`}
                  >
                    {typeLabel(job.type)}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mt-3 line-clamp-2 leading-relaxed">{job.description}</p>
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                  {job.location && (
                    <span className="flex items-center gap-1 font-medium text-gray-500">
                      📍 {job.location}
                    </span>
                  )}
                  <span>🗓 Posted {new Date(job.postedAt).toLocaleDateString()}</span>
                  <span className="ml-auto text-indigo-600 font-medium group-hover:underline">
                    View Details →
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-50 transition"
              >
                ← Prev
              </button>
              <span className="px-4 py-2 text-sm text-gray-600 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-50 transition"
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
