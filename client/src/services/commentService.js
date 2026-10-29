import api from './api';

export const commentService = {
  async getComments(taskId) {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data;
  },

  async createComment(taskId, content) {
    const response = await api.post(`/tasks/${taskId}/comments`, { content });
    return response.data;
  }
};

export default commentService;
