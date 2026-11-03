// src/app/dashboard/page.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { downloadResume } from "@/lib/resume";

// ============================================================================
// STUDENT DASHBOARD
// ============================================================================
function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchStudentData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [profileRes, appsRes] = await Promise.all([
        api.get("/api/students/me"),
        api.get("/api/applications/me"),
      ]);
      setProfile(profileRes.data);
      setApps(appsRes.data);
      setLastRefreshed(new Date());
    } catch {
      // silently handle poll error
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentData();

    // Auto-refresh poll every 6 seconds so student sees status changes in real-time
    const interval = setInterval(() => {
      fetchStudentData();
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchStudentData]);

  if (loading) return <Spinner />;

  // Display Applied/Pending in yellow, Accepted in green, and Rejected in red
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
            Accepted
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
            Rejected
          </span>
        );
      case "APPLIED":
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></span>
            Applied / Pending
          </span>
        );
    }
  };

  // Dynamic counts loaded directly from database records
  const totalApplications = apps.length;
  const acceptedCount = apps.filter((a) => a.status === "ACCEPTED").length;
  const pendingCount = apps.filter((a) => a.status === "APPLIED" || a.status === "PENDING").length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile?.name || "Student"} 👋
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track your job applications and employer status updates in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          <button
            onClick={() => fetchStudentData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 transition disabled:opacity-50"
          >
            <span className={refreshing ? "animate-spin" : ""}>🔄</span>
            {refreshing ? "Refreshing..." : "Refresh Status"}
          </button>
        </div>
      </div>

      {/* Database Stat Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
          <div className="text-3xl mb-2">📄</div>
          <div className="text-3xl font-extrabold text-gray-900">{totalApplications}</div>
          <div className="text-xs uppercase tracking-wider font-semibold text-gray-500 mt-1">
            Total Applications
          </div>
        </div>

        <div className="bg-white border border-green-200 rounded-xl p-6 text-center shadow-sm bg-gradient-to-b from-green-50/40 to-white">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-3xl font-extrabold text-green-700">{acceptedCount}</div>
          <div className="text-xs uppercase tracking-wider font-semibold text-green-700 mt-1">
            Accepted
          </div>
        </div>

        <div className="bg-white border border-yellow-200 rounded-xl p-6 text-center shadow-sm bg-gradient-to-b from-yellow-50/40 to-white">
          <div className="text-3xl mb-2">⏳</div>
          <div className="text-3xl font-extrabold text-yellow-700">{pendingCount}</div>
          <div className="text-xs uppercase tracking-wider font-semibold text-yellow-700 mt-1">
            Applied / Pending
          </div>
        </div>
      </div>

      {/* Student Profile & Resume Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>👤</span> Candidate Profile &amp; Resume
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {profile?.bio || "Computer Science student ready for new internship challenges."}
            </p>
            {profile?.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <span className="text-xs font-semibold text-gray-400 mr-1">Skills:</span>
                {profile.skills.map((s: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
          {profile?.id && (
            <button
              type="button"
              onClick={() => downloadResume(profile.id)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold transition"
            >
              <span>📄</span> Download My Resume
            </button>
          )}
        </div>
      </div>

      {/* Applications List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">My Applications</h3>
          <span className="text-xs text-gray-400 font-medium">Auto-syncing with employer decisions</span>
        </div>

        {apps.length === 0 ? (
          <EmptyState
            message="You haven't applied to any jobs yet."
            action={{ label: "Browse Available Jobs", href: "/jobs" }}
          />
        ) : (
          <div className="space-y-3">
            {apps.map((app) => (
              <div
                key={app.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-indigo-200 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <a
                    href={`/jobs/${app.job.id}`}
                    className="font-bold text-lg text-gray-900 hover:text-indigo-600 transition"
                  >
                    {app.job.title}
                  </a>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {app.job.company?.name} · {app.job.location || "Remote"} · {app.job.type?.replace("_", "-")}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Submitted on {new Date(app.appliedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(app.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPANY DASHBOARD (APPLICANTS MANAGEMENT)
// ============================================================================
function CompanyDashboard() {
  const [company, setCompany] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"APPLICANTS" | "JOBS">("APPLICANTS");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string; appId?: number } | null>(null);
  const [filterJobId, setFilterJobId] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadCompanyData = useCallback(async () => {
    try {
      const [compRes, appsRes] = await Promise.all([
        api.get("/api/companies/me"),
        api.get("/api/applications/company"),
      ]);
      setCompany(compRes.data);
      setApplicants(appsRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanyData();
  }, [loadCompanyData]);

  // Handle Accept or Reject
  const handleStatusChange = async (appId: number, newStatus: "ACCEPTED" | "REJECTED") => {
    const currentApp = applicants.find((a) => a.id === appId);

    // Prevent duplicate acceptance locally before network call
    if (newStatus === "ACCEPTED" && currentApp?.status === "ACCEPTED") {
      setFeedback({
        type: "error",
        text: "Duplicate acceptance prevented: This applicant has already been accepted.",
        appId,
      });
      return;
    }

    setUpdatingId(appId);
    setFeedback(null);

    try {
      const { data } = await api.patch(`/api/applications/${appId}/status`, {
        status: newStatus,
      });

      // Update local state immediately so Accepted increases by 1 & Pending decreases by 1
      setApplicants((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
      );

      setFeedback({
        type: "success",
        text: data.message || `Applicant marked as ${newStatus} successfully!`,
        appId,
      });

      // Auto-dismiss success after 4s
      setTimeout(() => {
        setFeedback((f) => (f?.appId === appId ? null : f));
      }, 4000);
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.response?.data?.error || `Failed to update status to ${newStatus}.`,
        appId,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1.5"></span>
            Accepted
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5"></span>
            Rejected
          </span>
        );
      case "APPLIED":
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 mr-1.5"></span>
            Applied / Pending
          </span>
        );
    }
  };

  if (loading) return <Spinner />;

  // Filter applicants by Job, Status, and Search Query
  const filteredApplicants = applicants.filter((app) => {
    const matchesJob = filterJobId === "ALL" || app.jobId === Number(filterJobId);
    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "PENDING" && (app.status === "APPLIED" || app.status === "PENDING")) ||
      app.status === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      app.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.student.skills &&
        app.student.skills.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesJob && matchesStatus && matchesSearch;
  });

  const totalCompanyJobs = company?.jobs?.length || 0;
  const totalApplicantsCount = applicants.length;
  const acceptedApplicantsCount = applicants.filter((a) => a.status === "ACCEPTED").length;
  const pendingApplicantsCount = applicants.filter((a) => a.status === "APPLIED" || a.status === "PENDING").length;

  return (
    <div className="space-y-8">
      {/* Company Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {company?.name || "Company"} Dashboard 🏢
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your hiring pipeline, review candidate resumes, and accept or reject applicants.
          </p>
        </div>
        <a
          href="/dashboard/post-job"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm transition"
        >
          <span>➕</span> Post a New Job
        </a>
      </div>

      {/* Metrics Row (Loaded from Database) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Applicants" value={totalApplicantsCount} icon="👥" />
        <StatCard label="Accepted" value={acceptedApplicantsCount} icon="✅" color="green" />
        <StatCard label="Pending Review" value={pendingApplicantsCount} icon="⏳" color="yellow" />
        <StatCard label="Active Listings" value={totalCompanyJobs} icon="📋" />
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("APPLICANTS")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition flex items-center gap-2 ${
              activeTab === "APPLICANTS"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>👥</span> Applicants
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === "APPLICANTS" ? "bg-indigo-700 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              {applicants.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("JOBS")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition flex items-center gap-2 ${
              activeTab === "JOBS"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>💼</span> Job Listings
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === "JOBS" ? "bg-indigo-700 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              {totalCompanyJobs}
            </span>
          </button>
        </div>

        {activeTab === "APPLICANTS" && company?.jobs?.length > 1 && (
          <select
            value={filterJobId}
            onChange={(e) => setFilterJobId(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 outline-none"
          >
            <option value="ALL">All Jobs ({applicants.length})</option>
            {company.jobs.map((j: any) => {
              const count = applicants.filter((a) => a.jobId === j.id).length;
              return (
                <option key={j.id} value={j.id}>
                  {j.title} ({count})
                </option>
              );
            })}
          </select>
        )}
      </div>

      {/* ================================================================== */}
      {/* SECTION 1: APPLICANTS MANAGEMENT */}
      {/* ================================================================== */}
      {activeTab === "APPLICANTS" && (
        <div className="space-y-4">
          {/* Global feedback message if no specific appId */}
          {feedback && !feedback.appId && (
            <div
              className={`p-4 rounded-xl text-sm flex items-center justify-between ${
                feedback.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              <span>{feedback.text}</span>
              <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
          )}

          {/* Search & Status Filter Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate name, email, or skill..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-semibold text-gray-400 mr-1">Status:</span>
              {[
                { label: "All", value: "ALL" },
                { label: "Pending", value: "PENDING" },
                { label: "Accepted", value: "ACCEPTED" },
                { label: "Rejected", value: "REJECTED" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilterStatus(tab.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    filterStatus === tab.value
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Applicants List */}
          {filteredApplicants.length === 0 ? (
            <EmptyState
              message={
                applicants.length === 0
                  ? "No applicants found for your job postings yet."
                  : "No applicants match the current search or status filter."
              }
              action={{ label: "View Available Jobs", href: "/jobs" }}
            />
          ) : (
            <div className="space-y-4">
              {filteredApplicants.map((app) => {
                const isUpdating = updatingId === app.id;
                const isAccepted = app.status === "ACCEPTED";
                const isRejected = app.status === "REJECTED";
                const appFeedback = feedback?.appId === app.id ? feedback : null;

                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:border-indigo-200 transition"
                  >
                    {/* Inline feedback message */}
                    {appFeedback && (
                      <div
                        className={`mb-4 p-3 rounded-lg text-sm flex items-center justify-between ${
                          appFeedback.type === "success"
                            ? "bg-green-50 border border-green-200 text-green-800"
                            : "bg-red-50 border border-red-200 text-red-800"
                        }`}
                      >
                        <span className="font-semibold">{appFeedback.text}</span>
                        <button
                          onClick={() => setFeedback(null)}
                          className="text-gray-400 hover:text-gray-600 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      {/* Left: Candidate Details */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-1.5">
                          <h4 className="text-xl font-bold text-gray-900">{app.student.name}</h4>
                          {getStatusBadge(app.status)}
                          <span className="text-xs text-gray-400">
                            Applied {new Date(app.appliedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                          <a
                            href={`mailto:${app.student.email}`}
                            className="flex items-center gap-1 text-indigo-600 hover:underline font-medium"
                          >
                            ✉️ {app.student.email}
                          </a>
                          <span className="text-gray-300">|</span>
                          <span className="font-semibold text-gray-800">
                            💼 Position: {app.job.title}
                          </span>
                        </div>

                        {app.student.bio && (
                          <p className="text-sm text-gray-600 mb-3 italic">
                            &quot;{app.student.bio}&quot;
                          </p>
                        )}

                        {/* Skills Badges */}
                        {app.student.skills && app.student.skills.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-xs font-semibold text-gray-400 mr-1">Skills:</span>
                            {app.student.skills.map((skill: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-md text-xs font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Resume Download & Accept/Reject Actions */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                        {/* Resume Download */}
                        <button
                          type="button"
                          onClick={() => downloadResume(app.student.id)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 transition w-full sm:w-auto shadow-sm"
                        >
                          <span>📄</span> Download Resume
                        </button>

                        {/* Accept & Reject Buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleStatusChange(app.id, "ACCEPTED")}
                            disabled={isUpdating || isAccepted}
                            title={isAccepted ? "Candidate is already accepted" : "Accept Candidate"}
                            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm ${
                              isAccepted
                                ? "bg-green-100 text-green-700 cursor-not-allowed border border-green-300"
                                : "bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                            }`}
                          >
                            {isUpdating ? (
                              <span className="animate-spin text-xs">⏳</span>
                            ) : isAccepted ? (
                              <>✓ Accepted</>
                            ) : (
                              <>✓ Accept</>
                            )}
                          </button>

                          <button
                            onClick={() => handleStatusChange(app.id, "REJECTED")}
                            disabled={isUpdating || isRejected}
                            title={isRejected ? "Candidate is already rejected" : "Reject Candidate"}
                            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition ${
                              isRejected
                                ? "bg-red-100 text-red-700 cursor-not-allowed border border-red-300"
                                : "bg-white hover:bg-red-50 text-red-600 border border-red-300 disabled:opacity-50"
                            }`}
                          >
                            {isUpdating ? (
                              <span className="animate-spin text-xs">⏳</span>
                            ) : isRejected ? (
                              <>✕ Rejected</>
                            ) : (
                              <>✕ Reject</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* SECTION 2: JOB LISTINGS */}
      {/* ================================================================== */}
      {activeTab === "JOBS" && (
        <div className="space-y-4">
          {!company?.jobs?.length ? (
            <EmptyState
              message="You haven't posted any jobs yet."
              action={{ label: "Post a Job", href: "/dashboard/post-job" }}
            />
          ) : (
            company.jobs.map((job: any) => {
              const jobApps = applicants.filter((a) => a.jobId === job.id);
              const accepted = jobApps.filter((a) => a.status === "ACCEPTED").length;
              return (
                <div
                  key={job.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">{job.title}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {job.location || "Remote"} · {job.type?.replace("_", "-")}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                        {jobApps.length} Applicant{jobApps.length !== 1 ? "s" : ""}
                      </span>
                      {accepted > 0 && (
                        <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                          {accepted} Accepted
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/dashboard/applications/${job.id}`}
                      className="px-4 py-2 text-sm font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition"
                    >
                      View Applicants ({jobApps.length}) →
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SHARED UI COMPONENTS
// ============================================================================
function Spinner() {
  return (
    <div className="flex justify-center items-center py-24">
      <div className="animate-spin w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color?: "green" | "yellow";
}) {
  const bgClass =
    color === "green"
      ? "border-green-200 bg-gradient-to-b from-green-50/40 to-white"
      : color === "yellow"
      ? "border-yellow-200 bg-gradient-to-b from-yellow-50/40 to-white"
      : "border-gray-200 bg-white";

  const textClass =
    color === "green"
      ? "text-green-700"
      : color === "yellow"
      ? "text-yellow-700"
      : "text-gray-900";

  return (
    <div className={`border rounded-xl p-6 text-center shadow-sm ${bgClass}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className={`text-3xl font-extrabold ${textClass}`}>{value}</div>
      <div className="text-xs uppercase tracking-wider font-semibold text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
      <div className="text-4xl mb-3">📭</div>
      <p className="text-gray-500 text-sm mb-4">{message}</p>
      {action && (
        <a
          href={action.href}
          className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-semibold shadow-sm"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}

// ============================================================================
// MAIN DASHBOARD ENTRY
// ============================================================================
export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return <Spinner />;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {user.role === "STUDENT" && <StudentDashboard />}
      {user.role === "COMPANY" && <CompanyDashboard />}
      {user.role === "ADMIN" && (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
          <div className="text-4xl mb-3">🛡️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
          <p className="text-gray-500 text-sm mb-6">
            Access system statistics, monitor user accounts, and review active listings.
          </p>
          <a
            href="/admin"
            className="inline-block px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition text-sm shadow-sm"
          >
            Go to Admin Control Panel
          </a>
        </div>
      )}
    </div>
  );
}
