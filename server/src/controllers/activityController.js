import activityService from '../services/activityService.js';

export const activityController = {
  async getActivityByTask(req, res, next) {
    try {
      const activities = await activityService.getActivityByTask(
        req.params.id,
        req.user
      );
      res.status(200).json(activities);
    } catch (err) {
      next(err);
    }
  }
};

export default activityController;
