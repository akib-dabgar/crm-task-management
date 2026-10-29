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
  await Task.deleteMany({ title: /^Phase5Task/ });
  await Project.deleteMany({ name: /^Phase5Proj/ });
  await User.deleteMany({ email: /@phase5test\.com$/ });
  await Team.deleteMany({ name: /^Phase5Team/ });
  await mongoose.disconnect();
});

test.describe('Phase 5: Task Management & Status Workflow Tests', () => {
  let adminUser, adminToken;
  let managerUser1, managerToken1, team1, project1;
  let managerUser2, managerToken2, team2, project2;
  let employeeUser1, employeeToken1;
  let employeeUser2, employeeToken2;

  test.beforeEach(async () => {
    await Task.deleteMany({ title: /^Phase5Task/ });
    await Project.deleteMany({ name: /^Phase5Proj/ });
    await User.deleteMany({ email: /@phase5test\.com$/ });
    await Team.deleteMany({ name: /^Phase5Team/ });

    adminUser = await User.create({
      name: 'Phase5 Admin',
      email: 'admin@phase5test.com',
      password: 'Password123!',
      role: ROLES.ADMIN,
      isActive: true
    });
    adminToken = generateToken({ id: adminUser._id, role: adminUser.role, team: null });

    managerUser1 = await User.create({
      name: 'Manager One',
      email: 'm1@phase5test.com',
      password: 'Password123!',
      role: ROLES.MANAGER,
      isActive: true
    });
    team1 = await Team.create({
      name: 'Phase5Team Alpha',
      description: 'Alpha team',
      manager: managerUser1._id
    });
    await User.findByIdAndUpdate(managerUser1._id, { team: team1._id });
    managerToken1 = generateToken({ id: managerUser1._id, role: managerUser1.role, team: team1._id });

    managerUser2 = await User.create({
      name: 'Manager Two',
      email: 'm2@phase5test.com',
      password: 'Password123!',
      role: ROLES.MANAGER,
      isActive: true
    });
    team2 = await Team.create({
      name: 'Phase5Team Beta',
      description: 'Beta team',
      manager: managerUser2._id
    });
    await User.findByIdAndUpdate(managerUser2._id, { team: team2._id });
    managerToken2 = generateToken({ id: managerUser2._id, role: managerUser2.role, team: team2._id });

    employeeUser1 = await User.create({
      name: 'Employee One',
      email: 'e1@phase5test.com',
      password: 'Password123!',
      role: ROLES.EMPLOYEE,
      team: team1._id,
      isActive: true
    });
    employeeToken1 = generateToken({ id: employeeUser1._id, role: employeeUser1.role, team: team1._id });

    employeeUser2 = await User.create({
      name: 'Employee Two',
      email: 'e2@phase5test.com',
      password: 'Password123!',
      role: ROLES.EMPLOYEE,
      team: team2._id,
      isActive: true
    });
    employeeToken2 = generateToken({ id: employeeUser2._id, role: employeeUser2.role, team: team2._id });

    project1 = await Project.create({
      name: 'Phase5Proj Alpha Web',
      clientName: 'Client Alpha',
      startDate: new Date(),
      endDate: new Date(Date.now() + 10 * 86400000),
      status: PROJECT_STATUS.ACTIVE,
      team: team1._id,
      createdBy: managerUser1._id
    });

    project2 = await Project.create({
      name: 'Phase5Proj Beta Mobile',
      clientName: 'Client Beta',
      startDate: new Date(),
      endDate: new Date(Date.now() + 10 * 86400000),
      status: PROJECT_STATUS.ACTIVE,
      team: team2._id,
      createdBy: managerUser2._id
    });
  });

  test('Employee cannot create a task (403 Forbidden)', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const res = await fetch(`http://localhost:${port}/api/tasks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${employeeToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Phase5Task Unauthorized',
        project: String(project1._id),
        assignee: String(employeeUser1._id),
        dueDate: new Date(Date.now() + 86400000).toISOString()
      })
    });

    assert.equal(res.status, 403);
    server.close();
  });

  test('Manager can create a task for own team project with active team employee', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const dueDate = new Date(Date.now() + 3 * 86400000);

    const res = await fetch(`http://localhost:${port}/api/tasks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${managerToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Phase5Task Build Auth API',
        description: 'Implement JWT token endpoints',
        project: String(project1._id),
        assignee: String(employeeUser1._id),
        priority: TASK_PRIORITY.HIGH,
        dueDate: dueDate.toISOString()
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.task.title, 'Phase5Task Build Auth API');
    assert.equal(data.task.status, TASK_STATUS.TO_DO);
    assert.equal(String(data.task.team._id || data.task.team), String(team1._id));
    assert.equal(data.task.isOverdue, false);

    server.close();
  });

  test('Cannot assign a task to an employee from another team (400 Bad Request)', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const res = await fetch(`http://localhost:${port}/api/tasks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${managerToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Phase5Task Cross Assignment',
        project: String(project1._id),
        assignee: String(employeeUser2._id),
        dueDate: new Date(Date.now() + 86400000).toISOString()
      })
    });

    assert.equal(res.status, 400);
    const err = await res.json();
    assert.ok(err.error.includes('Assignee must belong to the project team'));

    server.close();
  });

  test('Employee can view only assigned tasks and receives 403 on non-assigned task', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const task1 = await Task.create({
      title: 'Phase5Task Assigned To Emp1',
      project: project1._id,
      team: team1._id,
      assignee: employeeUser1._id,
      dueDate: new Date(Date.now() + 86400000),
      createdBy: managerUser1._id
    });

    const task2 = await Task.create({
      title: 'Phase5Task Assigned To Emp2',
      project: project2._id,
      team: team2._id,
      assignee: employeeUser2._id,
      dueDate: new Date(Date.now() + 86400000),
      createdBy: managerUser2._id
    });

    const resList = await fetch(`http://localhost:${port}/api/tasks`, {
      headers: { Authorization: `Bearer ${employeeToken1}` }
    });
    assert.equal(resList.status, 200);
    const data = await resList.json();
    assert.equal(data.tasks.length, 1);
    assert.equal(data.tasks[0].title, 'Phase5Task Assigned To Emp1');

    const resForbidden = await fetch(`http://localhost:${port}/api/tasks/${task2._id}`, {
      headers: { Authorization: `Bearer ${employeeToken1}` }
    });
    assert.equal(resForbidden.status, 403);

    server.close();
  });

  test('Employee can advance task to In Progress and In Review, but cannot mark Done (403)', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const task = await Task.create({
      title: 'Phase5Task Lifecycle',
      project: project1._id,
      team: team1._id,
      assignee: employeeUser1._id,
      status: TASK_STATUS.TO_DO,
      dueDate: new Date(Date.now() + 86400000),
      createdBy: managerUser1._id
    });

    const resProgress = await fetch(`http://localhost:${port}/api/tasks/${task._id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${employeeToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: TASK_STATUS.IN_PROGRESS })
    });
    assert.equal(resProgress.status, 200);

    const resReview = await fetch(`http://localhost:${port}/api/tasks/${task._id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${employeeToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: TASK_STATUS.IN_REVIEW })
    });
    assert.equal(resReview.status, 200);

    const resDone = await fetch(`http://localhost:${port}/api/tasks/${task._id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${employeeToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: TASK_STATUS.DONE })
    });
    assert.equal(resDone.status, 403);

    server.close();
  });

  test('Manager can mark task Done from In Review', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const task = await Task.create({
      title: 'Phase5Task Awaiting Approval',
      project: project1._id,
      team: team1._id,
      assignee: employeeUser1._id,
      status: TASK_STATUS.IN_REVIEW,
      dueDate: new Date(Date.now() + 86400000),
      createdBy: managerUser1._id
    });

    const res = await fetch(`http://localhost:${port}/api/tasks/${task._id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${managerToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: TASK_STATUS.DONE })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.task.status, TASK_STATUS.DONE);

    server.close();
  });

  test('Manager moving In Review back to In Progress requires reviewReason (400 if missing)', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const task = await Task.create({
      title: 'Phase5Task Needs Work',
      project: project1._id,
      team: team1._id,
      assignee: employeeUser1._id,
      status: TASK_STATUS.IN_REVIEW,
      dueDate: new Date(Date.now() + 86400000),
      createdBy: managerUser1._id
    });

    const resFail = await fetch(`http://localhost:${port}/api/tasks/${task._id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${managerToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: TASK_STATUS.IN_PROGRESS })
    });
    assert.equal(resFail.status, 400);

    const resSuccess = await fetch(`http://localhost:${port}/api/tasks/${task._id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${managerToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: TASK_STATUS.IN_PROGRESS,
        reviewReason: 'Please add unit tests for edge cases.'
      })
    });
    assert.equal(resSuccess.status, 200);
    const data = await resSuccess.json();
    assert.equal(data.task.status, TASK_STATUS.IN_PROGRESS);
    assert.equal(data.task.reviewReason, 'Please add unit tests for edge cases.');

    server.close();
  });

  test('Overdue tasks are flagged with isOverdue: true when past dueDate and not Done', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const pastDate = new Date(Date.now() - 2 * 86400000);

    const task = await Task.create({
      title: 'Phase5Task Expired Deadline',
      project: project1._id,
      team: team1._id,
      assignee: employeeUser1._id,
      status: TASK_STATUS.IN_PROGRESS,
      dueDate: pastDate,
      createdBy: managerUser1._id
    });

    const res = await fetch(`http://localhost:${port}/api/tasks/${task._id}`, {
      headers: { Authorization: `Bearer ${managerToken1}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.isOverdue, true);

    const resFilter = await fetch(`http://localhost:${port}/api/tasks?isOverdue=true`, {
      headers: { Authorization: `Bearer ${managerToken1}` }
    });
    assert.equal(resFilter.status, 200);
    const listData = await resFilter.json();
    assert.ok(listData.tasks.some((t) => t.title === 'Phase5Task Expired Deadline'));

    server.close();
  });
});
