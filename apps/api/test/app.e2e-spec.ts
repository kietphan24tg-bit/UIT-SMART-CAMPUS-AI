import { RequestMethod, ValidationPipe, type INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { API_PREFIX } from '@smart-campus/shared';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

jest.setTimeout(180_000);

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
  let server: any;
  const accessTokens: Partial<Record<SeedRole, string>> = {};

  beforeAll(async () => {
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
    await app.close();
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
      slug: `qc-category-${Date.now()}`,
      description: 'Danh mục tạo từ e2e role matrix.',
    };

    const managerRoles: SeedRole[] = ['canteen_admin', 'admin', 'super_admin'];
    const consumerRoles: SeedRole[] = ['student', 'lecturer'];

    for (const role of managerRoles) {
      await request(server)
        .post('/api/v1/canteen/categories')
        .set('Authorization', `Bearer ${accessTokens[role] as string}`)
        .send({ ...samplePayload, slug: `${samplePayload.slug}-${role}` })
        .expect(201);
    }

    for (const role of consumerRoles) {
      await request(server)
        .post('/api/v1/canteen/categories')
        .set('Authorization', `Bearer ${accessTokens[role] as string}`)
        .send({ ...samplePayload, slug: `${samplePayload.slug}-${role}-deny` })
        .expect(403);
    }
  });

  it('prevents double-booking in concurrent room booking requests', async () => {
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
    const timeSlotId = scheduleRes.body?.data?.days?.[0]?.slots?.[0]?.timeSlotId as string | undefined;
    expect(timeSlotId).toBeTruthy();

    const bookingDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const payload = {
      roomCode,
      bookingDate,
      timeSlotIds: [timeSlotId],
      purpose: 'Kiểm thử đồng thời QC',
      contactName: 'QC E2E',
      title: 'Concurrent booking test',
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
  });
});
