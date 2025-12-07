import mongoose, { Schema, Document } from 'mongoose';

export interface IGoal extends Document {
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  icon: string;
  progress: number; // calculated field
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currentAmount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  targetDate: {
    type: Date
  },
  icon: {
    type: String,
    required: true,
    enum: ['bike', 'car', 'home', 'plane', 'education', 'wedding'],
    default: 'bike'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for progress calculation
GoalSchema.virtual('progress').get(function(this: IGoal) {
  if (this.targetAmount === 0) return 0;
  return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
});

// Add indexes
GoalSchema.index({ userId: 1, createdAt: -1 });
GoalSchema.index({ userId: 1, name: 1 });
GoalSchema.index({ targetDate: 1 });

export const Goal = mongoose.model<IGoal>('Goal', GoalSchema);