// src/components/Header.tsx
"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl font-extrabold text-indigo-600 hover:text-indigo-700 transition flex items-center gap-1.5">
            <span>🎓</span> JobPortal
          </Link>
          {user && (
            <span
              className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                user.role === "COMPANY"
                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                  : user.role === "ADMIN"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-indigo-100 text-indigo-700 border border-indigo-200"
              }`}
            >
              {user.role === "COMPANY" ? "🏢 Employer" : user.role === "ADMIN" ? "🛡️ Admin" : "🎓 Student"}
            </span>
          )}
        </div>

        <nav className="flex items-center gap-3 sm:gap-4 text-sm font-medium">
          <Link href="/jobs" className="text-gray-600 hover:text-indigo-600 transition">
            Browse Jobs
          </Link>

          {!user ? (
            <>
              <Link href="/login" className="text-gray-600 hover:text-indigo-600 transition">
                Log In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold shadow-sm"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition"
              >
                Dashboard
              </Link>

              {user.role === "COMPANY" && (
                <Link
                  href="/dashboard/post-job"
                  className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition text-xs font-semibold"
                >
                  <span>➕</span> Post Job
                </Link>
              )}

              {user.role === "ADMIN" && (
                <Link href="/admin" className="text-gray-600 hover:text-indigo-600 transition">
                  Admin
                </Link>
              )}

              <button
                onClick={logout}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition text-xs sm:text-sm font-medium"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
