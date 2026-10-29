import projectService from '../services/projectService.js';

export const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.body, req.user);
    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user);
    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};

export const listProjects = async (req, res, next) => {
  try {
    const projects = await projectService.listProjects(req.query, req.user);
    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body, req.user);
    res.status(200).json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.params.id, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
