import Team from '../models/Team.js';

export const teamRepository = {
  async findById(id) {
    return Team.findById(id).populate('manager', 'name email role isActive');
  },

  async findByName(name) {
    return Team.findOne({ name });
  },

  async findByManager(managerId) {
    return Team.findOne({ manager: managerId });
  },

  async create(teamData) {
    return Team.create(teamData);
  },

  async updateById(id, updateData, options = { new: true, runValidators: true }) {
    return Team.findByIdAndUpdate(id, updateData, options).populate('manager', 'name email role isActive');
  },

  async deleteById(id) {
    return Team.findByIdAndDelete(id);
  },

  async find(filter = {}, projection = null, options = {}) {
    return Team.find(filter, projection, options).populate('manager', 'name email role isActive');
  },

  async count(filter = {}) {
    return Team.countDocuments(filter);
  }
};

export default teamRepository;
