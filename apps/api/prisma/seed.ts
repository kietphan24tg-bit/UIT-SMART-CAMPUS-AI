import {
  PrismaClient,
  Role,
  SubscriptionStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123', 10);

  const [admin, student] = await Promise.all([
    prisma.user.upsert({
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
    }),
    prisma.user.upsert({
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
    }),
  ]);

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

  const vehicle = await prisma.vehicle.upsert({
    where: { plateNumber: '51F44614' },
    update: {},
    create: {
      userId: student.id,
      plateNumber: '51F44614',
      rfidTag: 'DEMO-RFID-0001',
      label: 'Xe may demo',
      isActive: true,
    },
  });

  await prisma.parkingSubscription.upsert({
    where: { vehicleId: vehicle.id },
    update: {},
    create: {
      vehicleId: vehicle.id,
      monthlyFee: 40000,
      status: SubscriptionStatus.active,
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2026-05-01T00:00:00.000Z'),
      lastPaymentAt: new Date('2026-04-01T00:00:00.000Z'),
    },
  });

  for (const slotNumber of ['A1', 'A2', 'A3', 'A4']) {
    await prisma.parkingSlot.upsert({
      where: {
        gateId_slotNumber: {
          gateId: 'uit-gate-a',
          slotNumber,
        },
      },
      update: {},
      create: {
        gateId: 'uit-gate-a',
        zone: 'Main',
        slotNumber,
        isOccupied: false,
      },
    });
  }

  console.warn('Seed completed:', {
    admin: admin.email,
    student: student.email,
    semester: semester.name,
    vehicle: vehicle.plateNumber,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
