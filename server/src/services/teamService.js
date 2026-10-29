import teamRepository from '../repositories/teamRepository.js';
import userRepository from '../repositories/userRepository.js';
import { ROLES } from '../constants/index.js';

export const teamService = {
  async createTeam({ name, description, manager, employeeIds = [] }) {
    const existingTeam = await teamRepository.findByName(name);
    if (existingTeam) {
      const error = new Error('Team name already exists');
      error.statusCode = 400;
      throw error;
    }

    const managerUser = await userRepository.findById(manager);
    if (!managerUser) {
      const error = new Error('Manager not found');
      error.statusCode = 404;
      throw error;
    }

    if (managerUser.role !== ROLES.MANAGER) {
      const error = new Error('Assigned user is not a Manager');
      error.statusCode = 400;
      throw error;
    }

    if (!managerUser.isActive) {
      const error = new Error('Cannot assign a deactivated user as Team Manager');
      error.statusCode = 400;
      throw error;
    }

    const existingManagedTeam = await teamRepository.findByManager(manager);
    if (existingManagedTeam) {
      const error = new Error('This manager is already assigned to another team');
      error.statusCode = 400;
      throw error;
    }

    if (employeeIds.length > 0) {
      const employees = await userRepository.find({ _id: { $in: employeeIds } });
      if (employees.length !== employeeIds.length) {
        const error = new Error('One or more employee IDs are invalid');
        error.statusCode = 400;
        throw error;
      }
      for (const emp of employees) {
        if (emp.role !== ROLES.EMPLOYEE) {
          const error = new Error(`User ${emp.name} is not an Employee`);
          error.statusCode = 400;
          throw error;
        }
      }
    }

    const team = await teamRepository.create({
      name,
      description,
      manager
    });

    await userRepository.updateById(manager, { team: team._id });

    if (employeeIds.length > 0) {
      await userRepository.updateMany(
        { _id: { $in: employeeIds } },
        { team: team._id }
      );
    }

    const populatedTeam = await teamRepository.findById(team._id);
    const members = await userRepository.find(
      { team: team._id, role: ROLES.EMPLOYEE },
      '_id name email role isActive'
    );

    return {
      ...populatedTeam.toObject(),
      members
    };
  },

  async updateTeam(teamId, { name, description, manager, employeeIds }) {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      const error = new Error('Team not found');
      error.statusCode = 404;
      throw error;
    }

    const updateFields = {};

    if (name && name !== team.name) {
      const existingName = await teamRepository.findByName(name);
      if (existingName && !existingName._id.equals(teamId)) {
        const error = new Error('Team name already exists');
        error.statusCode = 400;
        throw error;
      }
      updateFields.name = name;
    }

    if (description !== undefined) {
      updateFields.description = description;
    }

    if (manager && String(manager) !== String(team.manager?._id || team.manager)) {
      const newManager = await userRepository.findById(manager);
      if (!newManager) {
        const error = new Error('Manager not found');
        error.statusCode = 404;
        throw error;
      }

      if (newManager.role !== ROLES.MANAGER) {
        const error = new Error('Assigned user is not a Manager');
        error.statusCode = 400;
        throw error;
      }

      if (!newManager.isActive) {
        const error = new Error('Cannot assign a deactivated user as Team Manager');
        error.statusCode = 400;
        throw error;
      }

      const existingManaged = await teamRepository.findByManager(manager);
      if (existingManaged && !existingManaged._id.equals(teamId)) {
        const error = new Error('This manager is already assigned to another team');
        error.statusCode = 400;
        throw error;
      }

      const oldManagerId = team.manager?._id || team.manager;
      if (oldManagerId) {
        await userRepository.updateById(oldManagerId, { team: null });
      }

      await userRepository.updateById(manager, { team: teamId });
      updateFields.manager = manager;
    }

    if (Array.isArray(employeeIds)) {
      if (employeeIds.length > 0) {
        const employees = await userRepository.find({ _id: { $in: employeeIds } });
        if (employees.length !== employeeIds.length) {
          const error = new Error('One or more employee IDs are invalid');
          error.statusCode = 400;
          throw error;
        }
        for (const emp of employees) {
          if (emp.role !== ROLES.EMPLOYEE) {
            const error = new Error(`User ${emp.name} is not an Employee`);
            error.statusCode = 400;
            throw error;
          }
        }
      }

      await userRepository.updateMany(
        { team: teamId, role: ROLES.EMPLOYEE, _id: { $nin: employeeIds } },
        { team: null }
      );

      if (employeeIds.length > 0) {
        await userRepository.updateMany(
          { _id: { $in: employeeIds } },
          { team: teamId }
        );
      }
    }

    const updatedTeam = await teamRepository.updateById(teamId, updateFields);
    const members = await userRepository.find(
      { team: teamId, role: ROLES.EMPLOYEE },
      '_id name email role isActive'
    );

    return {
      ...updatedTeam.toObject(),
      members
    };
  },

  async getTeamById(teamId, requestingUser) {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      const error = new Error('Team not found');
      error.statusCode = 404;
      throw error;
    }

    if (requestingUser.role !== ROLES.ADMIN) {
      const userTeamId = requestingUser.team?._id ? String(requestingUser.team._id) : String(requestingUser.team || '');
      const isManager = String(team.manager?._id || team.manager) === String(requestingUser._id);
      const isMember = userTeamId === String(teamId);

      if (!isManager && !isMember) {
        const error = new Error('Access denied: You can only view your own team');
        error.statusCode = 403;
        throw error;
      }
    }

    const members = await userRepository.find(
      { team: teamId, role: ROLES.EMPLOYEE },
      '_id name email role isActive'
    );

    return {
      ...team.toObject(),
      members
    };
  },

  async listTeams(requestingUser) {
    let filter = {};
    if (requestingUser.role === ROLES.MANAGER) {
      filter = {
        $or: [
          { manager: requestingUser._id },
          ...(requestingUser.team ? [{ _id: requestingUser.team }] : [])
        ]
      };
    } else if (requestingUser.role === ROLES.EMPLOYEE) {
      if (!requestingUser.team) {
        return [];
      }
      filter = { _id: requestingUser.team };
    }

    const teams = await teamRepository.find(filter);

    const teamList = await Promise.all(
      teams.map(async (t) => {
        const memberCount = await userRepository.count({
          team: t._id,
          role: ROLES.EMPLOYEE
        });
        return {
          ...t.toObject(),
          memberCount
        };
      })
    );

    return teamList;
  },

  async deleteTeam(teamId) {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      const error = new Error('Team not found');
      error.statusCode = 404;
      throw error;
    }

    await userRepository.updateMany({ team: teamId }, { team: null });
    await teamRepository.deleteById(teamId);

    return { message: 'Team deleted successfully' };
  }
};

export default teamService;
