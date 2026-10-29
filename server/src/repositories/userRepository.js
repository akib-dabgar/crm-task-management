import mongoose from 'mongoose';
import User from '../models/User.js';

export const userRepository = {
  async findById(id, projection = null) {
    return User.findById(id, projection);
  },

  async findByEmail(email, includePassword = false) {
    const query = User.findOne({ email });
    if (includePassword) {
      query.select('+password');
    }
    return query;
  },

  async findByIdWithProfile(id) {
    const query = User.findById(id);
    if (mongoose.models.Team) {
      query.populate('team', 'name description');
    }
    return query;
  },

  async create(userData) {
    return User.create(userData);
  },

  async updateById(id, updateData, options = { new: true, runValidators: true }) {
    return User.findByIdAndUpdate(id, updateData, options);
  },

  async updateMany(filter, updateData) {
    return User.updateMany(filter, updateData);
  },

  async find(filter = {}, projection = null, options = {}) {
    return User.find(filter, projection, options);
  },

  async count(filter = {}) {
    return User.countDocuments(filter);
  }
};

export default userRepository;
