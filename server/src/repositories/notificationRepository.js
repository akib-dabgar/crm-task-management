import Notification from '../models/Notification.js';

export const notificationRepository = {
  async create(notificationData) {
    return Notification.create(notificationData);
  },

  async find(filter = {}, projection = null, options = {}) {
    return Notification.find(filter, projection, options).populate('task', 'title status');
  },

  async count(filter = {}) {
    return Notification.countDocuments(filter);
  },

  async updateById(id, updateData) {
    return Notification.findByIdAndUpdate(id, updateData, { new: true });
  },

  async updateMany(filter, updateData) {
    return Notification.updateMany(filter, updateData);
  },

  async deleteMany(filter = {}) {
    return Notification.deleteMany(filter);
  }
};

export default notificationRepository;
