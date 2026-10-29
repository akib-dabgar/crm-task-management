import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Team from '../src/models/Team.js';
import Project from '../src/models/Project.js';
import { generateToken } from '../src/utils/jwt.js';
import { ROLES, PROJECT_STATUS } from '../src/constants/index.js';

const MONGODB_TEST_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/actowiz_task_manager';

test.before(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_TEST_URI);
  }
});

test.after(async () => {
  await Project.deleteMany({ name: /^Phase4Proj/ });
  await User.deleteMany({ email: /@phase4test\.com$/ });
  await Team.deleteMany({ name: /^Phase4Team/ });
  await mongoose.disconnect();
});

test.describe('Phase 4: Project Management & Scoping Tests', () => {
  let adminUser, adminToken;
  let managerUser1, managerToken1, team1;
  let managerUser2, managerToken2, team2;
  let employeeUser1, employeeToken1;

  test.beforeEach(async () => {
    await Project.deleteMany({ name: /^Phase4Proj/ });
    await User.deleteMany({ email: /@phase4test\.com$/ });
    await Team.deleteMany({ name: /^Phase4Team/ });

    adminUser = await User.create({
      name: 'Phase4 Admin',
      email: 'admin@phase4test.com',
      password: 'Password123!',
      role: ROLES.ADMIN,
      isActive: true
    });
    adminToken = generateToken({ id: adminUser._id, role: adminUser.role, team: null });

    managerUser1 = await User.create({
      name: 'Manager One',
      email: 'm1@phase4test.com',
      password: 'Password123!',
      role: ROLES.MANAGER,
      isActive: true
    });

    team1 = await Team.create({
      name: 'Phase4Team Alpha',
      description: 'Alpha team',
      manager: managerUser1._id
    });
    await User.findByIdAndUpdate(managerUser1._id, { team: team1._id });
    managerToken1 = generateToken({ id: managerUser1._id, role: managerUser1.role, team: team1._id });

    managerUser2 = await User.create({
      name: 'Manager Two',
      email: 'm2@phase4test.com',
      password: 'Password123!',
      role: ROLES.MANAGER,
      isActive: true
    });

    team2 = await Team.create({
      name: 'Phase4Team Beta',
      description: 'Beta team',
      manager: managerUser2._id
    });
    await User.findByIdAndUpdate(managerUser2._id, { team: team2._id });
    managerToken2 = generateToken({ id: managerUser2._id, role: managerUser2.role, team: team2._id });

    employeeUser1 = await User.create({
      name: 'Employee One',
      email: 'e1@phase4test.com',
      password: 'Password123!',
      role: ROLES.EMPLOYEE,
      team: team1._id,
      isActive: true
    });
    employeeToken1 = generateToken({ id: employeeUser1._id, role: employeeUser1.role, team: team1._id });
  });

  test('Employee cannot create a project (403 Forbidden)', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const res = await fetch(`http://localhost:${port}/api/projects`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${employeeToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Phase4Proj Unauthorized',
        clientName: 'Acme Corp',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        team: String(team1._id)
      })
    });

    assert.equal(res.status, 403);
    server.close();
  });

  test('Manager can create a project for their own team', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 86400000);

    const res = await fetch(`http://localhost:${port}/api/projects`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${managerToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Phase4Proj Alpha CRM',
        description: 'CRM Project for Alpha',
        clientName: 'Global Logistics',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: PROJECT_STATUS.ACTIVE,
        team: String(team1._id)
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.project.name, 'Phase4Proj Alpha CRM');
    assert.equal(String(data.project.team._id || data.project.team), String(team1._id));
    assert.equal(data.project.progressPercentage, 0);

    server.close();
  });

  test('Manager cannot create a project for another team (403 Forbidden)', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const res = await fetch(`http://localhost:${port}/api/projects`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${managerToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Phase4Proj Trespass',
        clientName: 'Hostile Client',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        team: String(team2._id)
      })
    });

    assert.equal(res.status, 403);
    const err = await res.json();
    assert.ok(err.error.includes('own assigned team'));

    server.close();
  });

  test('Admin can create a project for any team', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const res = await fetch(`http://localhost:${port}/api/projects`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Phase4Proj Admin Created',
        clientName: 'Apex Inc',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 10 * 86400000).toISOString(),
        team: String(team2._id)
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.project.name, 'Phase4Proj Admin Created');
    assert.equal(String(data.project.team._id || data.project.team), String(team2._id));

    server.close();
  });

  test('Project creation rejects endDate earlier than startDate (400)', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const res = await fetch(`http://localhost:${port}/api/projects`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Phase4Proj Invalid Dates',
        clientName: 'Time Traveler Co',
        startDate: '2026-11-10T00:00:00.000Z',
        endDate: '2026-11-01T00:00:00.000Z',
        team: String(team1._id)
      })
    });

    assert.equal(res.status, 400);
    server.close();
  });

  test('Manager can view only their own team projects and is blocked from other teams (403)', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const proj1 = await Project.create({
      name: 'Phase4Proj Team1 Work',
      clientName: 'Client 1',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      team: team1._id,
      createdBy: managerUser1._id
    });

    const proj2 = await Project.create({
      name: 'Phase4Proj Team2 Work',
      clientName: 'Client 2',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      team: team2._id,
      createdBy: managerUser2._id
    });

    const resList = await fetch(`http://localhost:${port}/api/projects`, {
      headers: { Authorization: `Bearer ${managerToken1}` }
    });
    assert.equal(resList.status, 200);
    const projects = await resList.json();
    assert.equal(projects.length, 1);
    assert.equal(projects[0].name, 'Phase4Proj Team1 Work');

    const resAllowed = await fetch(`http://localhost:${port}/api/projects/${proj1._id}`, {
      headers: { Authorization: `Bearer ${managerToken1}` }
    });
    assert.equal(resAllowed.status, 200);

    const resForbidden = await fetch(`http://localhost:${port}/api/projects/${proj2._id}`, {
      headers: { Authorization: `Bearer ${managerToken1}` }
    });
    assert.equal(resForbidden.status, 403);

    server.close();
  });

  test('Employee can view their own team projects list', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    await Project.create({
      name: 'Phase4Proj Team1 For Employee',
      clientName: 'Client 1',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      team: team1._id,
      createdBy: managerUser1._id
    });

    const res = await fetch(`http://localhost:${port}/api/projects`, {
      headers: { Authorization: `Bearer ${employeeToken1}` }
    });
    assert.equal(res.status, 200);
    const projects = await res.json();
    assert.equal(projects.length, 1);
    assert.equal(projects[0].name, 'Phase4Proj Team1 For Employee');

    server.close();
  });

  test('Admin can list all projects across all teams', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    await Project.create({
      name: 'Phase4Proj Alpha Work',
      clientName: 'Client A',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      team: team1._id,
      createdBy: adminUser._id
    });

    await Project.create({
      name: 'Phase4Proj Beta Work',
      clientName: 'Client B',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      team: team2._id,
      createdBy: adminUser._id
    });

    const res = await fetch(`http://localhost:${port}/api/projects`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const projects = await res.json();
    const phase4Projects = projects.filter((p) => p.name.startsWith('Phase4Proj'));
    assert.equal(phase4Projects.length, 2);

    const resFiltered = await fetch(`http://localhost:${port}/api/projects?team=${team1._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(resFiltered.status, 200);
    const filtered = await resFiltered.json();
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].name, 'Phase4Proj Alpha Work');

    server.close();
  });
});
