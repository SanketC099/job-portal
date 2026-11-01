import fs from 'fs';
import path from 'path';

export interface User {
  id: number;
  email: string;
  password: string;
  role: 'STUDENT' | 'COMPANY' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: number;
  userId: number;
  name: string;
  bio?: string | null;
  skills?: string[];
  resumePath?: string | null;
}

export interface Company {
  id: number;
  userId: number;
  name: string;
  description?: string | null;
  website?: string | null;
}

export interface Job {
  id: number;
  companyId: number;
  title: string;
  description: string;
  location?: string | null;
  type: string;
  postedAt: string;
}

export interface Application {
  id: number;
  studentId: number;
  jobId: number;
  status: 'APPLIED' | 'REJECTED' | 'ACCEPTED' | 'WITHDRAWN';
  appliedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  students: Student[];
  companies: Company[];
  jobs: Job[];
  applications: Application[];
  nextIds: {
    users: number;
    students: number;
    companies: number;
    jobs: number;
    applications: number;
  };
}

const dbFilePath = path.join(__dirname, '../data/database.json');

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) return true;
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

class JsonDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    ensureDirectoryExistence(dbFilePath);
    if (!fs.existsSync(dbFilePath)) {
      const initial: DatabaseSchema = {
        users: [],
        students: [],
        companies: [],
        jobs: [],
        applications: [],
        nextIds: { users: 1, students: 1, companies: 1, jobs: 1, applications: 1 }
      };
      fs.writeFileSync(dbFilePath, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    try {
      const parsed = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
      return parsed;
    } catch {
      return {
        users: [],
        students: [],
        companies: [],
        jobs: [],
        applications: [],
        nextIds: { users: 1, students: 1, companies: 1, jobs: 1, applications: 1 }
      };
    }
  }

  public save() {
    ensureDirectoryExistence(dbFilePath);
    fs.writeFileSync(dbFilePath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  public getData(): DatabaseSchema {
    return this.data;
  }
}

export const dbInstance = new JsonDatabase();

// Prisma-like fluent interface for seamless integration with existing routes
export const prisma = {
  user: {
    findUnique: async ({ where }: { where: { email?: string; id?: number } }) => {
      const data = dbInstance.getData();
      return data.users.find(u => (where.email ? u.email === where.email : u.id === where.id)) || null;
    },
    findMany: async (opts?: any) => {
      let users = [...dbInstance.getData().users];
      if (opts?.select) {
        users = users.map(u => {
          const res: any = {};
          for (const key of Object.keys(opts.select)) {
            res[key] = (u as any)[key];
          }
          return res;
        });
      }
      return users;
    },
    create: async ({ data }: { data: any }) => {
      const all = dbInstance.getData();
      const user: User = {
        id: all.nextIds.users++,
        email: data.email,
        password: data.password,
        role: data.role || 'STUDENT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      all.users.push(user);
      dbInstance.save();
      return user;
    },
    delete: async ({ where }: { where: { id: number } }) => {
      const all = dbInstance.getData();
      const idx = all.users.findIndex(u => u.id === where.id);
      if (idx !== -1) {
        const deleted = all.users.splice(idx, 1)[0];
        all.students = all.students.filter(s => s.userId !== where.id);
        all.companies = all.companies.filter(c => c.userId !== where.id);
        dbInstance.save();
        return deleted;
      }
      return null;
    },
    count: async () => dbInstance.getData().users.length
  },

  student: {
    findUnique: async ({ where, include }: { where: { userId?: number; id?: number }; include?: any }) => {
      const all = dbInstance.getData();
      const s = all.students.find(item => (where.userId ? item.userId === where.userId : item.id === where.id));
      if (!s) return null;
      const res: any = { ...s };
      if (!res.skills) {
        res.skills = ['React', 'JavaScript', 'Problem Solving'];
      }
      if (include?.user) {
        res.user = all.users.find(u => u.id === s.userId);
      }
      if (include?.applications) {
        let apps = all.applications.filter(a => a.studentId === s.id);
        if (include.applications.include?.job) {
          apps = apps.map(a => {
            const j = all.jobs.find(item => item.id === a.jobId);
            const comp = j ? all.companies.find(c => c.id === j.companyId) : null;
            return {
              ...a,
              job: j ? { ...j, company: comp ? { id: comp.id, name: comp.name } : null } : null
            };
          });
        }
        res.applications = apps;
      }
      return res;
    },
    create: async ({ data }: { data: any }) => {
      const all = dbInstance.getData();
      const student: Student = {
        id: all.nextIds.students++,
        userId: data.userId,
        name: data.name,
        bio: data.bio || null,
        skills: Array.isArray(data.skills) ? data.skills : (typeof data.skills === 'string' ? data.skills.split(',').map((s: string) => s.trim()) : ['React', 'JavaScript', 'Problem Solving']),
        resumePath: data.resumePath || null
      };
      all.students.push(student);
      dbInstance.save();
      return student;
    },
    update: async ({ where, data }: { where: { userId?: number; id?: number }; data: any }) => {
      const all = dbInstance.getData();
      const s = all.students.find(item => (where.userId ? item.userId === where.userId : item.id === where.id));
      if (!s) return null;
      if (data.name !== undefined) s.name = data.name;
      if (data.bio !== undefined) s.bio = data.bio;
      if (data.skills !== undefined) {
        s.skills = Array.isArray(data.skills) ? data.skills : (typeof data.skills === 'string' ? data.skills.split(',').map((item: string) => item.trim()).filter(Boolean) : s.skills);
      }
      if (data.resumePath !== undefined) s.resumePath = data.resumePath;
      dbInstance.save();
      return s;
    },
    count: async () => dbInstance.getData().students.length
  },

  company: {
    findUnique: async ({ where, include }: { where: { userId?: number; id?: number }; include?: any }) => {
      const all = dbInstance.getData();
      const c = all.companies.find(item => (where.userId ? item.userId === where.userId : item.id === where.id));
      if (!c) return null;
      const res: any = { ...c };
      if (include?.jobs) {
        res.jobs = all.jobs.filter(j => j.companyId === c.id);
      }
      return res;
    },
    create: async ({ data }: { data: any }) => {
      const all = dbInstance.getData();
      const comp: Company = {
        id: all.nextIds.companies++,
        userId: data.userId,
        name: data.name,
        description: data.description || null,
        website: data.website || null
      };
      all.companies.push(comp);
      dbInstance.save();
      return comp;
    },
    update: async ({ where, data }: { where: { userId: number }; data: any }) => {
      const all = dbInstance.getData();
      const c = all.companies.find(item => item.userId === where.userId);
      if (!c) return null;
      Object.assign(c, data);
      dbInstance.save();
      return c;
    },
    count: async () => dbInstance.getData().companies.length
  },

  job: {
    findMany: async (opts?: any) => {
      const all = dbInstance.getData();
      let list = [...all.jobs];

      if (opts?.where) {
        if (opts.where.companyId) {
          list = list.filter(j => j.companyId === opts.where.companyId);
        }
        if (opts.where.type) {
          list = list.filter(j => j.type === opts.where.type);
        }
        if (opts.where.location?.contains) {
          const loc = opts.where.location.contains.toLowerCase();
          list = list.filter(j => (j.location || '').toLowerCase().includes(loc));
        }
        if (opts.where.OR) {
          list = list.filter(j => {
            return opts.where.OR.some((cond: any) => {
              if (cond.title?.contains) {
                return j.title.toLowerCase().includes(cond.title.contains.toLowerCase());
              }
              if (cond.description?.contains) {
                return j.description.toLowerCase().includes(cond.description.contains.toLowerCase());
              }
              return false;
            });
          });
        }
      }

      list.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

      if (opts?.skip !== undefined && opts?.take !== undefined) {
        list = list.slice(opts.skip, opts.skip + opts.take);
      }

      if (opts?.include?.company) {
        return list.map(j => {
          const comp = all.companies.find(c => c.id === j.companyId);
          return {
            ...j,
            company: comp ? { id: comp.id, name: comp.name, description: comp.description, website: comp.website } : { id: j.companyId, name: 'Company' }
          };
        });
      }

      return list;
    },

    findUnique: async ({ where, include }: { where: { id: number }; include?: any }) => {
      const all = dbInstance.getData();
      const j = all.jobs.find(item => item.id === where.id);
      if (!j) return null;
      const res: any = { ...j };
      if (include?.company) {
        const comp = all.companies.find(c => c.id === j.companyId);
        res.company = comp ? { id: comp.id, name: comp.name, description: comp.description, website: comp.website } : null;
      }
      return res;
    },

    create: async ({ data }: { data: any }) => {
      const all = dbInstance.getData();
      const job: Job = {
        id: all.nextIds.jobs++,
        companyId: data.companyId,
        title: data.title,
        description: data.description,
        location: data.location || null,
        type: data.type || 'INTERNSHIP',
        postedAt: new Date().toISOString()
      };
      all.jobs.push(job);
      dbInstance.save();
      return job;
    },

    update: async ({ where, data }: { where: { id: number }; data: any }) => {
      const all = dbInstance.getData();
      const j = all.jobs.find(item => item.id === where.id);
      if (!j) return null;
      Object.assign(j, data);
      dbInstance.save();
      return j;
    },

    delete: async ({ where }: { where: { id: number } }) => {
      const all = dbInstance.getData();
      const idx = all.jobs.findIndex(j => j.id === where.id);
      if (idx !== -1) {
        const deleted = all.jobs.splice(idx, 1)[0];
        all.applications = all.applications.filter(a => a.jobId !== where.id);
        dbInstance.save();
        return deleted;
      }
      return null;
    },

    count: async (opts?: any) => {
      const all = dbInstance.getData();
      if (!opts?.where) return all.jobs.length;
      return (await prisma.job.findMany(opts)).length;
    }
  },

  application: {
    findUnique: async ({ where, include }: { where: { id: number }; include?: any }) => {
      const all = dbInstance.getData();
      const a = all.applications.find(item => item.id === where.id);
      if (!a) return null;
      const res: any = { ...a };
      if (include?.job) {
        const j = all.jobs.find(item => item.id === a.jobId);
        if (j) {
          const comp = all.companies.find(c => c.id === j.companyId);
          res.job = { ...j, company: comp ? { id: comp.id, name: comp.name } : null };
        }
      }
      if (include?.student) {
        const s = all.students.find(item => item.id === a.studentId);
        const u = s ? all.users.find(user => user.id === s.userId) : null;
        res.student = s ? {
          id: s.id,
          name: s.name,
          email: u?.email || 'student@university.edu',
          bio: s.bio,
          skills: s.skills || ['React', 'JavaScript', 'Problem Solving'],
          resumePath: s.resumePath,
          resumeUrl: `/api/students/${s.id}/resume`
        } : null;
      }
      return res;
    },

    findMany: async ({ where, include }: { where?: any; include?: any }) => {
      const all = dbInstance.getData();
      let apps = [...all.applications];
      if (where?.studentId) apps = apps.filter(a => a.studentId === where.studentId);
      if (where?.jobId) apps = apps.filter(a => a.jobId === where.jobId);
      if (where?.jobIdIn) apps = apps.filter(a => where.jobIdIn.includes(a.jobId));

      apps.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

      return apps.map(a => {
        const res: any = { ...a };
        if (include?.job) {
          const j = all.jobs.find(item => item.id === a.jobId);
          if (j) {
            const comp = all.companies.find(c => c.id === j.companyId);
            res.job = { ...j, company: comp ? { id: comp.id, name: comp.name } : null };
          }
        }
        if (include?.student) {
          const s = all.students.find(item => item.id === a.studentId);
          const u = s ? all.users.find(user => user.id === s.userId) : null;
          res.student = s ? {
            id: s.id,
            name: s.name,
            email: u?.email || 'student@university.edu',
            bio: s.bio,
            skills: s.skills || ['React', 'JavaScript', 'Problem Solving'],
            resumePath: s.resumePath,
            resumeUrl: `/api/students/${s.id}/resume`
          } : null;
        }
        return res;
      });
    },

    create: async ({ data }: { data: any }) => {
      const all = dbInstance.getData();
      const existing = all.applications.find(a => a.studentId === data.studentId && a.jobId === data.jobId);
      if (existing) {
        const error: any = new Error('Unique constraint failed');
        error.code = 'P2002';
        throw error;
      }
      const app: Application = {
        id: all.nextIds.applications++,
        studentId: data.studentId,
        jobId: data.jobId,
        status: 'APPLIED',
        appliedAt: new Date().toISOString()
      };
      all.applications.push(app);
      dbInstance.save();
      return app;
    },

    update: async ({ where, data }: { where: { id: number }; data: any }) => {
      const all = dbInstance.getData();
      const a = all.applications.find(item => item.id === where.id);
      if (!a) return null;
      Object.assign(a, data);
      dbInstance.save();
      return a;
    },

    count: async () => dbInstance.getData().applications.length
  }
};

export default prisma;
