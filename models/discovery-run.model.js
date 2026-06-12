import mongoose from 'mongoose';

const discoveryRunSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['running', 'completed', 'failed'],
    default: 'running',
  },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  candidates: {
    type: Number,
    default: 0,
  },
  inserted: {
    type: Number,
    default: 0,
  },
  errors: {
    type: Number,
    default: 0,
  },
  accumulated: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number,
    default: 0,
  },
  log: [String],
  startedAt: Date,
  completedAt: Date,
}, { timestamps: true });

discoveryRunSchema.index({ startedAt: -1 });

export default mongoose.model('DiscoveryRun', discoveryRunSchema);
