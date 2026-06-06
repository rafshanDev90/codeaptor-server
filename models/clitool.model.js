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
  tagline: String,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  longDescription: String,
  officialUrl: {
    type: String,
    required: true,
    validate: {
    validator: (v) => /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(v),
    message: props => `${props.value} is not a valid URL!`
  },
  },
  downloadUrl: String,
  icon: String,
  iconName: String, // For Lucide icons in frontend
  version: String,
  language: String,
  installCommand: String,
  packageManager: {
    type: String,
    enum: ['npm', 'pip', 'brew', 'go', 'cargo', 'apt', 'yum', 'choco', 'scoop', 'other'],
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ['Published', 'Draft'],
    default: 'Published',
  },
  metrics: {
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    issues: { type: Number, default: 0 },
    contributors: { type: Number, default: 0 },
    weeklyGrowth: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
  },
  features: [{
    icon: String,
    title: String,
    desc: String,
  }],
  docs: {
    quickStart: String,
    usage: String,
    advanced: String,
  },
  alternatives: [String], // Array of tool names or IDs
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


cliToolSchema.index({ category: 1 });
cliToolSchema.index({ isFeatured: -1, createdAt: -1 });
cliToolSchema.index(
  { displayName: 'text', description: 'text', name: 'text' },
  { weights: { displayName: 10, name: 5, description: 1 } } // Prioritizes matches in titles
);

cliToolSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')       // Replace spaces with -
      .replace(/[^a-z0-9-]/g, ''); // Remove all non-alphanumeric characters except -
  }
  next();
});


export default mongoose.model('CliTool', cliToolSchema);
