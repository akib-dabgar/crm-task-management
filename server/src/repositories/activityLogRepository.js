import ActivityLog from '../models/ActivityLog.js';

export const activityLogRepository = {
  async create(logData) {
    return ActivityLog.create(logData);
  },

  async find(filter = {}, projection = null, options = {}) {
    return ActivityLog.find(filter, projection, options)
      .populate('user', 'name email role')
      .populate('task', 'title status');
  },

  async count(filter = {}) {
    return ActivityLog.countDocuments(filter);
  },

  async deleteMany(filter = {}) {
    return ActivityLog.deleteMany(filter);
  }
};

export default activityLogRepository;
