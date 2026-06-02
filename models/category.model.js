import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: String,
  displayOrder: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

categorySchema.index({ displayOrder: 1 });

export default mongoose.model('Category', categorySchema);
