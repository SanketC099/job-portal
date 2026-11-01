// src/app/admin/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      api.get("/api/admin/stats").then((r) => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || loading || !user) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <div className="text-3xl mb-1">👤</div>
          <div className="text-3xl font-bold text-gray-800">{stats?.totalStudents ?? "–"}</div>
          <div className="text-sm text-gray-500">Students</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <div className="text-3xl mb-1">🏢</div>
          <div className="text-3xl font-bold text-gray-800">{stats?.totalCompanies ?? "–"}</div>
          <div className="text-sm text-gray-500">Companies</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <div className="text-3xl mb-1">💼</div>
          <div className="text-3xl font-bold text-gray-800">{stats?.totalJobs ?? "–"}</div>
          <div className="text-sm text-gray-500">Jobs</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <div className="text-3xl mb-1">📄</div>
          <div className="text-3xl font-bold text-gray-800">{stats?.totalApplications ?? "–"}</div>
          <div className="text-sm text-gray-500">Applications</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Platform Overview</h2>
        <p className="text-gray-500 text-sm">
          Use the admin API endpoints to manage users and job listings.
          Full admin UI with tables and moderation tools coming soon.
        </p>
      </div>
    </div>
  );
}
