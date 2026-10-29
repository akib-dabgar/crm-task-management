import api from './api';

export const notificationService = {
  async getNotifications(limit = 50) {
    const response = await api.get('/notifications', { params: { limit } });
    return response.data;
  },

  async markAsRead(id) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  async triggerDueSoonCheck() {
    const response = await api.post('/notifications/check-due-soon');
    return response.data;
  }
};

export default notificationService;
