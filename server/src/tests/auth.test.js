import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { ROLES } from '../src/constants/index.js';
import { generateToken } from '../src/utils/jwt.js';

describe('Phase 2 Authentication & RBAC Core Tests', () => {
  let server;
  const PORT = 5098;

  before(async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/actowiz_task_manager';
    await mongoose.connect(uri);

    await User.deleteMany({ email: { $in: ['admin.auth.test@actowiz.com', 'employee.auth.test@actowiz.com', 'deactivated.auth.test@actowiz.com'] } });

    await User.create([
      {
        name: 'Admin Test User',
        email: 'admin.auth.test@actowiz.com',
        password: 'Password123!',
        role: ROLES.ADMIN,
        isActive: true
      },
      {
        name: 'Employee Test User',
        email: 'employee.auth.test@actowiz.com',
        password: 'Password123!',
        role: ROLES.EMPLOYEE,
        isActive: true
      },
      {
        name: 'Deactivated User',
        email: 'deactivated.auth.test@actowiz.com',
        password: 'Password123!',
        role: ROLES.EMPLOYEE,
        isActive: false
      }
    ]);

    await new Promise((resolve) => {
      server = app.listen(PORT, resolve);
    });
  });

  after(async () => {
    await User.deleteMany({ email: { $in: ['admin.auth.test@actowiz.com', 'employee.auth.test@actowiz.com', 'deactivated.auth.test@actowiz.com'] } });
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  test('User model hashes password before saving', async () => {
    const user = await User.findOne({ email: 'admin.auth.test@actowiz.com' }).select('+password');
    assert.ok(user.password);
    assert.notEqual(user.password, 'Password123!');
    assert.ok(user.password.startsWith('$2'));

    const isMatch = await user.comparePassword('Password123!');
    assert.equal(isMatch, true);

    const isWrongMatch = await user.comparePassword('WrongPassword');
    assert.equal(isWrongMatch, false);
  });

  test('POST /api/auth/login succeeds with valid credentials', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin.auth.test@actowiz.com',
        password: 'Password123!'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.token);
    assert.equal(data.user.email, 'admin.auth.test@actowiz.com');
    assert.equal(data.user.role, ROLES.ADMIN);
    assert.equal(data.user.password, undefined);
  });

  test('POST /api/auth/login fails with invalid password', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin.auth.test@actowiz.com',
        password: 'IncorrectPassword'
      })
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.error, 'Invalid email or password');
  });

  test('POST /api/auth/login fails for deactivated user with 403', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'deactivated.auth.test@actowiz.com',
        password: 'Password123!'
      })
    });

    assert.equal(res.status, 403);
    const data = await res.json();
    assert.ok(data.error.includes('deactivated'));
  });

  test('GET /api/auth/me returns profile for valid token', async () => {
    const user = await User.findOne({ email: 'employee.auth.test@actowiz.com' });
    const token = generateToken({ id: user._id, role: user.role });

    const res = await fetch(`http://localhost:${PORT}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user.email, 'employee.auth.test@actowiz.com');
    assert.equal(data.user.role, ROLES.EMPLOYEE);
  });

  test('GET /api/auth/me rejects missing or invalid token with 401', async () => {
    const resNoToken = await fetch(`http://localhost:${PORT}/api/auth/me`);
    assert.equal(resNoToken.status, 401);

    const resBadToken = await fetch(`http://localhost:${PORT}/api/auth/me`, {
      headers: { Authorization: 'Bearer bad.token.here' }
    });
    assert.equal(resBadToken.status, 401);
  });

  test('Authenticate middleware blocks deactivated user token with 403', async () => {
    const deactivatedUser = await User.findOne({ email: 'deactivated.auth.test@actowiz.com' });
    const token = generateToken({ id: deactivatedUser._id, role: deactivatedUser.role });

    const res = await fetch(`http://localhost:${PORT}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.error, 'Account is deactivated');
  });

  test('POST /api/auth/logout succeeds for authenticated user', async () => {
    const user = await User.findOne({ email: 'admin.auth.test@actowiz.com' });
    const token = generateToken({ id: user._id, role: user.role });

    const res = await fetch(`http://localhost:${PORT}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.message, 'Logged out successfully');
  });
});
