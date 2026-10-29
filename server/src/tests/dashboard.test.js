import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Team from '../src/models/Team.js';
import Project from '../src/models/Project.js';
import Task from '../src/models/Task.js';
import { generateToken } from '../src/utils/jwt.js';
import { ROLES, TASK_STATUS, TASK_PRIORITY, PROJECT_STATUS } from '../src/constants/index.js';

const MONGODB_TEST_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/actowiz_task_manager';

test.before(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_TEST_URI);
  }
});

test.after(async () => {
  await Task.deleteMany({ title: /^Phase7Task/ });
  await Project.deleteMany({ name: /^Phase7Proj/ });
  await User.deleteMany({ email: /@phase7test\.com$/ });
  await Team.deleteMany({ name: /^Phase7Team/ });
  await mongoose.disconnect();
});

test.describe('Phase 7: Role-Based Dashboard & Analytics Tests', () => {
  let adminUser, adminToken;
  let managerUser1, managerToken1, team1, project1;
  let managerUserNoTeam, managerTokenNoTeam;
  let employeeUser1, employeeToken1;

  test.beforeEach(async () => {
    await Task.deleteMany({ title: /^Phase7Task/ });
    await Project.deleteMany({ name: /^Phase7Proj/ });
    await User.deleteMany({ email: /@phase7test\.com$/ });
    await Team.deleteMany({ name: /^Phase7Team/ });

    adminUser = await User.create({
      name: 'Phase7 Admin',
      email: 'admin@phase7test.com',
      password: 'Password123!',
      role: ROLES.ADMIN,
      isActive: true
    });
    adminToken = generateToken({ id: adminUser._id, role: adminUser.role, team: null });

    managerUser1 = await User.create({
      name: 'Manager Seven-1',
      email: 'm1@phase7test.com',
      password: 'Password123!',
      role: ROLES.MANAGER,
      isActive: true
    });
    team1 = await Team.create({
      name: 'Phase7Team Alpha',
      description: 'Alpha team',
      manager: managerUser1._id
    });
    await User.findByIdAndUpdate(managerUser1._id, { team: team1._id });
    managerToken1 = generateToken({ id: managerUser1._id, role: managerUser1.role, team: team1._id });

    managerUserNoTeam = await User.create({
      name: 'Manager Seven-NoTeam',
      email: 'mnoteam@phase7test.com',
      password: 'Password123!',
      role: ROLES.MANAGER,
      isActive: true
    });
    managerTokenNoTeam = generateToken({ id: managerUserNoTeam._id, role: managerUserNoTeam.role, team: null });

    employeeUser1 = await User.create({
      name: 'Emp Seven-1',
      email: 'e1@phase7test.com',
      password: 'Password123!',
      role: ROLES.EMPLOYEE,
      isActive: true,
      team: team1._id
    });
    employeeToken1 = generateToken({ id: employeeUser1._id, role: employeeUser1.role, team: team1._id });

    project1 = await Project.create({
      name: 'Phase7Proj Alpha',
      description: 'Alpha project',
      clientName: 'Phase7 Client',
      team: team1._id,
      createdBy: managerUser1._id,
      status: PROJECT_STATUS.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    await Task.create({
      title: 'Phase7Task In Review',
      description: 'Needs review',
      project: project1._id,
      team: team1._id,
      assignee: employeeUser1._id,
      createdBy: managerUser1._id,
      status: TASK_STATUS.IN_REVIEW,
      priority: TASK_PRIORITY.HIGH,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    });

    await Task.create({
      title: 'Phase7Task Done',
      description: 'Completed task',
      project: project1._id,
      team: team1._id,
      assignee: employeeUser1._id,
      createdBy: managerUser1._id,
      status: TASK_STATUS.DONE,
      priority: TASK_PRIORITY.MEDIUM,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
    });
  });

  test('GET /api/dashboard/stats rejects unauthenticated request with 401', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const res = await fetch(`http://localhost:${port}/api/dashboard/stats`);
    assert.equal(res.status, 401);

    server.close();
  });

  test('Admin receives global system metrics (users, teams, projects, tasks)', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const res = await fetch(`http://localhost:${port}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.role, ROLES.ADMIN);
    assert.ok(data.users.total >= 3);
    assert.ok(data.teams.total >= 1);
    assert.ok(data.projects.total >= 1);
    assert.ok(data.tasks.total >= 2);
    assert.ok(data.tasks.inReview >= 1);
    assert.ok(data.tasks.done >= 1);

    server.close();
  });

  test('Manager receives team-scoped metrics, review queue, and workload distribution', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const res = await fetch(`http://localhost:${port}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${managerToken1}` }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.role, ROLES.MANAGER);
    assert.equal(data.hasTeam, true);
    assert.equal(data.teamName, 'Phase7Team Alpha');
    assert.equal(data.tasks.total, 2);
    assert.equal(data.tasks.inReview, 1);
    assert.equal(data.pendingReviewTasks.length, 1);
    assert.equal(data.pendingReviewTasks[0].title, 'Phase7Task In Review');
    assert.ok(data.memberWorkload.length >= 1);
    assert.equal(data.memberWorkload[0].name, 'Emp Seven-1');
    assert.equal(data.memberWorkload[0].activeTasks, 1);
    assert.equal(data.memberWorkload[0].completedTasks, 1);

    server.close();
  });

  test('Manager without assigned team receives graceful empty state', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const res = await fetch(`http://localhost:${port}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${managerTokenNoTeam}` }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.role, ROLES.MANAGER);
    assert.equal(data.hasTeam, false);

    server.close();
  });

  test('Employee receives personalized task metrics and assigned task list', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const res = await fetch(`http://localhost:${port}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${employeeToken1}` }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.role, ROLES.EMPLOYEE);
    assert.equal(data.tasks.total, 2);
    assert.equal(data.tasks.inReview, 1);
    assert.equal(data.tasks.done, 1);
    assert.ok(Array.isArray(data.recentTasks));
    assert.equal(data.recentTasks.length, 2);

    server.close();
  });
});
