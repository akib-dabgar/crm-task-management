import mongoose from 'mongoose';
import { PROJECT_STATUS } from '../constants/index.js';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters'],
      maxlength: [100, 'Project name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      minlength: [2, 'Client name must be at least 2 characters'],
      maxlength: [100, 'Client name cannot exceed 100 characters']
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (value) {
          return !this.startDate || value >= this.startDate;
        },
        message: 'End date must be greater than or equal to start date'
      }
    },
    status: {
      type: String,
      enum: {
        values: Object.values(PROJECT_STATUS),
        message: 'Status must be one of: Planning, Active, On Hold, Completed'
      },
      default: PROJECT_STATUS.PLANNING
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'Project must belong to a team']
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

projectSchema.index({ team: 1, status: 1 });
projectSchema.index({ clientName: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
