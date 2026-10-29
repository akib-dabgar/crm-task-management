import taskService from '../services/taskService.js';

export const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.body, req.user);
    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user);
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

export const listTasks = async (req, res, next) => {
  try {
    const result = await taskService.listTasks(req.query, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body, req.user);
    res.status(200).json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    next(error);
  }
};

export const changeStatus = async (req, res, next) => {
  try {
    const task = await taskService.changeStatus(req.params.id, req.body, req.user);
    res.status(200).json({
      message: 'Task status updated successfully',
      task
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const result = await taskService.deleteTask(req.params.id, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
