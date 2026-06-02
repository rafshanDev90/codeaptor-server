import mongoose from 'mongoose';

const cliToolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  officialUrl: {
    type: String,
    required: true,
  },
  downloadUrl: String,
  icon: String,
  version: String,
  packageManager: {
    type: String,
    enum: ['npm', 'pip', 'brew', 'go', 'cargo', 'apt', 'yum', 'choco', 'scoop', 'other'],
  },
  installCommand: String,
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    ogTitle: String,
    ogDescription: String,
    ogImage: String,
    keywords: [String],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

cliToolSchema.index({ category: 1, isActive: 1 });
cliToolSchema.index({ isFeatured: -1, createdAt: -1 });

export default mongoose.model('CliTool', cliToolSchema);
