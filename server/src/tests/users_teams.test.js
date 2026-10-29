import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Team from '../src/models/Team.js';
import { generateToken } from '../src/utils/jwt.js';
import { ROLES } from '../src/constants/index.js';

const MONGODB_TEST_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/actowiz_task_manager';

test.before(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_TEST_URI);
  }
});

test.after(async () => {
  await User.deleteMany({ email: /@phase3test\.com$/ });
  await Team.deleteMany({ name: /^Phase3Team/ });
  await mongoose.disconnect();
});

test.describe('Phase 3: User & Team Management (Admin Only)', () => {
  let adminUser;
  let adminToken;
  let managerUser1;
  let managerToken1;
  let managerUser2;
  let employeeUser1;
  let employeeToken1;
  let employeeUser2;
  let createdTeam;

  test.beforeEach(async () => {
    await User.deleteMany({ email: /@phase3test\.com$/ });
    await Team.deleteMany({ name: /^Phase3Team/ });

    adminUser = await User.create({
      name: 'Phase3 Admin',
      email: 'admin@phase3test.com',
      password: 'Password123!',
      role: ROLES.ADMIN,
      isActive: true
    });
    adminToken = generateToken({ id: adminUser._id, role: adminUser.role, team: null });

    managerUser1 = await User.create({
      name: 'Manager One',
      email: 'm1@phase3test.com',
      password: 'Password123!',
      role: ROLES.MANAGER,
      isActive: true
    });
    managerToken1 = generateToken({ id: managerUser1._id, role: managerUser1.role, team: null });

    managerUser2 = await User.create({
      name: 'Manager Two',
      email: 'm2@phase3test.com',
      password: 'Password123!',
      role: ROLES.MANAGER,
      isActive: true
    });

    employeeUser1 = await User.create({
      name: 'Employee One',
      email: 'e1@phase3test.com',
      password: 'Password123!',
      role: ROLES.EMPLOYEE,
      isActive: true
    });
    employeeToken1 = generateToken({ id: employeeUser1._id, role: employeeUser1.role, team: null });

    employeeUser2 = await User.create({
      name: 'Employee Two',
      email: 'e2@phase3test.com',
      password: 'Password123!',
      role: ROLES.EMPLOYEE,
      isActive: true
    });
  });

  test('Non-Admin (Manager/Employee) gets 403 Forbidden accessing User Management routes', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const resEmp = await fetch(`http://localhost:${port}/api/users`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${employeeToken1}` }
    });
    assert.equal(resEmp.status, 403);

    const resMgr = await fetch(`http://localhost:${port}/api/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${managerToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'New Emp',
        email: 'newemp@phase3test.com',
        password: 'Password123!',
        role: ROLES.EMPLOYEE
      })
    });
    assert.equal(resMgr.status, 403);

    server.close();
  });

  test('Admin can create a new user with valid schema', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const res = await fetch(`http://localhost:${port}/api/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Carlos Mendez',
        email: 'carlos@phase3test.com',
        password: 'SecurePass123!',
        role: ROLES.EMPLOYEE
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.user.email, 'carlos@phase3test.com');
    assert.equal(data.user.role, ROLES.EMPLOYEE);
    assert.equal(data.user.password, undefined);

    const duplicateRes = await fetch(`http://localhost:${port}/api/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Carlos Again',
        email: 'carlos@phase3test.com',
        password: 'SecurePass123!',
        role: ROLES.EMPLOYEE
      })
    });
    assert.equal(duplicateRes.status, 400);

    server.close();
  });

  test('Admin can list users with query filters', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const res = await fetch(`http://localhost:${port}/api/users?role=${ROLES.MANAGER}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const managers = await res.json();
    const phase3Managers = managers.filter((m) => m.email.endsWith('@phase3test.com'));
    assert.equal(phase3Managers.length, 2);
    assert.ok(phase3Managers.every((m) => m.role === ROLES.MANAGER));

    const searchRes = await fetch(`http://localhost:${port}/api/users?search=Manager%20One`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(searchRes.status, 200);
    const searchData = await searchRes.json();
    assert.equal(searchData.length, 1);
    assert.equal(searchData[0].email, 'm1@phase3test.com');

    server.close();
  });

  test('Admin can create a team, setting manager and updating User.team', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const res = await fetch(`http://localhost:${port}/api/teams`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Phase3Team Alpha',
        description: 'Testing Alpha Team',
        manager: String(managerUser1._id),
        employeeIds: [String(employeeUser1._id), String(employeeUser2._id)]
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.team.name, 'Phase3Team Alpha');
    assert.equal(data.team.members.length, 2);

    const updatedManager = await User.findById(managerUser1._id);
    assert.equal(String(updatedManager.team), String(data.team._id));

    const updatedEmp1 = await User.findById(employeeUser1._id);
    assert.equal(String(updatedEmp1.team), String(data.team._id));

    server.close();
  });

  test('Cannot assign the same manager to multiple teams', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    await Team.create({
      name: 'Phase3Team Beta',
      description: 'First team',
      manager: managerUser1._id
    });

    const res = await fetch(`http://localhost:${port}/api/teams`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Phase3Team Gamma',
        description: 'Second team',
        manager: String(managerUser1._id)
      })
    });

    assert.equal(res.status, 400);
    const err = await res.json();
    assert.ok(err.error.includes('already assigned to another team'));

    server.close();
  });

  test('Cannot assign an Employee as a Team Manager', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const res = await fetch(`http://localhost:${port}/api/teams`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Phase3Team Delta',
        description: 'Invalid manager team',
        manager: String(employeeUser1._id)
      })
    });

    assert.equal(res.status, 400);
    const err = await res.json();
    assert.ok(err.error.includes('not a Manager'));

    server.close();
  });

  test('Admin can update team members and roster stays in sync with User.team', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const team = await Team.create({
      name: 'Phase3Team Epsilon',
      description: 'Initial',
      manager: managerUser1._id
    });
    await User.findByIdAndUpdate(employeeUser1._id, { team: team._id });
    await User.findByIdAndUpdate(employeeUser2._id, { team: team._id });

    const res = await fetch(`http://localhost:${port}/api/teams/${team._id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        employeeIds: [String(employeeUser2._id)]
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.team.members.length, 1);
    assert.equal(String(data.team.members[0]._id), String(employeeUser2._id));

    const emp1 = await User.findById(employeeUser1._id);
    assert.equal(emp1.team, null);

    const emp2 = await User.findById(employeeUser2._id);
    assert.equal(String(emp2.team), String(team._id));

    server.close();
  });

  test('Admin can toggle user active status and deactivated user is blocked', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const res = await fetch(`http://localhost:${port}/api/users/${employeeUser1._id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isActive: false })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user.isActive, false);

    const loginRes = await fetch(`http://localhost:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'e1@phase3test.com',
        password: 'Password123!'
      })
    });
    assert.equal(loginRes.status, 403);

    server.close();
  });
});
