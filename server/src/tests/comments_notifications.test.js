import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Team from '../src/models/Team.js';
import Project from '../src/models/Project.js';
import Task from '../src/models/Task.js';
import Comment from '../src/models/Comment.js';
import ActivityLog from '../src/models/ActivityLog.js';
import Notification from '../src/models/Notification.js';
import { generateToken } from '../src/utils/jwt.js';
import { ROLES, TASK_STATUS, TASK_PRIORITY, PROJECT_STATUS, ACTION_TYPES, NOTIFICATION_TYPES } from '../src/constants/index.js';

const MONGODB_TEST_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/actowiz_task_manager';

test.before(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_TEST_URI);
  }
});

test.after(async () => {
  await Comment.deleteMany({});
  await ActivityLog.deleteMany({});
  await Notification.deleteMany({});
  await Task.deleteMany({ title: /^Phase6Task/ });
  await Project.deleteMany({ name: /^Phase6Proj/ });
  await User.deleteMany({ email: /@phase6test\.com$/ });
  await Team.deleteMany({ name: /^Phase6Team/ });
  await mongoose.disconnect();
});

test.describe('Phase 6: Comments, Activity History & Notifications Tests', () => {
  let adminUser, adminToken;
  let managerUser1, managerToken1, team1, project1;
  let managerUser2, managerToken2, team2, project2;
  let employeeUser1, employeeToken1;
  let employeeUser2, employeeToken2;
  let task1, task2;

  test.beforeEach(async () => {
    await Comment.deleteMany({});
    await ActivityLog.deleteMany({});
    await Notification.deleteMany({});
    await Task.deleteMany({ title: /^Phase6Task/ });
    await Project.deleteMany({ name: /^Phase6Proj/ });
    await User.deleteMany({ email: /@phase6test\.com$/ });
    await Team.deleteMany({ name: /^Phase6Team/ });

    adminUser = await User.create({
      name: 'Phase6 Admin',
      email: 'admin@phase6test.com',
      password: 'Password123!',
      role: ROLES.ADMIN,
      isActive: true
    });
    adminToken = generateToken({ id: adminUser._id, role: adminUser.role, team: null });

    managerUser1 = await User.create({
      name: 'Manager Six-1',
      email: 'm1@phase6test.com',
      password: 'Password123!',
      role: ROLES.MANAGER,
      isActive: true
    });
    team1 = await Team.create({
      name: 'Phase6Team Alpha',
      description: 'Alpha team',
      manager: managerUser1._id
    });
    await User.findByIdAndUpdate(managerUser1._id, { team: team1._id });
    managerToken1 = generateToken({ id: managerUser1._id, role: managerUser1.role, team: team1._id });

    managerUser2 = await User.create({
      name: 'Manager Six-2',
      email: 'm2@phase6test.com',
      password: 'Password123!',
      role: ROLES.MANAGER,
      isActive: true
    });
    team2 = await Team.create({
      name: 'Phase6Team Beta',
      description: 'Beta team',
      manager: managerUser2._id
    });
    await User.findByIdAndUpdate(managerUser2._id, { team: team2._id });
    managerToken2 = generateToken({ id: managerUser2._id, role: managerUser2.role, team: team2._id });

    employeeUser1 = await User.create({
      name: 'Emp Six-1',
      email: 'e1@phase6test.com',
      password: 'Password123!',
      role: ROLES.EMPLOYEE,
      isActive: true,
      team: team1._id
    });
    employeeToken1 = generateToken({ id: employeeUser1._id, role: employeeUser1.role, team: team1._id });

    employeeUser2 = await User.create({
      name: 'Emp Six-2',
      email: 'e2@phase6test.com',
      password: 'Password123!',
      role: ROLES.EMPLOYEE,
      isActive: true,
      team: team2._id
    });
    employeeToken2 = generateToken({ id: employeeUser2._id, role: employeeUser2.role, team: team2._id });

    project1 = await Project.create({
      name: 'Phase6Proj Alpha',
      description: 'Alpha project',
      clientName: 'Phase6 Client Alpha',
      team: team1._id,
      createdBy: managerUser1._id,
      status: PROJECT_STATUS.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    project2 = await Project.create({
      name: 'Phase6Proj Beta',
      description: 'Beta project',
      clientName: 'Phase6 Client Beta',
      team: team2._id,
      createdBy: managerUser2._id,
      status: PROJECT_STATUS.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    task1 = await Task.create({
      title: 'Phase6Task Assigned to Emp1',
      description: 'Task for employee 1',
      project: project1._id,
      team: team1._id,
      assignee: employeeUser1._id,
      createdBy: managerUser1._id,
      status: TASK_STATUS.TO_DO,
      priority: TASK_PRIORITY.HIGH,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    });

    task2 = await Task.create({
      title: 'Phase6Task Assigned to Emp2',
      description: 'Task for employee 2',
      project: project2._id,
      team: team2._id,
      assignee: employeeUser2._id,
      createdBy: managerUser2._id,
      status: TASK_STATUS.TO_DO,
      priority: TASK_PRIORITY.MEDIUM,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
    });
  });

  test('Employee can comment on their assigned task (201)', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const res = await fetch(`http://localhost:${port}/api/tasks/${task1._id}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${employeeToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: 'I have started reviewing the requirements.' })
    });

    assert.equal(res.status, 201);
    const comment = await res.json();
    assert.equal(comment.content, 'I have started reviewing the requirements.');
    assert.equal(String(comment.author._id || comment.author), String(employeeUser1._id));
    assert.equal(String(comment.task), String(task1._id));

    const listRes = await fetch(`http://localhost:${port}/api/tasks/${task1._id}/comments`, {
      headers: { Authorization: `Bearer ${employeeToken1}` }
    });
    assert.equal(listRes.status, 200);
    const commentsList = await listRes.json();
    assert.equal(commentsList.length, 1);
    assert.equal(commentsList[0].content, 'I have started reviewing the requirements.');

    server.close();
  });

  test('Employee cannot comment on or view comments of another task (403)', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const postRes = await fetch(`http://localhost:${port}/api/tasks/${task2._id}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${employeeToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: 'Attempting unauthorized comment' })
    });
    assert.equal(postRes.status, 403);

    const getRes = await fetch(`http://localhost:${port}/api/tasks/${task2._id}/comments`, {
      headers: { Authorization: `Bearer ${employeeToken1}` }
    });
    assert.equal(getRes.status, 403);

    server.close();
  });

  test('Manager can comment on tasks within their team, but gets 403 on other teams', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const ownTeamRes = await fetch(`http://localhost:${port}/api/tasks/${task1._id}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${managerToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: 'Please ensure test cases are covered.' })
    });
    assert.equal(ownTeamRes.status, 201);

    const otherTeamRes = await fetch(`http://localhost:${port}/api/tasks/${task2._id}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${managerToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: 'Intruding on team 2 task' })
    });
    assert.equal(otherTeamRes.status, 403);

    server.close();
  });

  test('Admin can comment on any task and empty comment is rejected with 400', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const emptyRes = await fetch(`http://localhost:${port}/api/tasks/${task1._id}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: '   ' })
    });
    assert.equal(emptyRes.status, 400);

    const validRes = await fetch(`http://localhost:${port}/api/tasks/${task2._id}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: 'Executive oversight note.' })
    });
    assert.equal(validRes.status, 201);

    server.close();
  });

  test('Task creation, status updates, and comments record audit Activity logs', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const createRes = await fetch(`http://localhost:${port}/api/tasks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${managerToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Phase6Task With Audit Log',
        description: 'Testing audit activity trail',
        project: project1._id,
        assignee: employeeUser1._id,
        priority: TASK_PRIORITY.HIGH,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      })
    });
    assert.equal(createRes.status, 201);
    const createData = await createRes.json();
    const createdTask = createData.task;

    await fetch(`http://localhost:${port}/api/tasks/${createdTask._id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${employeeToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: TASK_STATUS.IN_PROGRESS })
    });

    await fetch(`http://localhost:${port}/api/tasks/${createdTask._id}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${employeeToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: 'Working on implementation.' })
    });

    const actRes = await fetch(`http://localhost:${port}/api/tasks/${createdTask._id}/activities`, {
      headers: { Authorization: `Bearer ${employeeToken1}` }
    });
    assert.equal(actRes.status, 200);
    const activities = await actRes.json();

    assert.ok(activities.length >= 3);
    const actions = activities.map((a) => a.action);
    assert.ok(actions.includes(ACTION_TYPES.CREATED));
    assert.ok(actions.includes(ACTION_TYPES.STATUS_CHANGED));
    assert.ok(actions.includes(ACTION_TYPES.COMMENT_ADDED));

    server.close();
  });

  test('Task workflow generates notifications, unread count, and mark-as-read works', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const createRes = await fetch(`http://localhost:${port}/api/tasks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${managerToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Phase6Task Notification Workflow',
        description: 'Testing notifications workflow',
        project: project1._id,
        assignee: employeeUser1._id,
        priority: TASK_PRIORITY.URGENT,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      })
    });
    assert.equal(createRes.status, 201);
    const task = await createRes.json();

    const empNotifRes = await fetch(`http://localhost:${port}/api/notifications`, {
      headers: { Authorization: `Bearer ${employeeToken1}` }
    });
    assert.equal(empNotifRes.status, 200);
    const empData = await empNotifRes.json();
    assert.ok(empData.unreadCount >= 1);
    const assignedNotif = empData.notifications.find((n) => n.type === NOTIFICATION_TYPES.TASK_ASSIGNED);
    assert.ok(assignedNotif);
    assert.equal(assignedNotif.isRead, false);

    const markRes = await fetch(`http://localhost:${port}/api/notifications/${assignedNotif._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${employeeToken1}` }
    });
    assert.equal(markRes.status, 200);
    const updatedNotif = await markRes.json();
    assert.equal(updatedNotif.isRead, true);

    const markAllRes = await fetch(`http://localhost:${port}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${employeeToken1}` }
    });
    assert.equal(markAllRes.status, 200);

    const empAfterRes = await fetch(`http://localhost:${port}/api/notifications`, {
      headers: { Authorization: `Bearer ${employeeToken1}` }
    });
    const empAfterData = await empAfterRes.json();
    assert.equal(empAfterData.unreadCount, 0);

    server.close();
  });

  test('Due soon reminder scanner detects tasks due within 24 hours and prevents duplicates', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    const dueSoonTask = await Task.create({
      title: 'Phase6Task Urgent Due Soon',
      description: 'Due in 6 hours',
      project: project1._id,
      team: team1._id,
      assignee: employeeUser1._id,
      createdBy: managerUser1._id,
      status: TASK_STATUS.IN_PROGRESS,
      priority: TASK_PRIORITY.HIGH,
      dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
      dueSoonAlertSent: false
    });

    const triggerRes1 = await fetch(`http://localhost:${port}/api/notifications/check-due-soon`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(triggerRes1.status, 200);
    const triggerData1 = await triggerRes1.json();
    assert.ok(triggerData1.generatedCount >= 1);

    const refreshedTask = await Task.findById(dueSoonTask._id);
    assert.equal(refreshedTask.dueSoonAlertSent, true);

    const triggerRes2 = await fetch(`http://localhost:${port}/api/notifications/check-due-soon`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(triggerRes2.status, 200);
    const triggerData2 = await triggerRes2.json();
    assert.equal(triggerData2.generatedCount, 0);

    const notifs = await Notification.find({
      recipient: employeeUser1._id,
      type: NOTIFICATION_TYPES.TASK_DUE_SOON
    });
    assert.equal(notifs.length, 1);

    server.close();
  });
});
