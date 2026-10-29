import mongoose from 'mongoose';
import { ACTION_TYPES } from '../constants/index.js';

const activityLogSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task reference is required']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    action: {
      type: String,
      enum: {
        values: Object.values(ACTION_TYPES),
        message: 'Invalid action type'
      },
      required: [true, 'Action type is required']
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

activityLogSchema.index({ task: 1, createdAt: -1 });

const ActivityLog =  mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
