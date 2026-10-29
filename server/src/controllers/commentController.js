import commentService from '../services/commentService.js';

export const commentController = {
  async createComment(req, res, next) {
    try {
      const comment = await commentService.createComment(
        req.params.id,
        req.body.content,
        req.user
      );
      res.status(201).json(comment);
    } catch (err) {
      next(err);
    }
  },

  async getCommentsByTask(req, res, next) {
    try {
      const comments = await commentService.getCommentsByTask(
        req.params.id,
        req.user
      );
      res.status(200).json(comments);
    } catch (err) {
      next(err);
    }
  }
};

export default commentController;
