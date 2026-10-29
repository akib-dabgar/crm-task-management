import mongoose from 'mongoose';
import projectRepository from '../repositories/projectRepository.js';
import teamRepository from '../repositories/teamRepository.js';
import { ROLES, TASK_STATUS } from '../constants/index.js';

export const projectService = {
  async createProject(projectData, requestingUser) {
    if (requestingUser.role === ROLES.EMPLOYEE) {
      const error = new Error('Employees are not authorized to create projects');
      error.statusCode = 403;
      throw error;
    }

    const targetTeamId = String(projectData.team);

    if (requestingUser.role === ROLES.MANAGER) {
      const managerTeamId = requestingUser.team?._id
        ? String(requestingUser.team._id)
        : String(requestingUser.team || '');

      if (!managerTeamId || managerTeamId !== targetTeamId) {
        const error = new Error('Managers can only create projects for their own assigned team');
        error.statusCode = 403;
        throw error;
      }
    }

    const team = await teamRepository.findById(targetTeamId);
    if (!team) {
      const error = new Error('Assigned team does not exist');
      error.statusCode = 404;
      throw error;
    }

    const startDate = new Date(projectData.startDate);
    const endDate = new Date(projectData.endDate);
    if (endDate < startDate) {
      const error = new Error('End date must be greater than or equal to start date');
      error.statusCode = 400;
      throw error;
    }

    const project = await projectRepository.create({
      ...projectData,
      createdBy: requestingUser._id
    });

    const populated = await projectRepository.findById(project._id);

    return {
      ...populated.toObject(),
      progressPercentage: 0,
      taskCounts: { total: 0, completed: 0 }
    };
  },

  async getProjectById(projectId, requestingUser) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    if (requestingUser.role !== ROLES.ADMIN) {
      const userTeamId = requestingUser.team?._id
        ? String(requestingUser.team._id)
        : String(requestingUser.team || '');
      const projectTeamId = String(project.team?._id || project.team);

      if (!userTeamId || userTeamId !== projectTeamId) {
        const error = new Error('Access denied: You can only view projects belonging to your own team');
        error.statusCode = 403;
        throw error;
      }
    }

    let totalTasks = 0;
    let completedTasks = 0;

    if (mongoose.models.Task) {
      totalTasks = await mongoose.models.Task.countDocuments({ project: projectId });
      completedTasks = await mongoose.models.Task.countDocuments({
        project: projectId,
        status: TASK_STATUS.DONE
      });
    }

    const progressPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      ...project.toObject(),
      progressPercentage,
      taskCounts: {
        total: totalTasks,
        completed: completedTasks
      }
    };
  },

  async listProjects(queryFilters = {}, requestingUser) {
    const filter = {};

    if (requestingUser.role === ROLES.ADMIN) {
      if (queryFilters.team) {
        filter.team = queryFilters.team;
      }
    } else {
      const userTeamId = requestingUser.team?._id
        ? String(requestingUser.team._id)
        : String(requestingUser.team || '');

      if (!userTeamId) {
        return [];
      }
      filter.team = userTeamId;
    }

    if (queryFilters.status) {
      filter.status = queryFilters.status;
    }

    if (queryFilters.search && queryFilters.search.trim()) {
      const regex = new RegExp(queryFilters.search.trim(), 'i');
      filter.$or = [{ name: regex }, { clientName: regex }];
    }

    const projects = await projectRepository.find(filter, null, {
      sort: { createdAt: -1 }
    });

    let taskStatsByProject = {};

    if (mongoose.models.Task && projects.length > 0) {
      const projectIds = projects.map((p) => p._id);
      const aggregation = await mongoose.models.Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        {
          $group: {
            _id: '$project',
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', TASK_STATUS.DONE] }, 1, 0] }
            }
          }
        }
      ]);

      taskStatsByProject = aggregation.reduce((acc, curr) => {
        acc[String(curr._id)] = {
          total: curr.total,
          completed: curr.completed
        };
        return acc;
      }, {});
    }

    return projects.map((p) => {
      const stats = taskStatsByProject[String(p._id)] || { total: 0, completed: 0 };
      const progressPercentage =
        stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

      return {
        ...p.toObject(),
        progressPercentage,
        taskCounts: stats
      };
    });
  },

  async updateProject(projectId, updateData, requestingUser) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    if (requestingUser.role === ROLES.EMPLOYEE) {
      const error = new Error('Employees are not authorized to edit projects');
      error.statusCode = 403;
      throw error;
    }

    if (requestingUser.role === ROLES.MANAGER) {
      const userTeamId = requestingUser.team?._id
        ? String(requestingUser.team._id)
        : String(requestingUser.team || '');
      const projectTeamId = String(project.team?._id || project.team);

      if (userTeamId !== projectTeamId) {
        const error = new Error('Managers can only edit projects for their own team');
        error.statusCode = 403;
        throw error;
      }

      if (updateData.team && String(updateData.team) !== projectTeamId) {
        const error = new Error('Managers cannot move a project to a different team');
        error.statusCode = 403;
        throw error;
      }
    }

    if (updateData.team) {
      const teamDoc = await teamRepository.findById(updateData.team);
      if (!teamDoc) {
        const error = new Error('Assigned team does not exist');
        error.statusCode = 404;
        throw error;
      }
    }

    const startDate = updateData.startDate ? new Date(updateData.startDate) : project.startDate;
    const endDate = updateData.endDate ? new Date(updateData.endDate) : project.endDate;
    if (endDate < startDate) {
      const error = new Error('End date must be greater than or equal to start date');
      error.statusCode = 400;
      throw error;
    }

    const updated = await projectRepository.updateById(projectId, updateData);
    return updated;
  },

  async deleteProject(projectId, requestingUser) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    if (requestingUser.role !== ROLES.ADMIN) {
      const userTeamId = requestingUser.team?._id
        ? String(requestingUser.team._id)
        : String(requestingUser.team || '');
      const projectTeamId = String(project.team?._id || project.team);

      if (requestingUser.role !== ROLES.MANAGER || userTeamId !== projectTeamId) {
        const error = new Error('Access denied: You can only delete your own team projects');
        error.statusCode = 403;
        throw error;
      }
    }

    await projectRepository.deleteById(projectId);
    return { message: 'Project deleted successfully' };
  }
};

export default projectService;
