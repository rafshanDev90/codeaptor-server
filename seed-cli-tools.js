import mongoose from 'mongoose';
import CliTool from './models/clitool.model.js';
import Category from './models/category.model.js';
import dotenv from 'dotenv';

dotenv.config();

const tools = [
  {
    name: 'bun',
    displayName: 'Bun',
    categorySlug: 'frontend',
    description: 'Bun is an all-in-one JavaScript runtime, bundler, test runner, and package manager, designed for speed and ease of use. Written in Zig and powered by JavaScriptCore, Bun starts up in milliseconds and executes JavaScript faster than traditional runtimes like Node.js. It features native implementation of standard APIs (like Fetch, WebSocket, and ReadableStream), integrated build tooling, and support for CommonJS and ES modules seamlessly.',
    officialUrl: 'https://bun.sh',
    downloadUrl: 'https://bun.sh/install',
    icon: 'zap',
    version: '1.2.4',
    installCommand: 'curl -fsSL https://bun.sh/install | bash',
    isFeatured: true,
  },
  {
    name: 'warp',
    displayName: 'Warp',
    categorySlug: 'productivity',
    description: 'Warp is a blazingly fast, Rust-based terminal built for the 21st century. Unlike traditional terminals that treat output as simple flat grids of character text, Warp structures your input and output as independent Blocks. This lets you select, search, copy, and share blocks of commands easily. Warp features native AI command auto-generation, team drives, and customizable themes.',
    officialUrl: 'https://warp.dev',
    icon: 'terminal',
    version: '2026.05.28',
    packageManager: 'brew',
    installCommand: 'brew install --cask warp',
    isFeatured: true,
  },
  {
    name: 'claude-code',
    displayName: 'Claude Code',
    categorySlug: 'ai',
    description: 'Claude Code is an agentic, command-line interface helper that can complete full programming tasks directly in your workspace. Simply describe what needs to be created or refactored, and Claude Code analyzes the codebase structure, performs targeted file reads/writes, runs compilers and linters to verify correctness, and checks in git commits effortlessly.',
    officialUrl: 'https://anthropic.com/claude',
    icon: 'sparkles',
    version: '0.3.1',
    packageManager: 'npm',
    installCommand: 'npm install -g @anthropic-ai/claude-code',
    isFeatured: true,
  },
  {
    name: 'gemini-cli',
    displayName: 'Gemini CLI',
    categorySlug: 'ai',
    description: 'Gemini CLI puts the power of Google\'s advanced generative AI models at your fingertips inside any project workspace. Quickly summarize long configuration logs, draft release plans, examine git diff logs for logic errors, or pipe command line errors directly into Gemini CLI to receive clear resolution instructions.',
    officialUrl: 'https://ai.google.dev',
    icon: 'brain',
    version: '1.4.0',
    packageManager: 'npm',
    installCommand: 'npm install -g google-gemini-cli',
    isFeatured: false,
  },
  {
    name: 'cursor-cli',
    displayName: 'Cursor CLI',
    categorySlug: 'ai',
    description: 'Cursor CLI is the official helper tool for the popular AI code editor. Developers can launch directories, configure context indexes dynamically, inspect remote server directories, and check cloud-synced settings all from their standard bash terminals.',
    officialUrl: 'https://cursor.com',
    icon: 'layers',
    version: '0.45.2',
    installCommand: 'curl -fsSL https://cursor.sh/install-cli.sh | sh',
    isFeatured: false,
  },
  {
    name: 'docker-cli',
    displayName: 'Docker CLI',
    categorySlug: 'devops',
    description: 'Docker CLI is the industry-standard developer interface to local virtualization and pod isolation APIs. It enables quick deployment, health reviews, image builds, remote volume mounts, global container networks, and direct port maps for distributed backend microservices within tiny cloud pods.',
    officialUrl: 'https://docker.com',
    icon: 'container',
    version: '27.1.0',
    packageManager: 'brew',
    installCommand: 'brew install docker',
    isFeatured: false,
  },
  {
    name: 'github-cli',
    displayName: 'GitHub CLI',
    categorySlug: 'productivity',
    description: 'GitHub CLI (gh) is the official developer tool that lets you manage modern GitHub workflows directly from your command prompt. Create repos, clone forks, resolve PRs, run pipelines, and review workflow actions with single-line terminal triggers.',
    officialUrl: 'https://cli.github.com',
    icon: 'github',
    version: '2.50.0',
    packageManager: 'brew',
    installCommand: 'brew install gh',
    isFeatured: false,
  },
  {
    name: 'aws-cli',
    displayName: 'AWS CLI',
    categorySlug: 'cloud',
    description: 'The AWS Command Line Interface (AWS CLI) is a unified open-source tool that enables cloud architects to manage multiple global cloud systems from a single shell dashboard. Control compute nodes, manage identity roles, build network routers, and monitor log buckets across Amazon Web Services.',
    officialUrl: 'https://aws.amazon.com/cli/',
    icon: 'cloud',
    version: '2.16.8',
    packageManager: 'brew',
    installCommand: 'brew install awscli',
    isFeatured: false,
  },
  {
    name: 'kubectl',
    displayName: 'Kubectl',
    categorySlug: 'kubernetes',
    description: 'Kubectl is the command line master tool for communicating with a Kubernetes cluster control plane. Through custom YAML file updates, developers can inspect active virtual compute configurations, debug live container crashes, and adjust worker scaling limits.',
    officialUrl: 'https://kubernetes.io/docs/reference/kubectl/',
    icon: 'grid',
    version: '1.30.2',
    packageManager: 'brew',
    installCommand: 'brew install kubernetes-cli',
    isFeatured: false,
  },
  {
    name: 'ripgrep',
    displayName: 'ripgrep',
    categorySlug: 'productivity',
    description: 'ripgrep is a superior command line search utility written in Rust. It combines the sheer raw speed of Silver Searcher with smart default behaviors, prioritizing security, directory limits, filesizes, and custom matching patterns. It recursively searches directory files using clean regex, respecting gitignores by default.',
    officialUrl: 'https://github.com/BurntSushi/ripgrep',
    icon: 'search',
    version: '14.1.0',
    packageManager: 'brew',
    installCommand: 'brew install ripgrep',
    isFeatured: false,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // Build a category slug → _id map
    const allCategories = await Category.find({}).lean();
    const slugToId = {};
    for (const cat of allCategories) {
      slugToId[cat.slug] = cat._id;
    }

    let seeded = 0;
    let skipped = 0;

    for (const tool of tools) {
      const exists = await CliTool.findOne({ name: tool.name });
      if (exists) {
        console.log(`CLI tool already exists: ${tool.displayName}`);
        skipped++;
        continue;
      }

      const categoryId = slugToId[tool.categorySlug];
      if (!categoryId) {
        console.log(`Category not found for slug: ${tool.categorySlug} — skipping ${tool.displayName}`);
        skipped++;
        continue;
      }

      await CliTool.create({
        name: tool.name,
        displayName: tool.displayName,
        category: categoryId,
        description: tool.description,
        officialUrl: tool.officialUrl,
        downloadUrl: tool.downloadUrl,
        icon: tool.icon,
        version: tool.version,
        packageManager: tool.packageManager,
        installCommand: tool.installCommand,
        isFeatured: tool.isFeatured,
        isActive: true,
      });

      console.log(`Seeded CLI tool: ${tool.displayName}`);
      seeded++;
    }

    console.log(`\nDone. ${seeded} seeded, ${skipped} skipped.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
