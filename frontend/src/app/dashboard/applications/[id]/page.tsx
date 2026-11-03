// src/app/dashboard/applications/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { downloadResume } from "@/lib/resume";

interface StudentInfo {
  id: number;
  name: string;
  email: string;
  bio?: string | null;
  skills?: string[];
  resumePath?: string | null;
  resumeUrl?: string;
}

interface ApplicationItem {
  id: number;
  studentId: number;
  jobId: number;
  status: "APPLIED" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  appliedAt: string;
  student: StudentInfo;
  job: {
    id: number;
    title: string;
    location?: string | null;
    type: string;
  };
}

export default function JobApplicantsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [job, setJob] = useState<any>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string; appId?: number } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "COMPANY")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobRes, appsRes] = await Promise.all([
        api.get(`/api/jobs/${id}`),
        api.get(`/api/applications/jobs/${id}`),
      ]);
      setJob(jobRes.data);
      setApplications(appsRes.data);
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.response?.data?.error || "Failed to load job applicants.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "COMPANY" && id) {
      loadData();
    }
  }, [id, user]);

  const handleStatusChange = async (appId: number, newStatus: "ACCEPTED" | "REJECTED") => {
    const currentApp = applications.find((a) => a.id === appId);
    
    // Prevent duplicate acceptance locally before network request
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

      // Update state locally and persist
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
      );

      setFeedback({
        type: "success",
        text: data.message || `Applicant marked as ${newStatus} successfully!`,
        appId,
      });

      // Auto-hide success message after 4s
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
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1.5"></span>
            Accepted
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5"></span>
            Rejected
          </span>
        );
      case "APPLIED":
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 mr-1.5"></span>
            Applied / Pending
          </span>
        );
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "PENDING" && app.status === "APPLIED") ||
      app.status === filterStatus;

    const matchesSearch =
      searchQuery === "" ||
      app.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.student.skills &&
        app.student.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesStatus && matchesSearch;
  });

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Applicants for &quot;{job?.title || "Job"}&quot;
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Review candidate resumes, qualifications, and update their application status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-medium">
            {applications.length} Total Applicant{applications.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Global feedback message if no specific appId */}
      {feedback && !feedback.appId && (
        <div
          className={`p-4 rounded-xl mb-6 text-sm flex items-center justify-between ${
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

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or skill..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-medium text-gray-500 mr-1">Status:</span>
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
      {filteredApps.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="text-4xl mb-3">👥</div>
          <h3 className="text-lg font-bold text-gray-700 mb-1">No applicants found</h3>
          <p className="text-gray-500 text-sm">
            {applications.length === 0
              ? "No students have applied to this job yet."
              : "No candidates match the selected filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => {
            const isUpdating = updatingId === app.id;
            const isAccepted = app.status === "ACCEPTED";
            const isRejected = app.status === "REJECTED";
            const appFeedback = feedback?.appId === app.id ? feedback : null;

            return (
              <div
                key={app.id}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:border-indigo-200 transition"
              >
                {/* Applicant feedback banner */}
                {appFeedback && (
                  <div
                    className={`mb-4 p-3 rounded-lg text-sm flex items-center justify-between ${
                      appFeedback.type === "success"
                        ? "bg-green-50 border border-green-200 text-green-800"
                        : "bg-red-50 border border-red-200 text-red-800"
                    }`}
                  >
                    <span className="font-medium">{appFeedback.text}</span>
                    <button
                      onClick={() => setFeedback(null)}
                      className="text-gray-400 hover:text-gray-600 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Details */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{app.student.name}</h3>
                      {getStatusBadge(app.status)}
                      <span className="text-xs text-gray-400">
                        Applied {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <a
                        href={`mailto:${app.student.email}`}
                        className="flex items-center gap-1.5 text-indigo-600 hover:underline"
                      >
                        ✉️ {app.student.email}
                      </a>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-600">💼 {app.job.title}</span>
                    </div>

                    {app.student.bio && (
                      <p className="text-sm text-gray-600 mb-3 italic">
                        &quot;{app.student.bio}&quot;
                      </p>
                    )}

                    {/* Skills Tags */}
                    {app.student.skills && app.student.skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-xs font-medium text-gray-400 mr-1">Skills:</span>
                        {app.student.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Resume & Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                    {/* Resume Download Button */}
                    <button
                      type="button"
                      onClick={() => downloadResume(app.student.id)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 transition w-full sm:w-auto"
                    >
                      <span>📄</span> Download Resume
                    </button>

                    {/* Action Buttons: Accept / Reject */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleStatusChange(app.id, "ACCEPTED")}
                        disabled={isUpdating || isAccepted}
                        title={isAccepted ? "Already Accepted" : "Accept Applicant"}
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
                        title={isRejected ? "Already Rejected" : "Reject Applicant"}
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
  );
}
