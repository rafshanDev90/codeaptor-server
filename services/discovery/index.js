import mongoose from 'mongoose';
import CliTool from '../../models/clitool.model.js';
import { MAX_CANDIDATES } from './config.js';
import discoverFromGitHub from './github.js';
import discoverFromNpm from './npm.js';
import extractWithMistral from './mistral.js';
import validateTool from './validator.js';
import handleRetrain from './retrain.js';

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default async function discover(dryRun = false) {
  // ── Load existing tools (dedup baseline) ──
  const existing = await CliTool.find({}, { name: 1 }).lean();
  const existingNames = new Set(existing.map(t => normalizeName(t.name)));
  console.log(`📦 Loaded ${existingNames.size} existing tools from DB\n`);

  // ── Discover ──
  console.log('🐙 Discovering from GitHub...');
  const ghCandidates = await discoverFromGitHub(existingNames);
  console.log(`   → ${ghCandidates.length} new candidates\n`);

  console.log('📦 Discovering from npm...');
  const npmCandidates = await discoverFromNpm(existingNames);
  console.log(`   → ${npmCandidates.length} new candidates\n`);

  // ── Merge, dedup intra-run, sort, limit ──
  let candidates = [...ghCandidates, ...npmCandidates];
  const intraDedup = new Set();
  candidates = candidates.filter(c => {
    if (intraDedup.has(c.name)) return false;
    intraDedup.add(c.name);
    return true;
  });
  candidates.sort((a, b) => b.stars - a.stars);
  candidates = candidates.slice(0, MAX_CANDIDATES);

  console.log(`🎯 Total unique candidates: ${candidates.length} (max ${MAX_CANDIDATES})\n`);

  if (candidates.length === 0) {
    console.log('✅ No new tools to add.');
    const retrainResult = await handleRetrain(mongoose, 0);
    return { inserted: 0, errors: 0, accumulated: retrainResult.accumulated };
  }

  // ── LLM extraction → validation → insert ──
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    process.stdout.write(`🤖 [${i + 1}/${candidates.length}] ${c.displayName} (${c.source})… `);

    try {
      const extracted = await extractWithMistral(c.rawData);
      const validation = await validateTool(extracted, existingNames);

      if (!validation.valid) {
        console.log(`❌ ${validation.errors.join(', ')}`);
        errors++;
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }

      existingNames.add(extracted.name);

      if (dryRun) {
        console.log(`✅ [DRY-RUN] ${extracted.category}`);
      } else {
        await CliTool.create({
          name: extracted.name,
          displayName: extracted.displayName,
          description: extracted.description,
          tagline: extracted.tagline,
          category: validation.categoryId,
          officialUrl: extracted.officialUrl,
          installCommand: extracted.installCommand,
          packageManager: extracted.packageManager,
          features: (extracted.features || []).map(f => ({ title: f, desc: '' })),
          isActive: true,
          status: 'Published',
        });
        console.log(`✅ ${extracted.category}`);
      }
      inserted++;
    } catch (e) {
      console.log(`❌ ${e.message}`);
      errors++;
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   ❌ Errors:   ${errors}`);

  if (dryRun) {
    console.log('\n🏁 Dry run complete — no changes written');
    return { inserted, errors, accumulated: 0 };
  }

  // ── Icon fetch ──
  if (inserted > 0) {
    console.log('\n🖼️  Fetching icons for new tools...');
    const { execSync } = await import('child_process');
    try {
      execSync('node scripts/fetch-icons.js', {
        cwd: new URL('../..', import.meta.url).pathname,
        stdio: 'inherit',
        timeout: 120000,
      });
      console.log('   ✅ Icons fetched');
    } catch (e) {
      console.error(`   ⚠ Icon fetch failed: ${e.message}`);
    }
  }

  // ── ML retrain ──
  console.log();
  const retrainResult = await handleRetrain(mongoose, inserted);

  return { inserted, errors, accumulated: retrainResult.accumulated };
}
