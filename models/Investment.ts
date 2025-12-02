import mongoose, { Schema, Document } from 'mongoose';

export interface IInvestment extends Document {
  type: 'gold' | 'silver';
  carat?: '22K' | '24K'; // Only for gold
  quantity: number; // in grams
  pricePerUnit: number; // price per gram at time of purchase
  totalAmount: number; // total investment amount
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema = new Schema<IInvestment>({
  type: {
    type: String,
    required: true,
    enum: ['gold', 'silver']
  },
  carat: {
    type: String,
    enum: ['22K', '24K'],
    required: function(this: IInvestment) {
      return this.type === 'gold';
    }
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
InvestmentSchema.index({ type: 1, date: -1 });
InvestmentSchema.index({ type: 1, carat: 1 });

// Validation: Silver should not have carat
InvestmentSchema.pre('save', function(next) {
  if (this.type === 'silver' && this.carat) {
    this.carat = undefined;
  }
  next();
});

export const Investment = mongoose.model<IInvestment>('Investment', InvestmentSchema);