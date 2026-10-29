import userRepository from '../repositories/userRepository.js';
import teamRepository from '../repositories/teamRepository.js';
import { generateToken } from '../utils/jwt.js';
import { ROLES } from '../constants/index.js';

export const findUserByEmailWithPassword = async (email) => {
  return userRepository.findByEmail(email, true);
};

export const getUserProfile = async (userId) => {
  return userRepository.findByIdWithProfile(userId);
};

export const validateUserLogin = async (email, password) => {
  const user = await findUserByEmailWithPassword(email);
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Account is deactivated. Please contact your administrator.');
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken({
    id: user._id,
    role: user.role,
    team: user.team
  });

  const data = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    team: user.team,
    isActive: user.isActive,
    createdAt: user.createdAt
  };

  return { token, user:data };
};

export const createUser = async ({ name, email, password, role, team = null }) => {
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 400;
    throw error;
  }

  if (![ROLES.MANAGER, ROLES.EMPLOYEE].includes(role)) {
    throw new Error('Only Manager and Employee roles are allowed');
  }

  let assignedTeam = team || null;
  if (role === ROLES.ADMIN) {
    assignedTeam = null;
  }

  if (assignedTeam) {
    const teamDoc = await teamRepository.findById(assignedTeam);
    if (!teamDoc) {
      const error = new Error('Assigned team does not exist');
      error.statusCode = 404;
      throw error;
    }

    if (role === ROLES.MANAGER) {
      const existingTeamForManager = await teamRepository.findByManager(teamDoc.manager);
      if (existingTeamForManager && String(existingTeamForManager._id) === String(assignedTeam)) {
        const error = new Error('This team already has an assigned manager');
        error.statusCode = 400;
        throw error;
      }
    }
  }

  const newUser = await userRepository.create({
    name,
    email,
    password,
    role,
    team: assignedTeam,
    isActive: true
  });

  if (role === ROLES.MANAGER && assignedTeam) {
    await teamRepository.updateById(assignedTeam, { manager: newUser._id });
  }

  const result = await userRepository.findById(newUser._id);
  return result;
};

export const updateUser = async (userId, { name, role, team, isActive }) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.role === ROLES.ADMIN) {

    if (role !== undefined && role !== ROLES.ADMIN) {
      const error = new Error('Cannot change Admin role');
      error.statusCode = 403;
      throw error;
    }

    if (team !== undefined) {
      const error = new Error('Cannot change Admin team');
      error.statusCode = 403;
      throw error;
    }
  
    if (isActive !== undefined) {
      const error = new Error('Cannot change Admin active status');
      error.statusCode = 403;
      throw error;
    }


    const updateData = {};
    if (name !== undefined) updateData.name = name;

    const updatedUser = await userRepository.updateById(userId, updateData);
    return updatedUser;
  }

 
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (isActive !== undefined) updateData.isActive = isActive;

  if (role && role !== user.role) {
    if (user.role === ROLES.MANAGER && role !== ROLES.MANAGER) {
      const managedTeam = await teamRepository.findByManager(user._id);
      if (managedTeam) {
        const error = new Error(
          'Cannot change role: user is currently manager of team "' +
            managedTeam.name +
            '". Please reassign the team manager first.'
        );
        error.statusCode = 400;
        throw error;
      }
    }
    updateData.role = role;
    if (role === ROLES.ADMIN) {
      updateData.team = null;
    }
  }

  if (team !== undefined && updateData.role !== ROLES.ADMIN) {
    if (team === null || team === '') {
      updateData.team = null;
    } 
    else {
    const teamDoc = await teamRepository.findById(team);

if (!teamDoc) {
  const error = new Error('Assigned team does not exist');
  error.statusCode = 404;
  throw error;
}

// Check if the selected team already has a different manager
if ((updateData.role ?? user.role) === ROLES.MANAGER) {
  const existingTeam = await teamRepository.findByManager(user._id);

  if (
    existingTeam &&
    String(existingTeam._id) === String(teamDoc._id)
  ) {
    // Same manager and same team: allow the update
  } else if (teamDoc.manager &&
             String(teamDoc.manager) !== String(user._id)) {
    const error = new Error(
      'This team already has an assigned manager'
    );
    error.statusCode = 409;
    throw error;
  }
}

updateData.team = team;
    }
  }

  const updatedUser = await userRepository.updateById(userId, updateData);
  return updatedUser;
};

export const toggleUserStatus = async (userId, isActive) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const updatedUser = await userRepository.updateById(userId, { isActive });
  return updatedUser;
};

export const listUsers = async ({ role, team, isActive, search } = {}, requestingUser = null) => {

  const filter = { role: { $ne: ROLES.ADMIN } };


  if (requestingUser && requestingUser.role === ROLES.MANAGER) {
    const managerTeamId = requestingUser.team?._id
      ? String(requestingUser.team._id)
      : String(requestingUser.team || '');

    if (!managerTeamId) {
   
      return [];
    }

    filter.team = managerTeamId;


    if (role) {
      filter.role = role;
    }
  } else {

    if (role) {
      filter.role = role;
    }
    if (team) {
      filter.team = team;
    }
  }

  if (isActive !== undefined) {
    filter.isActive = typeof isActive === 'string' ? isActive === 'true' : Boolean(isActive);
  }

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const users = await userRepository.find(filter, '-password', { sort: { createdAt: -1 } });
  return users;
};

export const getUserById = async (userId) => {
  const user = await userRepository.findByIdWithProfile(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};
