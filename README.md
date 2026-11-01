# Student Job and Internship Portal

A polished, full-stack web application connecting students with employers for internships, part-time, and full-time job opportunities.

---

## 🌟 Unified Single Link
👉 **[http://localhost:3000](http://localhost:3000)**

Both the frontend web app and all backend `/api/*` endpoints are merged and served under **`http://localhost:3000`**.

---

## 🔑 Demo Accounts

*(Password for all demo accounts: `password123`)*

| Role | Email | Password | What You Can Explore |
|---|---|---|---|
| **Student** | `alex@student.edu` | `password123` | View application status (*Accepted in green*), download resume, track dynamic counters |
| **Student** | `sanketchaudhari1234@gmail.com` | `password123` | Active applications (*Pending in yellow*), explore skills and resume download |
| **Company** | `hr@techcorp.com` | `password123` | Dedicated **Applicants** section with Candidate Name, Email, Skills, Resume Download, Job Title, and **Accept/Reject** actions with duplicate prevention |
| **Company** | `careers@innovatestudio.io` | `password123` | Manage design job listings and applicants |
| **Admin** | `admin@portal.com` | `password123` | Platform analytics & metrics dashboard |

---

## 🎯 Application-Status Workflow Features

### 🏢 Company Applicants Management
- **Candidate Overview**: Lists each applicant's **Name**, **Email** (with mailto link), **Skills tags**, **Job Title**, and **Resume Download** button.
- **Resume Download**: One-click download button (`/api/students/:id/resume`) that serves uploaded documents or generates a structured resume document on the fly.
- **Accept & Reject Actions**:
  - **Accept**: Changes candidate status to `ACCEPTED` and updates counters.
  - **Reject**: Changes candidate status to `REJECTED`.
  - **Duplicate Prevention**: If a candidate is already accepted, repeated acceptance is blocked on both frontend and backend with a 409 Conflict alert.
  - **Ownership Security**: Authenticated API routes verify that only the employer owning the specific job listing can modify applicant statuses.
  - **Live Feedback**: Inlined loading spinners, success alerts, and error banners.

### 🎓 Student Real-Time Dashboard
- **Dynamic Counters**: Directly calculated and loaded from the database:
  - **Total Applications**
  - **Accepted**
  - **Pending / Applied**
- **Color-Coded Status Badges**:
  - 🟡 **Applied / Pending**: Yellow (`bg-yellow-100 text-yellow-800 border-yellow-300`)
  - 🟢 **Accepted**: Green (`bg-green-100 text-green-800 border-green-300`)
  - 🔴 **Rejected**: Red (`bg-red-100 text-red-800 border-red-300`)
- **Auto-Sync & Refresh**:
  - Live background polling (every 8 seconds) automatically updates student dashboards when an employer changes an application status.
  - Manual **"Refresh Status"** button for on-demand re-syncing.
- **Candidate Profile & Resume**:
  - Student skills display and personal resume download link.

---

## 🧭 Main Routes
- **Portal Home**: [http://localhost:3000](http://localhost:3000)
- **Browse Jobs**: [http://localhost:3000/jobs](http://localhost:3000/jobs)
- **Login**: [http://localhost:3000/login](http://localhost:3000/login)
- **Register**: [http://localhost:3000/register](http://localhost:3000/register)
- **Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Job Applicants View**: [http://localhost:3000/dashboard/applications/1](http://localhost:3000/dashboard/applications/1)
- **Post a Job** *(Company)*: [http://localhost:3000/dashboard/post-job](http://localhost:3000/dashboard/post-job)
- **Admin Dashboard** *(Admin)*: [http://localhost:3000/admin](http://localhost:3000/admin)
- **API Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **Resume Download API**: [http://localhost:3000/api/students/1/resume](http://localhost:3000/api/students/1/resume)
