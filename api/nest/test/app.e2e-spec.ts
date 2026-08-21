import { RequestMethod, ValidationPipe, type INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { API_PREFIX } from '@smart-campus/shared';
import request from 'supertest';

import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/database/prisma.service';

jest.setTimeout(180_000);

process.env.DATABASE_URL ??=
  'postgresql://smartcampus:smartcampus_dev@localhost:65432/smart_campus';
process.env.JWT_SECRET ??= 'smart-campus-e2e-secret';
process.env.JWT_EXPIRATION ??= '15m';
process.env.JWT_REFRESH_EXPIRATION ??= '7d';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.CORS_ORIGIN ??= '*';
process.env.APP_BASE_URL ??= 'http://localhost:3000';

type SeedRole = 'student' | 'lecturer' | 'canteen_admin' | 'admin' | 'super_admin';

const seedAccounts: Record<SeedRole, { email: string; password: string }> = {
  student: { email: 'student@gm.uit.edu.vn', password: 'Password123' },
  lecturer: { email: 'lecturer@uit.edu.vn', password: 'Password123' },
  canteen_admin: { email: 'canteen.admin@uit.edu.vn', password: 'Password123' },
  admin: { email: 'admin@uit.edu.vn', password: 'Password123' },
  super_admin: { email: 'superadmin@uit.edu.vn', password: 'Password123' },
};

describe('API RBAC & Integrity (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;
  const accessTokens: Partial<Record<SeedRole, string>> = {};

  beforeAll(async () => {
    const { AppModule } = await import('../src/app.module');
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix(API_PREFIX, {
      exclude: [{ path: 'live/(.*)', method: RequestMethod.ALL }],
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));
    await app.init();
    prisma = app.get(PrismaService);
    server = app.getHttpServer();

    for (const [role, credentials] of Object.entries(seedAccounts) as Array<
      [SeedRole, (typeof seedAccounts)[SeedRole]]
    >) {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(200);

      const token = response.body?.data?.accessToken ?? response.body?.accessToken;
      expect(token).toBeTruthy();
      accessTokens[role] = token;
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/api/v1/auth/login (POST) rejects invalid credentials', () => {
    return request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'invalid@test.com', password: 'wrongpass' })
      .expect(401);
  });

  it.each([
    ['lecturer', 200],
    ['admin', 200],
    ['super_admin', 200],
    ['student', 403],
    ['canteen_admin', 403],
  ] as const)(
    'GET /attendance/lecturer/class-sections role %s => %i',
    async (role, expectedStatus) => {
      await request(server)
        .get('/api/v1/attendance/lecturer/class-sections')
        .set('Authorization', `Bearer ${accessTokens[role] as string}`)
        .expect(expectedStatus);
    },
  );

  it.each([
    ['canteen_admin', 200],
    ['admin', 200],
    ['super_admin', 200],
    ['student', 403],
    ['lecturer', 403],
  ] as const)(
    'GET /canteen/orders/admin role %s => %i',
    async (role, expectedStatus) => {
      await request(server)
        .get('/api/v1/canteen/orders/admin')
        .set('Authorization', `Bearer ${accessTokens[role] as string}`)
        .expect(expectedStatus);
    },
  );

  it.each([
    ['admin', 200],
    ['super_admin', 200],
    ['canteen_admin', 403],
    ['student', 403],
    ['lecturer', 403],
  ] as const)(
    'DELETE /canteen/orders/admin/:id role %s => %i',
    async (role, expectedStatus) => {
      const student = await prisma.user.findUnique({
        where: { email: seedAccounts.student.email },
        select: { id: true },
      });
      const product = await prisma.canteenProduct.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true },
      });
      expect(student?.id).toBeTruthy();
      expect(product?.id).toBeTruthy();

      const order = await prisma.canteenOrder.create({
        data: {
          orderCode: `QC-ADMIN-DELETE-${Date.now()}-${role}`,
          createdById: student?.id as string,
          status: 'completed',
          totalAmount: 15000,
          items: {
            create: {
              productId: product?.id as string,
              productName: product?.name as string,
              unitPrice: 15000,
              quantity: 1,
              lineTotal: 15000,
            },
          },
        },
      });

      await request(server)
        .delete(`/api/v1/canteen/orders/admin/${encodeURIComponent(order.id)}`)
        .set('Authorization', `Bearer ${accessTokens[role] as string}`)
        .expect(expectedStatus);
    },
  );

  it.each([
    ['student', 200],
    ['lecturer', 403],
    ['canteen_admin', 403],
    ['admin', 403],
    ['super_admin', 403],
  ] as const)(
    'GET /registrations/me role %s => %i',
    async (role, expectedStatus) => {
      await request(server)
        .get('/api/v1/registrations/me')
        .set('Authorization', `Bearer ${accessTokens[role] as string}`)
        .expect(expectedStatus);
    },
  );

  it.each([
    ['admin', 200],
    ['super_admin', 200],
    ['student', 403],
    ['lecturer', 403],
    ['canteen_admin', 403],
  ] as const)(
    'GET /room-bookings role %s => %i',
    async (role, expectedStatus) => {
      await request(server)
        .get('/api/v1/room-bookings')
        .set('Authorization', `Bearer ${accessTokens[role] as string}`)
        .expect(expectedStatus);
    },
  );

  it('allows canteen admin roles to call canteen admin mutations and blocks consumer roles', async () => {
    const samplePayload = {
      name: `QC Category ${Date.now()}`,
      description: 'Role matrix category created from e2e test.',
    };

    const managerRoles: SeedRole[] = ['canteen_admin', 'admin', 'super_admin'];
    const consumerRoles: SeedRole[] = ['student', 'lecturer'];

    for (const role of managerRoles) {
      await request(server)
        .post('/api/v1/canteen/categories')
        .set('Authorization', `Bearer ${accessTokens[role] as string}`)
        .send({ ...samplePayload, name: `${samplePayload.name} ${role}` })
        .expect(201);
    }

    for (const role of consumerRoles) {
      await request(server)
        .post('/api/v1/canteen/categories')
        .set('Authorization', `Bearer ${accessTokens[role] as string}`)
        .send({ ...samplePayload, name: `${samplePayload.name} ${role} deny` })
        .expect(403);
    }
  });

  it('restricts canteen product delete to admin and super_admin and keeps soft-delete behavior', async () => {
    const suffix = Date.now();
    const categoryResponse = await request(server)
      .post('/api/v1/canteen/categories')
      .set('Authorization', `Bearer ${accessTokens.admin as string}`)
      .send({
        name: `Delete Product Category ${suffix}`,
        description: 'Category for product delete e2e.',
      })
      .expect(201);

    const categoryId = categoryResponse.body?.data?.id as string | undefined;
    expect(categoryId).toBeTruthy();

    const productResponse = await request(server)
      .post('/api/v1/canteen/products')
      .set('Authorization', `Bearer ${accessTokens.admin as string}`)
      .send({
        categoryId,
        name: `Delete Product ${suffix}`,
        price: 15000,
        stock: 4,
      })
      .expect(201);

    const productId = productResponse.body?.data?.id as string | undefined;
    expect(productId).toBeTruthy();

    await request(server)
      .delete(`/api/v1/canteen/products/${encodeURIComponent(productId as string)}`)
      .set('Authorization', `Bearer ${accessTokens.canteen_admin as string}`)
      .expect(403);

    await request(server)
      .delete(`/api/v1/canteen/products/${encodeURIComponent(productId as string)}`)
      .set('Authorization', `Bearer ${accessTokens.super_admin as string}`)
      .expect(200);

    const hiddenProduct = await prisma.canteenProduct.findUnique({
      where: { id: productId as string },
      select: { isActive: true },
    });
    expect(hiddenProduct).toEqual({ isActive: false });

    const catalogResponse = await request(server)
      .get('/api/v1/canteen/catalog')
      .set('Authorization', `Bearer ${accessTokens.admin as string}`)
      .expect(200);

    const categories = (catalogResponse.body?.data ?? []) as Array<{
      id: string;
      products: Array<{ id: string }>;
    }>;
    const category = categories.find((item) => item.id === categoryId);
    expect(category?.products.some((item) => item.id === productId)).toBe(false);
  });

  it('restricts canteen category delete to admin and super_admin and keeps soft-delete behavior', async () => {
    const suffix = Date.now();
    const categoryResponse = await request(server)
      .post('/api/v1/canteen/categories')
      .set('Authorization', `Bearer ${accessTokens.super_admin as string}`)
      .send({
        name: `Delete Category ${suffix}`,
        description: 'Category delete e2e.',
      })
      .expect(201);

    const categoryId = categoryResponse.body?.data?.id as string | undefined;
    expect(categoryId).toBeTruthy();

    await request(server)
      .delete(`/api/v1/canteen/categories/${encodeURIComponent(categoryId as string)}`)
      .set('Authorization', `Bearer ${accessTokens.canteen_admin as string}`)
      .expect(403);

    await request(server)
      .delete(`/api/v1/canteen/categories/${encodeURIComponent(categoryId as string)}`)
      .set('Authorization', `Bearer ${accessTokens.admin as string}`)
      .expect(200);

    const hiddenCategory = await prisma.canteenCategory.findUnique({
      where: { id: categoryId as string },
      select: { isActive: true },
    });
    expect(hiddenCategory).toEqual({ isActive: false });

    const catalogResponse = await request(server)
      .get('/api/v1/canteen/catalog')
      .set('Authorization', `Bearer ${accessTokens.super_admin as string}`)
      .expect(200);

    const categories = (catalogResponse.body?.data ?? []) as Array<{ id: string }>;
    expect(categories.some((item) => item.id === categoryId)).toBe(false);
  });

  it('prevents double-booking in concurrent room booking requests', async () => {
    const qcBookingTitle = 'Concurrent booking test';
    const qcContactName = 'QC E2E';

    const buildingsRes = await request(server)
      .get('/api/v1/room-bookings/buildings')
      .expect(200);
    const firstBuildingCode = buildingsRes.body?.data?.[0]?.id as string | undefined;
    expect(firstBuildingCode).toBeTruthy();

    const roomsRes = await request(server)
      .get(`/api/v1/room-bookings/buildings/${encodeURIComponent(firstBuildingCode as string)}/rooms`)
      .expect(200);
    const roomCode = roomsRes.body?.data?.[0]?.roomCode as string | undefined;
    expect(roomCode).toBeTruthy();

    const scheduleRes = await request(server)
      .get(`/api/v1/room-bookings/rooms/${encodeURIComponent(roomCode as string)}/schedule`)
      .expect(200);

    const room = await prisma.room.findFirst({
      where: { roomCode: roomCode as string },
      select: { id: true },
    });
    expect(room?.id).toBeTruthy();

    const staleBookings = await prisma.roomBooking.findMany({
      where: {
        roomId: room?.id as string,
        title: qcBookingTitle,
        contactName: qcContactName,
        status: 'pending',
      },
      select: {
        id: true,
      },
    });

    const stalePendingBookingIds = staleBookings.map((booking) => booking.id);

    if (stalePendingBookingIds.length > 0) {
      await prisma.roomBookingSlot.deleteMany({
        where: {
          bookingId: {
            in: stalePendingBookingIds,
          },
        },
      });
      await prisma.roomBooking.deleteMany({
        where: {
          id: {
            in: stalePendingBookingIds,
          },
        },
      });
    }

    const scheduleDateKeys = (scheduleRes.body?.data?.days ?? [])
      .map((day: { dateKey?: string }) => day.dateKey)
      .filter((dateKey: string | undefined): dateKey is string => Boolean(dateKey));

    const conflictingSlots = await prisma.roomBookingSlot.findMany({
      where: {
        roomId: room?.id as string,
        bookingDate: {
          in: scheduleDateKeys.map((dateKey) => new Date(`${dateKey}T00:00:00.000Z`)),
        },
        booking: {
          status: {
            in: ['pending', 'approved', 'booked', 'maintenance'],
          },
        },
      },
      select: {
        bookingDate: true,
        timeSlotId: true,
      },
    });

    const conflictingSlotKeys = new Set(
      conflictingSlots.map(
        (slot) => `${slot.bookingDate.toISOString().slice(0, 10)}:${slot.timeSlotId}`,
      ),
    );

    const conflictFreeSlot = (scheduleRes.body?.data?.days ?? [])
      .flatMap((day: { dateKey?: string; slots?: Array<{ timeSlotId?: string }> }) =>
        (day.slots ?? []).map((slot) => ({
          bookingDate: day.dateKey,
          timeSlotId: slot.timeSlotId,
        })),
      )
      .find(
        (slot: { bookingDate?: string; timeSlotId?: string }) =>
          Boolean(slot.bookingDate) &&
          Boolean(slot.timeSlotId) &&
          !conflictingSlotKeys.has(`${slot.bookingDate}:${slot.timeSlotId}`),
      );

    expect(conflictFreeSlot?.bookingDate).toBeTruthy();
    expect(conflictFreeSlot?.timeSlotId).toBeTruthy();

    const payload = {
      roomCode,
      bookingDate: conflictFreeSlot?.bookingDate as string,
      timeSlotIds: [conflictFreeSlot?.timeSlotId as string],
      purpose: 'Concurrent booking QC',
      contactName: qcContactName,
      title: qcBookingTitle,
    };

    const [first, second] = await Promise.all([
      request(server)
        .post('/api/v1/room-bookings')
        .set('Authorization', `Bearer ${accessTokens.student as string}`)
        .send(payload),
      request(server)
        .post('/api/v1/room-bookings')
        .set('Authorization', `Bearer ${accessTokens.student as string}`)
        .send(payload),
    ]);

    const statuses = [first.status, second.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409]);

    const successfulResponse = [first, second].find((response) => response.status === 201);
    const createdBookingId = successfulResponse?.body?.data?.id ?? successfulResponse?.body?.id;

    if (createdBookingId) {
      await request(server)
        .patch(`/api/v1/room-bookings/${encodeURIComponent(createdBookingId)}/cancel`)
        .set('Authorization', `Bearer ${accessTokens.student as string}`)
        .expect(200);
    }
  });
});
