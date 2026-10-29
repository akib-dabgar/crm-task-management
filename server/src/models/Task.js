import mongoose from 'mongoose';
import { TASK_STATUS, TASK_PRIORITY } from '../constants/index.js';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Task title must be at least 3 characters'],
      maxlength: [150, 'Task title cannot exceed 150 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: ''
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Task must belong to a project']
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'Task must belong to a team']
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must have an assignee']
    },
    priority: {
      type: String,
      enum: {
        values: Object.values(TASK_PRIORITY),
        message: 'Priority must be one of: Low, Medium, High, Urgent'
      },
      default: TASK_PRIORITY.MEDIUM
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    status: {
      type: String,
      enum: {
        values: Object.values(TASK_STATUS),
        message: 'Status must be one of: To Do, In Progress, In Review, Done'
      },
      default: TASK_STATUS.TO_DO
    },
    reviewReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Review reason cannot exceed 500 characters'],
      default: ''
    },
    attachments: [
      {
        name: { type: String, trim: true },
        url: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    dueSoonAlertSent: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user is required']
    }
  },
  {
    timestamps: true
  }
);

taskSchema.index({ team: 1, status: 1, dueDate: 1 });
taskSchema.index({ assignee: 1, status: 1, dueDate: 1 });
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1, dueSoonAlertSent: 1 });
taskSchema.index({ title: 'text', description: 'text' });

const Task = mongoose.model('Task', taskSchema);

export default Task;
