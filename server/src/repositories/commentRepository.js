import Comment from '../models/Comment.js';

export const commentRepository = {
  async create(commentData) {
    return Comment.create(commentData);
  },

  async find(filter = {}, projection = null, options = {}) {
    return Comment.find(filter, projection, options).populate('author', 'name email role');
  },

  async count(filter = {}) {
    return Comment.countDocuments(filter);
  },

  async deleteMany(filter = {}) {
    return Comment.deleteMany(filter);
  }
};

export default commentRepository;
