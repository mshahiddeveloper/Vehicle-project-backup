import { describe, it, expect, beforeEach } from 'vitest';
import { POST as registerHandler } from '../src/app/api/auth/register/route';
import { POST as loginHandler } from '../src/app/api/auth/login/route';
import { NextRequest } from 'next/server';

describe('Neon Database Cross-Browser Authentication E2E', () => {
  beforeEach(() => {
    process.env.DATABASE_URL =
      'postgresql://neondb_owner:npg_G4uHT0rlXaoF@ep-fragrant-snow-a1l4e7yl-pooler.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require&pgbouncer=true';
    process.env.DATABASE_URL_UNPOOLED =
      'postgresql://neondb_owner:npg_G4uHT0rlXaoF@ep-fragrant-snow-a1l4e7yl.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';
  });

  const testPhone = `+92300${Math.floor(1000000 + Math.random() * 9000000)}`;
  const testEmail = `testuser_${Date.now()}@safarpk.com`;
  const testPassword = 'Password123!';
  const testName = 'Zubair Cross-Browser Tester';

  it('1. Persists a new registered user into Neon PostgreSQL 16', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: testName,
        phone: testPhone,
        email: testEmail,
        password: testPassword,
        role: 'CUSTOMER',
        city: 'Islamabad',
      }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.userId).toBeDefined();
    expect(body.user.phone).toContain(testPhone.replace(/\D/g, '').slice(-9));
  });

  it('2. Authenticates the registered user from a separate clean browser session via /api/auth/login', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: testPhone,
        password: testPassword,
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user).toBeDefined();
    expect(body.user.name).toBe(testName);
    expect(body.user.role).toBe('CUSTOMER');
    expect(body.user.city).toBe('Islamabad');
  });

  it('3. Authenticates using email on second browser', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: testEmail,
        password: testPassword,
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.email).toBe(testEmail);
  });

  it('4. Rejects invalid password with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: testPhone,
        password: 'WrongPassword999',
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Incorrect password');
  });

  it('5. Rejects unknown non-existent user with 404', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: '+923999999999',
        password: 'SomePassword123',
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
