/**
 * discover-cli-tools.js — Entry point for CLI tool discovery pipeline.
 *
 * Environment variables:
 *   MONGO_URI        (required) MongoDB connection string
 *   MISTRAL_API_KEY  (required) Mistral AI API key
 *   GITHUB_TOKEN     (optional) GitHub token for higher rate limits
 *   VPS_HOST         (optional) VPS IP/hostname for ML retrain SSH
 *   VPS_USER         (optional) SSH username for ML retrain
 *   VPS_SSH_KEY      (optional) SSH private key for ML retrain
 *   VPS_DEPLOY_PATH  (optional) Deploy path on VPS (default: /var/www/amz)
 *
 * Usage:
 *   node scripts/discover-cli-tools.js          # Run pipeline
 *   node scripts/discover-cli-tools.js --dry-run  # Preview only, no writes
 */

import mongoose from 'mongoose';
import discover from '../services/discovery/index.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/clitool';
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`🔍 Starting CLI tool discovery${DRY_RUN ? ' (DRY RUN)' : ''}...\n`);

  if (!process.env.MISTRAL_API_KEY) {
    console.error('❌ MISTRAL_API_KEY environment variable is required');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log(`📦 Connected to MongoDB`);

  const result = await discover(DRY_RUN);

  console.log('\n##SUMMARY## ' + JSON.stringify(result));
  console.log('\n✅ Discovery complete');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
