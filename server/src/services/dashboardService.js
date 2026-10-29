import userRepository from '../repositories/userRepository.js';
import teamRepository from '../repositories/teamRepository.js';
import projectRepository from '../repositories/projectRepository.js';
import taskRepository from '../repositories/taskRepository.js';
import activityLogRepository from '../repositories/activityLogRepository.js';
import { ROLES, TASK_STATUS, PROJECT_STATUS } from '../constants/index.js';

export const dashboardService = {
  async getDashboardStats(user) {
    if (user.role === ROLES.ADMIN) {
      return this.getAdminStats();
    }
    if (user.role === ROLES.MANAGER) {
      return this.getManagerStats(user);
    }
    return this.getEmployeeStats(user);
  },

  async getAdminStats() {
    const now = new Date();

    const [
      totalUsers,
      adminCount,
      managerCount,
      employeeCount,
      totalTeams,
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      todoTasks,
      inProgressTasks,
      inReviewTasks,
      doneTasks,
      overdueTasks,
      recentActivity,
      teams
    ] = await Promise.all([
      userRepository.count(),
      userRepository.count({ role: ROLES.ADMIN }),
      userRepository.count({ role: ROLES.MANAGER }),
      userRepository.count({ role: ROLES.EMPLOYEE }),
      teamRepository.count(),
      projectRepository.count(),
      projectRepository.count({ status: PROJECT_STATUS.ACTIVE }),
      projectRepository.count({ status: PROJECT_STATUS.COMPLETED }),
      taskRepository.count(),
      taskRepository.count({ status: TASK_STATUS.TO_DO }),
      taskRepository.count({ status: TASK_STATUS.IN_PROGRESS }),
      taskRepository.count({ status: TASK_STATUS.IN_REVIEW }),
      taskRepository.count({ status: TASK_STATUS.DONE }),
      taskRepository.count({
        status: { $ne: TASK_STATUS.DONE },
        dueDate: { $lt: now }
      }),
      activityLogRepository.find({}, null, { sort: { createdAt: -1 }, limit: 8 }),
      teamRepository.find({})
    ]);

    const teamBreakdowns = await Promise.all(
      teams.map(async (t) => {
        const [memberCount, taskCount, completedCount] = await Promise.all([
          userRepository.count({ team: t._id, role: ROLES.EMPLOYEE }),
          taskRepository.count({ team: t._id }),
          taskRepository.count({ team: t._id, status: TASK_STATUS.DONE })
        ]);
        return {
          id: t._id,
          name: t.name,
          managerName: t.manager?.name || 'Unassigned',
          memberCount,
          taskCount,
          completedCount
        };
      })
    );

    return {
      role: ROLES.ADMIN,
      users: {
        total: totalUsers,
        admin: adminCount,
        manager: managerCount,
        employee: employeeCount
      },
      teams: {
        total: totalTeams,
        breakdown: teamBreakdowns
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects
      },
      tasks: {
        total: totalTasks,
        todo: todoTasks,
        inProgress: inProgressTasks,
        inReview: inReviewTasks,
        done: doneTasks,
        overdue: overdueTasks
      },
      recentActivity
    };
  },

  async getManagerStats(user) {
    const now = new Date();
    const teamId = user.team?._id ? String(user.team._id) : String(user.team || '');

    if (!teamId) {
      return {
        role: ROLES.MANAGER,
        hasTeam: false,
        message: 'No team assigned to this manager'
      };
    }

    const [
      team,
      teamMembers,
      teamProjects,
      totalTasks,
      todoTasks,
      inProgressTasks,
      inReviewTasks,
      doneTasks,
      overdueTasks,
      pendingReviewTasks
    ] = await Promise.all([
      teamRepository.findById(teamId),
      userRepository.find({ team: teamId, role: ROLES.EMPLOYEE }, 'name email isActive'),
      projectRepository.find({ team: teamId }),
      taskRepository.count({ team: teamId }),
      taskRepository.count({ team: teamId, status: TASK_STATUS.TO_DO }),
      taskRepository.count({ team: teamId, status: TASK_STATUS.IN_PROGRESS }),
      taskRepository.count({ team: teamId, status: TASK_STATUS.IN_REVIEW }),
      taskRepository.count({ team: teamId, status: TASK_STATUS.DONE }),
      taskRepository.count({
        team: teamId,
        status: { $ne: TASK_STATUS.DONE },
        dueDate: { $lt: now }
      }),
      taskRepository.find(
        { team: teamId, status: TASK_STATUS.IN_REVIEW },
        null,
        { sort: { updatedAt: -1 }, limit: 10 }
      )
    ]);

    const memberWorkload = await Promise.all(
      teamMembers.map(async (m) => {
        const [activeCount, completedCount, overdueCount] = await Promise.all([
          taskRepository.count({
            assignee: m._id,
            status: { $ne: TASK_STATUS.DONE }
          }),
          taskRepository.count({
            assignee: m._id,
            status: TASK_STATUS.DONE
          }),
          taskRepository.count({
            assignee: m._id,
            status: { $ne: TASK_STATUS.DONE },
            dueDate: { $lt: now }
          })
        ]);
        return {
          id: m._id,
          name: m.name,
          email: m.email,
          isActive: m.isActive,
          activeTasks: activeCount,
          completedTasks: completedCount,
          overdueTasks: overdueCount
        };
      })
    );

    return {
      role: ROLES.MANAGER,
      hasTeam: true,
      teamName: team?.name || '',
      teamMembersCount: teamMembers.length,
      projects: {
        total: teamProjects.length,
        items: teamProjects
      },
      tasks: {
        total: totalTasks,
        todo: todoTasks,
        inProgress: inProgressTasks,
        inReview: inReviewTasks,
        done: doneTasks,
        overdue: overdueTasks
      },
      pendingReviewTasks,
      memberWorkload
    };
  },

  async getEmployeeStats(user) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      totalTasks,
      todoTasks,
      inProgressTasks,
      inReviewTasks,
      doneTasks,
      overdueTasks,
      dueTodayTasks,
      recentTasks,
      teamProjects
    ] = await Promise.all([
      taskRepository.count({ assignee: user._id }),
      taskRepository.count({ assignee: user._id, status: TASK_STATUS.TO_DO }),
      taskRepository.count({ assignee: user._id, status: TASK_STATUS.IN_PROGRESS }),
      taskRepository.count({ assignee: user._id, status: TASK_STATUS.IN_REVIEW }),
      taskRepository.count({ assignee: user._id, status: TASK_STATUS.DONE }),
      taskRepository.count({
        assignee: user._id,
        status: { $ne: TASK_STATUS.DONE },
        dueDate: { $lt: now }
      }),
      taskRepository.find(
        {
          assignee: user._id,
          status: { $ne: TASK_STATUS.DONE },
          dueDate: { $gte: startOfToday, $lte: endOfToday }
        },
        null,
        { sort: { dueDate: 1 } }
      ),
      taskRepository.find(
        { assignee: user._id },
        null,
        { sort: { updatedAt: -1 }, limit: 6 }
      ),
      user.team ? projectRepository.find({ team: user.team }) : []
    ]);

    return {
      role: ROLES.EMPLOYEE,
      tasks: {
        total: totalTasks,
        todo: todoTasks,
        inProgress: inProgressTasks,
        inReview: inReviewTasks,
        done: doneTasks,
        overdue: overdueTasks,
        dueTodayCount: dueTodayTasks.length
      },
      dueTodayTasks,
      recentTasks,
      projectsCount: teamProjects.length
    };
  }
};

export default dashboardService;
