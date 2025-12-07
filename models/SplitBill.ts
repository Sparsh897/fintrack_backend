import mongoose, { Schema, Document } from 'mongoose';

export interface IParticipant {
  name: string;
  phone: string;
  amount: number;
  status: 'pending' | 'paid';
}

export interface ISplitBill extends Document {
  userId: mongoose.Types.ObjectId;
  totalAmount: number;
  description: string;
  participants: IParticipant[];
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  }
}, { _id: false });

const SplitBillSchema = new Schema<ISplitBill>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  participants: {
    type: [ParticipantSchema],
    required: true,
    validate: {
      validator: function(participants: IParticipant[]) {
        return participants.length >= 2;
      },
      message: 'At least 2 participants are required'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
SplitBillSchema.index({ userId: 1, createdAt: -1 });
SplitBillSchema.index({ status: 1 });

// Middleware to auto-complete bill when all participants have paid
SplitBillSchema.pre('save', function(next) {
  if (this.isModified('participants')) {
    const allPaid = this.participants.every(p => p.status === 'paid');
    if (allPaid && this.status === 'pending') {
      this.status = 'completed';
    }
  }
  next();
});

export const SplitBill = mongoose.model<ISplitBill>('SplitBill', SplitBillSchema);
