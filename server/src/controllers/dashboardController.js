import dashboardService from '../services/dashboardService.js';

export const dashboardController = {
  async getDashboardStats(req, res, next) {
    try {
      const stats = await dashboardService.getDashboardStats(req.user);
      res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
  }
};

export default dashboardController;
