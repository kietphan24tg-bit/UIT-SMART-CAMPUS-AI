import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@uit.edu.vn' },
    update: {},
    create: {
      email: 'admin@uit.edu.vn',
      passwordHash,
      firstName: 'Admin',
      lastName: 'System',
      role: Role.admin,
      isActive: true,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@gm.uit.edu.vn' },
    update: {},
    create: {
      email: 'student@gm.uit.edu.vn',
      passwordHash,
      studentId: '22520001',
      firstName: 'Nguyen',
      lastName: 'Van A',
      role: Role.student,
      faculty: 'Khoa Cong nghe Phan mem',
      major: 'Cong nghe phan mem',
      yearOfAdmission: 2022,
      isActive: true,
    },
  });

  const semester = await prisma.semester.upsert({
    where: { id: 'sem-2024-2025-2' },
    update: {},
    create: {
      id: 'sem-2024-2025-2',
      name: 'HK2 2024-2025',
      startDate: new Date('2025-01-06'),
      endDate: new Date('2025-05-30'),
      isCurrent: true,
    },
  });

  console.warn('Seed completed:', { admin: admin.email, student: student.email, semester: semester.name });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
