import notificationService from '../services/notificationService.js';

export const notificationController = {
  async getUserNotifications(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
      const result = await notificationService.getUserNotifications(req.user._id, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const updated = await notificationService.markAsRead(req.params.id, req.user._id);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user._id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async triggerDueSoonCheck(req, res, next) {
    try {
      const result = await notificationService.checkAndGenerateDueSoonNotifications();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
};

export default notificationController;
