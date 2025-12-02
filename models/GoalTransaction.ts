import mongoose, { Schema, Document } from 'mongoose';

export interface IGoalTransaction extends Document {
  goalId: mongoose.Types.ObjectId;
  type: 'deposit' | 'withdraw' | 'payment';
  amount: number;
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GoalTransactionSchema = new Schema<IGoalTransaction>({
  goalId: {
    type: Schema.Types.ObjectId,
    ref: 'Goal',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['deposit', 'withdraw', 'payment']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes
GoalTransactionSchema.index({ goalId: 1, date: -1 });
GoalTransactionSchema.index({ type: 1 });

export const GoalTransaction = mongoose.model<IGoalTransaction>('GoalTransaction', GoalTransactionSchema);