import Task from '../models/Task.js';

export const taskRepository = {
  async findById(id) {
    return Task.findById(id)
      .populate('project', 'name clientName status team')
      .populate('team', 'name manager')
      .populate('assignee', 'name email role isActive team')
      .populate('createdBy', 'name email role');
  },

  async create(taskData) {
    return Task.create(taskData);
  },

  async updateById(id, updateData, options = { new: true, runValidators: true }) {
    return Task.findByIdAndUpdate(id, updateData, options)
      .populate('project', 'name clientName status team')
      .populate('team', 'name manager')
      .populate('assignee', 'name email role isActive team')
      .populate('createdBy', 'name email role');
  },

  async deleteById(id) {
    return Task.findByIdAndDelete(id);
  },

  async find(filter = {}, projection = null, options = {}) {
    return Task.find(filter, projection, options)
      .populate('project', 'name clientName status team')
      .populate('team', 'name manager')
      .populate('assignee', 'name email role isActive team')
      .populate('createdBy', 'name email role');
  },

  async count(filter = {}) {
    return Task.countDocuments(filter);
  },

  async aggregate(pipeline = []) {
    return Task.aggregate(pipeline);
  }
};

export default taskRepository;
