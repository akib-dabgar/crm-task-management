import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import ActivityLog from '../models/ActivityLog.js';
import Notification from '../models/Notification.js';
import {
  ROLES,
  TASK_STATUS,
  TASK_PRIORITY,
  PROJECT_STATUS,
  ACTION_TYPES,
  NOTIFICATION_TYPES
} from '../constants/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/actowiz_task_manager';

export const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    console.log('Clearing existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      Team.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      Comment.deleteMany({}),
      ActivityLog.deleteMany({}),
      Notification.deleteMany({})
    ]);

    console.log('Seeding Users...');
    const adminUser = await User.create({
      name: 'Actowiz Admin',
      email: 'admin@actowiz.com',
      password: 'Admin@123',
      role: ROLES.ADMIN,
      isActive: true
    });

    const managerAlpha = await User.create({
      name: 'Sarah Jenkins',
      email: 'manager.alpha@actowiz.com',
      password: 'Manager@123',
      role: ROLES.MANAGER,
      isActive: true
    });

    const managerBeta = await User.create({
      name: 'David Chen',
      email: 'manager.beta@actowiz.com',
      password: 'Manager@123',
      role: ROLES.MANAGER,
      isActive: true
    });

    const empAlpha1 = await User.create({
      name: 'Alex Rivera',
      email: 'emp.alpha1@actowiz.com',
      password: 'Employee@123',
      role: ROLES.EMPLOYEE,
      isActive: true
    });

    const empAlpha2 = await User.create({
      name: 'Maya Patel',
      email: 'emp.alpha2@actowiz.com',
      password: 'Employee@123',
      role: ROLES.EMPLOYEE,
      isActive: true
    });

    const empBeta1 = await User.create({
      name: 'Liam Torres',
      email: 'emp.beta1@actowiz.com',
      password: 'Employee@123',
      role: ROLES.EMPLOYEE,
      isActive: true
    });

    console.log('Seeding Teams...');
    const teamAlpha = await Team.create({
      name: 'Team Alpha',
      description: 'Core Engineering, CRM Platforms & Architecture Pod',
      manager: managerAlpha._id
    });

    const teamBeta = await Team.create({
      name: 'Team Beta',
      description: 'Growth, Enterprise Integrations & Analytics Pod',
      manager: managerBeta._id
    });

    await Promise.all([
      User.findByIdAndUpdate(managerAlpha._id, { team: teamAlpha._id }),
      User.findByIdAndUpdate(empAlpha1._id, { team: teamAlpha._id }),
      User.findByIdAndUpdate(empAlpha2._id, { team: teamAlpha._id }),
      User.findByIdAndUpdate(managerBeta._id, { team: teamBeta._id }),
      User.findByIdAndUpdate(empBeta1._id, { team: teamBeta._id })
    ]);

    console.log('Seeding Projects...');
    const now = new Date();

    const projAlpha1 = await Project.create({
      name: 'Actowiz CRM Web Platform',
      description: 'Role-based CRM web application for enterprise task delegation and team tracking',
      clientName: 'Actowiz Solutions Internal',
      team: teamAlpha._id,
      createdBy: managerAlpha._id,
      status: PROJECT_STATUS.ACTIVE,
      startDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)
    });

    const projAlpha2 = await Project.create({
      name: 'Real-time Event Engine',
      description: 'Audit history logging and notification dispatch service',
      clientName: 'Platform Core',
      team: teamAlpha._id,
      createdBy: managerAlpha._id,
      status: PROJECT_STATUS.ACTIVE,
      startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    });

    const projBeta1 = await Project.create({
      name: 'Enterprise Analytics Dashboard',
      description: 'Cross-pod metrics, member workload distribution, and executive KPI reporting',
      clientName: 'FinTech Global Partners',
      team: teamBeta._id,
      createdBy: managerBeta._id,
      status: PROJECT_STATUS.ACTIVE,
      startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    });

    console.log('Seeding Tasks across all statuses...');
    const task1 = await Task.create({
      title: 'Design RBAC Role Hierarchy & Security Matrix',
      description: 'Document and implement permission checks for Admin, Manager, and Employee roles',
      project: projAlpha1._id,
      team: teamAlpha._id,
      assignee: empAlpha1._id,
      createdBy: managerAlpha._id,
      status: TASK_STATUS.DONE,
      priority: TASK_PRIORITY.URGENT,
      dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    });

    const task2 = await Task.create({
      title: 'Implement Task State Workflow & Permission Gates',
      description: 'State machine for To Do -> In Progress -> In Review -> Done transitions with Manager review gates',
      project: projAlpha1._id,
      team: teamAlpha._id,
      assignee: empAlpha1._id,
      createdBy: managerAlpha._id,
      status: TASK_STATUS.IN_REVIEW,
      priority: TASK_PRIORITY.HIGH,
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    });

    const task3 = await Task.create({
      title: 'Build Interactive Kanban Board & List Filter View',
      description: 'Support drag/click column transitions with search, priority, project, and overdue filters',
      project: projAlpha1._id,
      team: teamAlpha._id,
      assignee: empAlpha2._id,
      createdBy: managerAlpha._id,
      status: TASK_STATUS.IN_PROGRESS,
      priority: TASK_PRIORITY.MEDIUM,
      dueDate: new Date(now.getTime() + 16 * 60 * 60 * 1000),
      dueSoonAlertSent: true
    });

    const task4 = await Task.create({
      title: 'Refactor Mongoose Repositories & Audit Activity Log',
      description: 'Decouple business logic from database layer and enforce review rejection feedback',
      project: projAlpha1._id,
      team: teamAlpha._id,
      assignee: empAlpha2._id,
      createdBy: managerAlpha._id,
      status: TASK_STATUS.IN_PROGRESS,
      priority: TASK_PRIORITY.HIGH,
      dueDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      reviewReason: 'Please add compound indexes for team and status before final signoff.'
    });

    const task5 = await Task.create({
      title: 'Draft End-to-End API Documentation & Seed Guide',
      description: 'Compile setup instructions, test execution walkthroughs, and architecture diagrams',
      project: projAlpha1._id,
      team: teamAlpha._id,
      assignee: empAlpha1._id,
      createdBy: managerAlpha._id,
      status: TASK_STATUS.TO_DO,
      priority: TASK_PRIORITY.LOW,
      dueDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000)
    });

    const task6 = await Task.create({
      title: 'Configure Notification Center & Unread Badge Counter',
      description: 'Header notification bell with mark-all-as-read and 24h deadline alert triggers',
      project: projAlpha2._id,
      team: teamAlpha._id,
      assignee: empAlpha2._id,
      createdBy: managerAlpha._id,
      status: TASK_STATUS.DONE,
      priority: TASK_PRIORITY.MEDIUM,
      dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    });

    const task7 = await Task.create({
      title: 'Build Role-Based Executive KPI Summary Cards',
      description: 'Overview dashboard with admin global metrics, manager review queue, and employee task view',
      project: projBeta1._id,
      team: teamBeta._id,
      assignee: empBeta1._id,
      createdBy: managerBeta._id,
      status: TASK_STATUS.IN_REVIEW,
      priority: TASK_PRIORITY.HIGH,
      dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
    });

    const task8 = await Task.create({
      title: 'Setup Member Workload & Task Distribution Analytics',
      description: 'Calculate active, completed, and overdue task counts per team member',
      project: projBeta1._id,
      team: teamBeta._id,
      assignee: empBeta1._id,
      createdBy: managerBeta._id,
      status: TASK_STATUS.IN_PROGRESS,
      priority: TASK_PRIORITY.MEDIUM,
      dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000)
    });

    console.log('Seeding Comments & Audit Activity Logs...');
    const comment1 = await Comment.create({
      task: task2._id,
      author: empAlpha1._id,
      content: 'I have finished implementing the state machine. All transitions are covered with automated tests. Ready for your review, Sarah!'
    });

    const comment2 = await Comment.create({
      task: task2._id,
      author: managerAlpha._id,
      content: 'Reviewing this now. The status checks look robust.'
    });

    const comment3 = await Comment.create({
      task: task4._id,
      author: managerAlpha._id,
      content: 'Returning to In Progress. Please add the compound indexes on task model before we merge.'
    });

    await ActivityLog.create([
      {
        task: task2._id,
        user: managerAlpha._id,
        action: ACTION_TYPES.CREATED,
        details: { title: task2.title, assignee: 'Alex Rivera' }
      },
      {
        task: task2._id,
        user: empAlpha1._id,
        action: ACTION_TYPES.STATUS_CHANGED,
        details: { from: TASK_STATUS.TO_DO, to: TASK_STATUS.IN_PROGRESS }
      },
      {
        task: task2._id,
        user: empAlpha1._id,
        action: ACTION_TYPES.STATUS_CHANGED,
        details: { from: TASK_STATUS.IN_PROGRESS, to: TASK_STATUS.IN_REVIEW }
      },
      {
        task: task2._id,
        user: empAlpha1._id,
        action: ACTION_TYPES.COMMENT_ADDED,
        details: { preview: comment1.content.slice(0, 60) }
      },
      {
        task: task4._id,
        user: managerAlpha._id,
        action: ACTION_TYPES.RETURNED_TO_IN_PROGRESS,
        details: {
          from: TASK_STATUS.IN_REVIEW,
          to: TASK_STATUS.IN_PROGRESS,
          reviewReason: 'Please add compound indexes for team and status before final signoff.'
        }
      }
    ]);

    console.log('Seeding In-App Notifications...');
    await Notification.create([
      {
        recipient: managerAlpha._id,
        task: task2._id,
        type: NOTIFICATION_TYPES.STATUS_UPDATED,
        message: 'Alex Rivera submitted "Implement Task State Workflow & Permission Gates" for review',
        isRead: false
      },
      {
        recipient: empAlpha2._id,
        task: task4._id,
        type: NOTIFICATION_TYPES.TASK_RETURNED,
        message: 'Sarah Jenkins requested changes on "Refactor Mongoose Repositories": Please add compound indexes for team and status before final signoff.',
        isRead: false
      },
      {
        recipient: empAlpha2._id,
        task: task3._id,
        type: NOTIFICATION_TYPES.TASK_DUE_SOON,
        message: 'Task "Build Interactive Kanban Board & List Filter View" is due within 24 hours',
        isRead: false
      },
      {
        recipient: empAlpha1._id,
        task: task1._id,
        type: NOTIFICATION_TYPES.STATUS_UPDATED,
        message: 'Sarah Jenkins approved and marked "Design RBAC Role Hierarchy & Security Matrix" as Done',
        isRead: true
      }
    ]);

    console.log('====================================================');
    console.log('Actowiz Task Manager Database Seed Completed Successfully!');
    console.log('====================================================');
    console.log('Demo Credentials:');
    console.log('  Admin:    admin@actowiz.com / Admin@123');
    console.log('  Manager:  manager.alpha@actowiz.com / Manager@123 (Team Alpha)');
    console.log('  Manager:  manager.beta@actowiz.com / Manager@123 (Team Beta)');
    console.log('  Employee: emp.alpha1@actowiz.com / Employee@123 (Team Alpha)');
    console.log('  Employee: emp.alpha2@actowiz.com / Employee@123 (Team Alpha)');
    console.log('  Employee: emp.beta1@actowiz.com / Employee@123 (Team Beta)');
    console.log('====================================================');

    if (process.env.NODE_ENV !== 'test') {
      await mongoose.disconnect();
    }
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}

export default seedDatabase;
