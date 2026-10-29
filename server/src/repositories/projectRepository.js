import Project from '../models/Project.js';

export const projectRepository = {
  async findById(id) {
    return Project.findById(id)
      .populate('team', 'name description manager')
      .populate('createdBy', 'name email role');
  },

  async create(projectData) {
    return Project.create(projectData);
  },

  async updateById(id, updateData, options = { new: true, runValidators: true }) {
    return Project.findByIdAndUpdate(id, updateData, options)
      .populate('team', 'name description manager')
      .populate('createdBy', 'name email role');
  },

  async deleteById(id) {
    return Project.findByIdAndDelete(id);
  },

  async find(filter = {}, projection = null, options = {}) {
    return Project.find(filter, projection, options)
      .populate('team', 'name description manager')
      .populate('createdBy', 'name email role');
  },

  async count(filter = {}) {
    return Project.countDocuments(filter);
  }
};

export default projectRepository;
