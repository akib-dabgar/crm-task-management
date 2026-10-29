import api from './api';

export const activityService = {
  async getActivity(taskId) {
    const response = await api.get(`/tasks/${taskId}/activities`);
    return response.data;
  }
};

export default activityService;
