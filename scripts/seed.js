import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/category.model.js';
import CliTool from '../models/clitool.model.js';

dotenv.config();

const INITIAL_CLI_TOOLS = [
  {
    name: 'bun',
    displayName: 'Bun',
    tagline: 'A fast all-in-one JavaScript runtime',
    description: 'Bun is an all-in-one JavaScript runtime, bundler, test runner, and package manager, designed for speed and ease of use.',
    longDescription: 'Bun is designed from scratch to serve the modern JavaScript ecosystem. Written in Zig and powered by Apple Safari\'s JavaScriptCore engine, Bun starts up in milliseconds and executes Javascript faster than traditional runtimes like Node.js. It features native implementation of standard APIs (like Fetch, WebSocket, and ReadableStream), integrated build tooling, and dropping support for CommonJS and ES modules seamlessly.',
    categoryName: 'Frontend',
    iconName: 'Zap',
    officialUrl: 'https://bun.sh',
    githubLink: 'https://github.com/oven-sh/bun',
    installCommand: 'curl -fsSL https://bun.sh/install | bash',
    version: '1.2.4',
    language: 'Zig/C++',
    isFeatured: true,
    metrics: {
      stars: 48900,
      forks: 1820,
      issues: 340,
      contributors: 380,
      weeklyGrowth: 2.1,
      downloads: 489200
    },
    features: [
      { icon: 'Zap', title: 'Incredible Speed', desc: 'Starts up to 4x faster than Node.js and packages download up to 20x faster.' },
      { icon: 'Package', title: 'Built-in Package Manager', desc: 'Saves you disk space and eliminates huge node_modules lag.' },
      { icon: 'Code', title: 'Native TS & JSX Support', desc: 'Directly executes TypeScript, JSX, and TSX without extra pre-compilation.' }
    ],
    docs: {
      quickStart: `# Install Bun\ncurl -fsSL https://bun.sh/install | bash\n\n# Create a new index.ts file\necho "console.log('Hello from Bun!')" > index.ts\n\n# Run the file\nbun index.ts`,
      usage: `# Start the development server\nbun dev\n\n# Run package install with lightning speeds\nbun install\n\n# Run tests concurrently\nbun test\n\n# Build optimized assets\nbun build ./src/index.ts --outdir ./dist`,
      advanced: `# Execute code using specific experimental flags\nbun --filter="*" test\n\n# Bun is fully compatible with Node:js API\nimport { serve } from "bun";\nserve({\n  port: 3000,\n  fetch(request) {\n    return new Response("Bun is server-fast!");\n  },\n});`
    },
    alternatives: ['docker-cli', 'github-cli']
  },
  {
    name: 'warp',
    displayName: 'Warp',
    tagline: 'The modern AI-connected terminal',
    description: 'A rust-based terminal that integrates advanced AI search, collaborative bookmarks, and block-based terminal formatting.',
    longDescription: 'Warp is a blazingly fast, Rust-based terminal built for the 21st century. Unlike traditional terminals that treat output as simple flat grids of character text, Warp structures your input and output as independent Blocks. This lets you select, search, copy, and share blocks of commands easily. Warp features native AI command auto-generation, team drives, and custom beautiful themes.',
    categoryName: 'Productivity',
    iconName: 'Terminal',
    officialUrl: 'https://warp.dev',
    githubLink: 'https://github.com/warp-tech/warp',
    installCommand: 'brew install --cask warp',
    version: '2026.05.28',
    language: 'Rust',
    isFeatured: true,
    metrics: {
      stars: 17200,
      forks: 520,
      issues: 180,
      contributors: 94,
      weeklyGrowth: 4.8,
      downloads: 125000
    },
    features: [
      { icon: 'Cpu', title: 'Rust Powered', desc: 'Blazingly fast GPU-rendered text editor running directly at 60 FPS.' },
      { icon: 'Sparkles', title: 'Warp AI Drive', desc: 'Prompt AI natural language inside input to instantly generate shell code.' },
      { icon: 'Users', title: 'Team Notebooks', desc: 'Share frequent workflows, configs, and custom commands with your entire squad.' }
    ],
    docs: {
      quickStart: `# Install Warp via Homebrew\nbrew install --cask warp\n\n# Fire up Warp and trigger the AI agent wizard using:\n# Ctrl + Grave Accent (or Command + P)`,
      usage: `# Trigger AI Command Generation\nPress '#' followed by "Create a private public SSH key pair and copy to clipboard"\n\n# Search Command Palette\nUse CMD + P for general navigation across files, folders, layouts, and drives.`,
      advanced: `# Create dynamic workflows\n# Under ~/.warp/workflows/ deploy YAML files:\nname: Deploy K8s Namespace\ncommand: kubectl apply -f kubernetes/development.yaml\n\n# These automatically become discoverable globally by your team.`
    },
    alternatives: ['claude-code', 'gemini-cli']
  }
];

const CATEGORIES = [
  'AI', 'DevOps', 'Backend', 'Frontend', 'Database', 'Security', 'Productivity', 'Testing', 'Cloud', 'Kubernetes'
];

async function seed() {
  try {
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await Category.deleteMany({});
    await CliTool.deleteMany({});

    const categoryMap = {};
    for (const catName of CATEGORIES) {
      const slug = catName.toLowerCase();
      const cat = await Category.create({ name: catName, slug });
      categoryMap[catName] = cat._id;
    }

    for (const toolData of INITIAL_CLI_TOOLS) {
      const { categoryName, ...rest } = toolData;
      await CliTool.create({
        ...rest,
        category: categoryMap[categoryName] || categoryMap['Productivity']
      });
    }

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
