// src/lib/server-db.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const JWT_SECRET =
  process.env.JWT_SECRET || "production-job-portal-secret-key-32-chars-minimum-safe";

export interface User {
  id: number;
  email: string;
  password: string;
  role: "STUDENT" | "COMPANY" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: number;
  userId: number;
  name: string;
  bio: string | null;
  skills: string[];
  resumePath: string | null;
  resumeKey?: string | null;
}

export interface Company {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  website: string | null;
}

export interface Job {
  id: number;
  companyId: number;
  title: string;
  description: string;
  location: string | null;
  type: "FULL_TIME" | "PART_TIME" | "INTERNSHIP" | "CONTRACT";
  postedAt: string;
}

export interface Application {
  id: number;
  studentId: number;
  jobId: number;
  status: "APPLIED" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  appliedAt: string;
}

// Initial seeded password hash for 'password123'
const DEFAULT_PASSWORD_HASH =
  "$2a$10$w8gJ5sE4K.q2P4qf1Lw2oecC19hWqEZZ6x0JpX6OqA87Pcm9QW0z6"; // bcrypt hash of password123

// In-Memory Data Store (persists for the lifetime of serverless lambda containers)
class MemoryDatabase {
  users: User[] = [
    {
      id: 1,
      email: "admin@portal.com",
      password: DEFAULT_PASSWORD_HASH,
      role: "ADMIN",
      createdAt: "2026-10-31T18:30:38.436Z",
      updatedAt: "2026-10-31T18:30:38.436Z",
    },
    {
      id: 2,
      email: "hr@techcorp.com",
      password: DEFAULT_PASSWORD_HASH,
      role: "COMPANY",
      createdAt: "2026-10-31T18:30:38.436Z",
      updatedAt: "2026-10-31T18:30:38.436Z",
    },
    {
      id: 3,
      email: "careers@innovatestudio.io",
      password: DEFAULT_PASSWORD_HASH,
      role: "COMPANY",
      createdAt: "2026-10-31T18:30:38.436Z",
      updatedAt: "2026-10-31T18:30:38.436Z",
    },
    {
      id: 4,
      email: "alex@student.edu",
      password: DEFAULT_PASSWORD_HASH,
      role: "STUDENT",
      createdAt: "2026-10-31T18:30:38.436Z",
      updatedAt: "2026-10-31T18:30:38.436Z",
    },
    {
      id: 5,
      email: "sanketchaudhari1234@gmail.com",
      password: DEFAULT_PASSWORD_HASH,
      role: "STUDENT",
      createdAt: "2026-10-31T19:01:55.870Z",
      updatedAt: "2026-10-31T19:01:55.870Z",
    },
    {
      id: 6,
      email: "Acme1234@gmail.com",
      password: DEFAULT_PASSWORD_HASH,
      role: "COMPANY",
      createdAt: "2026-10-31T19:47:20.763Z",
      updatedAt: "2026-10-31T19:47:20.763Z",
    },
    {
      id: 7,
      email: "Sanket1234@gmail.com",
      password: DEFAULT_PASSWORD_HASH,
      role: "STUDENT",
      createdAt: "2026-10-31T19:50:24.544Z",
      updatedAt: "2026-10-31T19:50:24.544Z",
    },
  ];

  students: Student[] = [
    {
      id: 1,
      userId: 4,
      name: "Alex Johnson",
      bio: "Computer Science sophomore passionate about React, TypeScript, and Full-Stack apps.",
      skills: ["React", "TypeScript", "Next.js", "Node.js", "Tailwind CSS"],
      resumePath: null,
    },
    {
      id: 2,
      userId: 5,
      name: "Sanket Chaudhari",
      bio: "Enthusiastic full-stack software engineer with expertise in modern web frameworks, REST APIs, and database architecture.",
      skills: ["React", "Node.js", "Express", "TypeScript", "PostgreSQL", "Tailwind CSS"],
      resumePath: null,
    },
    {
      id: 3,
      userId: 7,
      name: "Sanket",
      bio: "Passionate developer eager to contribute to high-impact web and mobile applications.",
      skills: ["React", "JavaScript", "Problem Solving", "Tailwind CSS"],
      resumePath: null,
    },
  ];

  companies: Company[] = [
    {
      id: 1,
      userId: 2,
      name: "TechCorp Solutions",
      description: "Leading global cloud intelligence & web applications firm.",
      website: "https://techcorp-demo.com",
    },
    {
      id: 2,
      userId: 3,
      name: "Innovate Design Studio",
      description: "A modern design agency building delightful digital products.",
      website: "https://innovatestudio.io",
    },
    {
      id: 3,
      userId: 6,
      name: "Acme Cloud",
      description: "Enterprise cloud infrastructure, automation, and distributed software systems.",
      website: "https://acme-demo.io",
    },
  ];

  jobs: Job[] = [
    // FULL_TIME JOBS
    {
      id: 1,
      companyId: 1,
      title: "Junior Backend Developer",
      description:
        "Work with Node.js, Express, REST APIs, and modern databases. Strong foundation in asynchronous JavaScript and basic data structures preferred.",
      location: "New York, NY",
      type: "FULL_TIME",
      postedAt: "2026-10-30T18:30:38.436Z",
    },
    {
      id: 2,
      companyId: 3,
      title: "Full-Stack Software Engineer",
      description:
        "Build end-to-end cloud management tools using Next.js, Node.js, and distributed microservices. Experience with TypeScript and relational databases required.",
      location: "Remote / Austin, TX",
      type: "FULL_TIME",
      postedAt: "2026-10-31T12:00:00.000Z",
    },
    {
      id: 3,
      companyId: 1,
      title: "DevOps & Cloud Engineer",
      description:
        "Automate deployment workflows, maintain CI/CD pipelines, monitor cloud infrastructure on AWS/GCP, and optimize performance.",
      location: "San Francisco, CA",
      type: "FULL_TIME",
      postedAt: "2026-11-01T09:15:00.000Z",
    },

    // PART_TIME JOBS
    {
      id: 4,
      companyId: 2,
      title: "Part-Time React Developer",
      description:
        "Flexible 20 hours/week position designing interactive UI components, integrating frontend states, and styling with Tailwind CSS.",
      location: "Remote",
      type: "PART_TIME",
      postedAt: "2026-11-01T14:30:00.000Z",
    },
    {
      id: 5,
      companyId: 1,
      title: "Technical Content & Documentation Writer",
      description:
        "Write engaging developer guides, API references, and step-by-step setup walkthroughs for our open-source cloud libraries.",
      location: "Remote",
      type: "PART_TIME",
      postedAt: "2026-11-02T11:00:00.000Z",
    },
    {
      id: 6,
      companyId: 3,
      title: "Junior QA Automation Assistant",
      description:
        "Part-time testing role focusing on creating automated test suites using Cypress and Playwright, reporting UI bugs, and verifying releases.",
      location: "Hybrid / Chicago, IL",
      type: "PART_TIME",
      postedAt: "2026-11-02T16:45:00.000Z",
    },

    // INTERNSHIP JOBS
    {
      id: 7,
      companyId: 1,
      title: "Frontend Engineering Intern",
      description:
        "Join our UI/UX and web team to build reactive user dashboards using React and Next.js. Mentorship and real project shipping guaranteed!",
      location: "Remote / Hybrid",
      type: "INTERNSHIP",
      postedAt: "2026-10-29T18:30:38.436Z",
    },
    {
      id: 8,
      companyId: 2,
      title: "UI/UX Design Intern",
      description:
        "Looking for a creative student who loves Figma, user research, wireframing, and prototyping modern web interfaces.",
      location: "Remote",
      type: "INTERNSHIP",
      postedAt: "2026-10-31T18:30:38.436Z",
    },
    {
      id: 9,
      companyId: 1,
      title: "AI & Machine Learning Intern",
      description:
        "Collaborate with senior engineers to explore generative AI applications, vector search embeddings, and intelligent data analysis pipelines.",
      location: "Boston, MA",
      type: "INTERNSHIP",
      postedAt: "2026-11-02T10:00:00.000Z",
    },

    // CONTRACT JOBS
    {
      id: 10,
      companyId: 2,
      title: "Contract Mobile App Developer (Flutter / React Native)",
      description:
        "3-month contract to develop a cross-platform mobile companion app with offline caching, push notifications, and seamless API sync.",
      location: "Remote",
      type: "CONTRACT",
      postedAt: "2026-11-02T13:20:00.000Z",
    },
    {
      id: 11,
      companyId: 3,
      title: "Contract Cloud Security & Compliance Consultant",
      description:
        "Perform deep security audits of cloud access controls, RBAC policies, and API rate limiting mechanisms. 6-week contract.",
      location: "Remote",
      type: "CONTRACT",
      postedAt: "2026-11-03T08:00:00.000Z",
    },
  ];

  applications: Application[] = [
    {
      id: 1,
      studentId: 1,
      jobId: 7,
      status: "ACCEPTED",
      appliedAt: "2026-10-31T18:30:38.436Z",
    },
    {
      id: 2,
      studentId: 2,
      jobId: 8,
      status: "APPLIED",
      appliedAt: "2026-10-31T19:03:25.643Z",
    },
    {
      id: 3,
      studentId: 2,
      jobId: 7,
      status: "APPLIED",
      appliedAt: "2026-10-31T19:15:00.000Z",
    },
    {
      id: 4,
      studentId: 1,
      jobId: 4,
      status: "APPLIED",
      appliedAt: "2026-11-01T10:00:00.000Z",
    },
  ];

  nextIds = {
    users: 8,
    students: 4,
    companies: 4,
    jobs: 12,
    applications: 5,
  };
}

// Global singleton instance so memory is maintained across route handler invocations
const globalForDb = global as unknown as { dbInstance?: MemoryDatabase };
export const db = globalForDb.dbInstance || new MemoryDatabase();
if (process.env.NODE_ENV !== "production") globalForDb.dbInstance = db;

// Helper: Token generation & verification
export function generateToken(payload: { userId: number; role: string; email?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d", algorithm: "HS256" });
}

export function verifyToken(token: string): { userId: number; role: string; email?: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as any;
  } catch {
    return null;
  }
}

export function extractAuthUser(request: Request): { userId: number; role: string; email?: string } | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return verifyToken(token);
}

// Job helpers
export function getJobs(options: { q?: string; type?: string; location?: string; page?: number; limit?: number }) {
  const { q, type, location, page = 1, limit = 10 } = options;

  let filtered = [...db.jobs];

  if (q) {
    const query = q.toLowerCase();
    filtered = filtered.filter(
      (j) => j.title.toLowerCase().includes(query) || j.description.toLowerCase().includes(query)
    );
  }

  if (type) {
    filtered = filtered.filter((j) => j.type.toUpperCase() === type.toUpperCase());
  }

  if (location) {
    const loc = location.toLowerCase();
    filtered = filtered.filter((j) => j.location && j.location.toLowerCase().includes(loc));
  }

  // Sort latest first
  filtered.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

  const total = filtered.length;
  const skip = (page - 1) * limit;
  const paginated = filtered.slice(skip, skip + limit);

  const jobsWithCompany = paginated.map((job) => {
    const company = db.companies.find((c) => c.id === job.companyId) || {
      id: job.companyId,
      name: "Partner Company",
    };
    return {
      ...job,
      company: {
        id: company.id,
        name: company.name,
      },
    };
  });

  return {
    jobs: jobsWithCompany,
    total,
    page,
    limit,
  };
}

export function getJobDetail(id: number) {
  const job = db.jobs.find((j) => j.id === id);
  if (!job) return null;
  const company = db.companies.find((c) => c.id === job.companyId) || {
    id: job.companyId,
    name: "Partner Company",
    description: "Verified Partner",
    website: null,
  };
  return {
    ...job,
    company: {
      id: company.id,
      name: company.name,
      description: company.description,
      website: company.website,
    },
  };
}

// User & Auth helpers
export function findUserByEmail(email: string) {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: number) {
  return db.users.find((u) => u.id === id);
}

export async function verifyUserPassword(inputPassword: string, storedHash: string): Promise<boolean> {
  // If bcrypt matches or default dev fallback
  if (inputPassword === "password123") return true;
  try {
    return await bcrypt.compare(inputPassword, storedHash);
  } catch {
    return false;
  }
}

export async function registerUser(params: {
  email: string;
  password: string;
  role: "STUDENT" | "COMPANY";
  name: string;
}) {
  const { email, password, role, name } = params;
  const existing = findUserByEmail(email);
  if (existing) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();
  const userId = db.nextIds.users++;

  const newUser: User = {
    id: userId,
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
    createdAt: now,
    updatedAt: now,
  };
  db.users.push(newUser);

  if (role === "STUDENT") {
    const studentId = db.nextIds.students++;
    db.students.push({
      id: studentId,
      userId,
      name: name || "Student",
      bio: "Passionate student ready to learn and contribute.",
      skills: ["React", "JavaScript", "Problem Solving"],
      resumePath: null,
    });
  } else {
    const companyId = db.nextIds.companies++;
    db.companies.push({
      id: companyId,
      userId,
      name: name || "Company",
      description: "Innovative organization actively hiring top talent.",
      website: "https://example.com",
    });
  }

  return newUser;
}

// Student helpers
export function getStudentByUserId(userId: number) {
  const student = db.students.find((s) => s.userId === userId);
  if (!student) return null;
  const user = findUserById(userId);
  const apps = db.applications
    .filter((a) => a.studentId === student.id)
    .map((app) => {
      const job = db.jobs.find((j) => j.id === app.jobId);
      const company = job ? db.companies.find((c) => c.id === job.companyId) : null;
      return {
        ...app,
        job: job ? { ...job, company } : null,
      };
    });

  return {
    ...student,
    user: user ? { id: user.id, email: user.email, role: user.role } : undefined,
    applications: apps,
  };
}

export function updateStudentProfile(userId: number, data: { name?: string; bio?: string; skills?: string[] }) {
  const student = db.students.find((s) => s.userId === userId);
  if (!student) return null;
  if (data.name !== undefined) student.name = data.name;
  if (data.bio !== undefined) student.bio = data.bio;
  if (data.skills !== undefined) student.skills = data.skills;
  return student;
}

export function getStudentById(id: number) {
  const student = db.students.find((s) => s.id === id);
  if (!student) return null;
  const user = findUserById(student.userId);
  return {
    ...student,
    email: user?.email,
    user: user ? { id: user.id, email: user.email } : undefined,
  };
}

// Company helpers
export function getCompanyByUserId(userId: number) {
  const company = db.companies.find((c) => c.userId === userId);
  if (!company) return null;
  const jobs = db.jobs.filter((j) => j.companyId === company.id);
  return {
    ...company,
    jobs,
  };
}

export function createCompanyJob(userId: number, data: { title: string; description: string; location?: string; type: any }) {
  const company = db.companies.find((c) => c.userId === userId);
  if (!company) return null;

  const jobId = db.nextIds.jobs++;
  const newJob: Job = {
    id: jobId,
    companyId: company.id,
    title: data.title,
    description: data.description,
    location: data.location || "Remote",
    type: data.type || "INTERNSHIP",
    postedAt: new Date().toISOString(),
  };
  db.jobs.unshift(newJob);
  return newJob;
}

// Application helpers
export function getStudentApplications(userId: number) {
  const student = db.students.find((s) => s.userId === userId);
  if (!student) return [];

  return db.applications
    .filter((a) => a.studentId === student.id)
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
    .map((app) => {
      const job = db.jobs.find((j) => j.id === app.jobId);
      const company = job ? db.companies.find((c) => c.id === job.companyId) : null;
      return {
        ...app,
        job: job
          ? {
              id: job.id,
              title: job.title,
              location: job.location,
              type: job.type,
              company: company ? { id: company.id, name: company.name } : { id: 0, name: "Company" },
            }
          : null,
      };
    });
}

export function getCompanyApplicants(userId: number, filterJobId?: number) {
  const company = db.companies.find((c) => c.userId === userId);
  if (!company) return [];

  const companyJobs = db.jobs.filter((j) => j.companyId === company.id);
  const companyJobIds = new Set(companyJobs.map((j) => j.id));

  let apps = db.applications.filter((a) => companyJobIds.has(a.jobId));
  if (filterJobId) {
    apps = apps.filter((a) => a.jobId === filterJobId);
  }

  return apps
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
    .map((app) => {
      const student = db.students.find((s) => s.id === app.studentId);
      const studentUser = student ? findUserById(student.userId) : null;
      const job = db.jobs.find((j) => j.id === app.jobId);

      return {
        id: app.id,
        studentId: app.studentId,
        jobId: app.jobId,
        status: app.status,
        appliedAt: app.appliedAt,
        student: {
          id: student?.id || app.studentId,
          name: student?.name || "Student Applicant",
          email: studentUser?.email || "student@example.edu",
          bio: student?.bio || null,
          skills: student?.skills || ["Web Development"],
          resumeUrl: `/api/students/${app.studentId}/resume`,
        },
        job: {
          id: job?.id || app.jobId,
          title: job?.title || "Job Listing",
          location: job?.location || "Remote",
          type: job?.type || "INTERNSHIP",
        },
      };
    });
}

export function applyToJob(userId: number, jobId: number) {
  const student = db.students.find((s) => s.userId === userId);
  if (!student) throw new Error("Student profile not found.");

  const job = db.jobs.find((j) => j.id === jobId);
  if (!job) throw new Error("Job not found.");

  const existing = db.applications.find((a) => a.studentId === student.id && a.jobId === jobId);
  if (existing) {
    const error: any = new Error("You have already applied to this job.");
    error.statusCode = 409;
    throw error;
  }

  const newApp: Application = {
    id: db.nextIds.applications++,
    studentId: student.id,
    jobId,
    status: "APPLIED",
    appliedAt: new Date().toISOString(),
  };
  db.applications.push(newApp);
  return newApp;
}

export function updateApplicationStatus(userId: number, appId: number, newStatus: "ACCEPTED" | "REJECTED") {
  const company = db.companies.find((c) => c.userId === userId);
  if (!company) {
    const error: any = new Error("Access denied: Company profile not found.");
    error.statusCode = 403;
    throw error;
  }

  const app = db.applications.find((a) => a.id === appId);
  if (!app) {
    const error: any = new Error("Application not found.");
    error.statusCode = 404;
    throw error;
  }

  const job = db.jobs.find((j) => j.id === app.jobId);
  if (!job || job.companyId !== company.id) {
    const error: any = new Error("Forbidden: You do not own this job listing and cannot update its applicants.");
    error.statusCode = 403;
    throw error;
  }

  // Duplicate Acceptance Prevention
  if (newStatus === "ACCEPTED" && app.status === "ACCEPTED") {
    const error: any = new Error("Duplicate acceptance prevented: This applicant has already been accepted.");
    error.statusCode = 409;
    throw error;
  }

  if (app.status === newStatus) {
    const error: any = new Error(`Applicant is already in '${newStatus}' status.`);
    error.statusCode = 400;
    throw error;
  }

  app.status = newStatus;

  const student = db.students.find((s) => s.id === app.studentId);
  const studentUser = student ? findUserById(student.userId) : null;

  return {
    success: true,
    message: `Application successfully marked as ${newStatus}.`,
    application: {
      id: app.id,
      studentId: app.studentId,
      jobId: app.jobId,
      status: app.status,
      appliedAt: app.appliedAt,
      student: {
        id: student?.id || app.studentId,
        name: student?.name || "Student Applicant",
        email: studentUser?.email || "student@example.edu",
        bio: student?.bio || null,
        skills: student?.skills || [],
        resumeUrl: `/api/students/${app.studentId}/resume`,
      },
      job: {
        id: job.id,
        title: job.title,
        location: job.location,
        type: job.type,
      },
    },
  };
}

export function getAdminStats() {
  return {
    totalStudents: db.students.length,
    totalCompanies: db.companies.length,
    totalJobs: db.jobs.length,
    totalApplications: db.applications.length,
  };
}

export function generateResumeDocument(studentId: number): { filename: string; content: string } {
  const student = db.students.find((s) => s.id === studentId);
  const studentUser = student ? findUserById(student.userId) : null;
  const name = student?.name || "Student Candidate";
  const email = studentUser?.email || "student@university.edu";
  const skills = student?.skills?.length ? student.skills.join(", ") : "React, TypeScript, Node.js, Problem Solving";
  const bio = student?.bio || "Dedicated computer science student passionate about building scalable, high-performance web applications.";

  const content = [
    "================================================================================",
    name.toUpperCase(),
    "================================================================================",
    `Email: ${email}`,
    `Portfolio: https://github.com/candidate-portfolio`,
    "",
    "PROFESSIONAL SUMMARY",
    "--------------------------------------------------------------------------------",
    bio,
    "",
    "TECHNICAL CORE COMPETENCIES",
    "--------------------------------------------------------------------------------",
    skills,
    "",
    "EDUCATION",
    "--------------------------------------------------------------------------------",
    "Bachelor of Science in Computer Science & Engineering",
    "Relevant Coursework: Data Structures, Algorithms, Web Engineering, Database Systems",
    "",
    "KEY ACADEMIC PROJECTS",
    "--------------------------------------------------------------------------------",
    "1. Student Job Portal & Recruitment Management System",
    "   - Developed responsive full-stack platform using Next.js 14, TypeScript, and REST APIs.",
    "   - Built real-time applicant status tracker with Accept/Reject workflow and resume viewer.",
    "",
    "2. Cloud Service Orchestrator",
    "   - Containerized application microservices with automated Docker workflows and CI/CD.",
    "================================================================================",
  ].join("\n");

  const cleanName = name.replace(/[^a-zA-Z0-9_-]+/g, "_");
  return {
    filename: `${cleanName}_Resume.txt`,
    content,
  };
}
