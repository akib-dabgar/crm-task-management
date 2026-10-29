import api from './api';

export const taskService = {
  async listTasks(params = {}) {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  async getTaskById(id) {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  async createTask(taskData) {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  async updateTask(id, taskData) {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  async changeStatus(id, { status, reviewReason = '' }) {
    const response = await api.patch(`/tasks/${id}/status`, { status, reviewReason });
    return response.data;
  },

  async deleteTask(id) {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  }
};

export default taskService;
