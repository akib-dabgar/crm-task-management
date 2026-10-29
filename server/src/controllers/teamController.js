import teamService from '../services/teamService.js';

export const createTeam = async (req, res, next) => {
  try {
    const team = await teamService.createTeam(req.body);
    res.status(201).json({
      message: 'Team created successfully',
      team
    });
  } catch (error) {
    next(error);
  }
};

export const updateTeam = async (req, res, next) => {
  try {
    const team = await teamService.updateTeam(req.params.id, req.body);
    res.status(200).json({
      message: 'Team updated successfully',
      team
    });
  } catch (error) {
    next(error);
  }
};

export const getTeamById = async (req, res, next) => {
  try {
    const team = await teamService.getTeamById(req.params.id, req.user);
    res.status(200).json(team);
  } catch (error) {
    next(error);
  }
};

export const listTeams = async (req, res, next) => {
  try {
    const teams = await teamService.listTeams(req.user);
    res.status(200).json(teams);
  } catch (error) {
    next(error);
  }
};

export const deleteTeam = async (req, res, next) => {
  try {
    const result = await teamService.deleteTeam(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
