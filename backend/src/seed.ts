import bcrypt from 'bcrypt';
import { dbInstance } from './prisma';

export async function seedDemoData() {
  const data = dbInstance.getData();
  if (data.users.length > 0) return; // already seeded

  console.log('🌱 Seeding demo database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Admin
  const adminUser = {
    id: data.nextIds.users++,
    email: 'admin@portal.com',
    password: passwordHash,
    role: 'ADMIN' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.users.push(adminUser);

  // 2. Companies
  const techCorpUser = {
    id: data.nextIds.users++,
    email: 'hr@techcorp.com',
    password: passwordHash,
    role: 'COMPANY' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.users.push(techCorpUser);
  const techCorp = {
    id: data.nextIds.companies++,
    userId: techCorpUser.id,
    name: 'TechCorp Solutions',
    description: 'Leading global cloud intelligence & web applications firm.',
    website: 'https://techcorp-demo.com'
  };
  data.companies.push(techCorp);

  const designStudioUser = {
    id: data.nextIds.users++,
    email: 'careers@innovatestudio.io',
    password: passwordHash,
    role: 'COMPANY' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.users.push(designStudioUser);
  const designStudio = {
    id: data.nextIds.companies++,
    userId: designStudioUser.id,
    name: 'Innovate Design Studio',
    description: 'A modern design agency building delightful digital products.',
    website: 'https://innovatestudio.io'
  };
  data.companies.push(designStudio);

  // 3. Students
  const studentUser1 = {
    id: data.nextIds.users++,
    email: 'alex@student.edu',
    password: passwordHash,
    role: 'STUDENT' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.users.push(studentUser1);
  const student1 = {
    id: data.nextIds.students++,
    userId: studentUser1.id,
    name: 'Alex Johnson',
    bio: 'Computer Science sophomore passionate about React, TypeScript, and Full-Stack apps.',
    resumePath: null
  };
  data.students.push(student1);

  // 4. Jobs
  const job1 = {
    id: data.nextIds.jobs++,
    companyId: techCorp.id,
    title: 'Frontend Engineering Intern',
    description: 'Join our UI/UX and web team to build reactive user dashboards using React and Next.js. Mentorship and real project shipping guaranteed!',
    location: 'Remote / Hybrid',
    type: 'INTERNSHIP',
    postedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  };

  const job2 = {
    id: data.nextIds.jobs++,
    companyId: techCorp.id,
    title: 'Junior Backend Developer',
    description: 'Work with Node.js, Express, REST APIs, and modern databases. Strong foundation in asynchronous JavaScript and basic data structures preferred.',
    location: 'New York, NY',
    type: 'FULL_TIME',
    postedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  };

  const job3 = {
    id: data.nextIds.jobs++,
    companyId: designStudio.id,
    title: 'UI/UX Design Intern',
    description: 'Looking for a creative student who loves Figma, user research, and prototyping modern web interfaces.',
    location: 'Remote',
    type: 'INTERNSHIP',
    postedAt: new Date().toISOString()
  };

  data.jobs.push(job1, job2, job3);

  // 5. Initial Application
  data.applications.push({
    id: data.nextIds.applications++,
    studentId: student1.id,
    jobId: job1.id,
    status: 'APPLIED',
    appliedAt: new Date().toISOString()
  });

  dbInstance.save();
  console.log('✅ Demo database seeded with admin, companies, jobs, and student accounts!');
}
