import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const CATEGORY_MAP = {
  'api-client': 'Backend',
  'benchmarking': 'Testing',
  'code-analysis': 'Testing',
  'disk-usage': 'Productivity',
  'docker-tool': 'DevOps',
  'documentation': 'Productivity',
  'file-encryption': 'Security',
  'file-management': 'Productivity',
  'file-manager': 'Productivity',
  'file-transfer': 'Productivity',
  'fuzzy-finder': 'Productivity',
  'git-tool': 'Productivity',
  'json-tool': 'Backend',
  'logs': 'DevOps',
  'modern-unix-replacement': 'Productivity',
  'navigation': 'Productivity',
  'networking': 'DevOps',
  'shell-enhancement': 'Productivity',
  'shell-history': 'Productivity',
  'shell-prompt': 'Productivity',
  'system-monitoring': 'DevOps',
  'terminal-multiplexer': 'Productivity',
  'text-processing': 'Productivity',
  'ui-tool': 'Frontend',
  'yaml-tool': 'DevOps',
};

// Tools that were wrongly fuzzy-matched and need individual fixing
const TOOL_FIXES = {
  'topgrade': 'Productivity',    // system update tool, not AI
};

async function fixMappings() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/codeaptor');
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  // Load all categories
  const allCats = await db.collection('categories').find({}).toArray();
  const catBySlug = {};
  const catByName = {};
  for (const c of allCats) {
    catBySlug[c.slug] = c;
    catByName[c.name.toLowerCase()] = c;
  }

  // 1. Fix tools by name (individual overrides)
  for (const [toolName, targetCat] of Object.entries(TOOL_FIXES)) {
    const tc = catByName[targetCat.toLowerCase()];
    if (!tc) { console.log(`  ERROR: Target category "${targetCat}" not found`); continue; }
    const res = await db.collection('clitools').updateOne(
      { name: toolName },
      { $set: { category: tc._id } }
    );
    if (res.modifiedCount > 0) console.log(`  Fixed tool "${toolName}" -> ${targetCat}`);
    else console.log(`  Tool "${toolName}" not found or already correct`);
  }

  // 2. Remap all tools in new categories to the correct core category
  for (const [newSlug, targetName] of Object.entries(CATEGORY_MAP)) {
    const newCat = catBySlug[newSlug];
    const targetCat = catByName[targetName.toLowerCase()];
    if (!newCat) { console.log(`  SKIP: new category "${newSlug}" not found in DB`); continue; }
    if (!targetCat) { console.log(`  ERROR: target category "${targetName}" not found`); continue; }

    const result = await db.collection('clitools').updateMany(
      { category: newCat._id },
      { $set: { category: targetCat._id } }
    );
    if (result.modifiedCount > 0) {
      console.log(`  Moved ${result.modifiedCount} tools from "${newCat.name}" -> ${targetName}`);
    }
  }

  // 3. Delete all the new categories that were created by the fix script
  const slugsToDelete = Object.keys(CATEGORY_MAP);
  const deleteResult = await db.collection('categories').deleteMany({
    slug: { $in: slugsToDelete }
  });
  console.log(`\nDeleted ${deleteResult.deletedCount} auto-created categories`);

  // 4. Also check for any remaining tools that still reference deleted categories
  const orphaned = await db.collection('clitools').countDocuments({
    $expr: { $eq: [{ $type: '$category' }, 'string'] }
  });
  console.log(`Remaining string-category tools: ${orphaned}`);

  // Verify
  const allTools = await db.collection('clitools').find({}).toArray();
  const badCat = allTools.filter(t => typeof t.category === 'string');
  if (badCat.length > 0) {
    console.log(`\nWARNING: ${badCat.length} tools still have string categories:`);
    for (const t of badCat) console.log(`  ${t.name}: "${t.category}"`);
  } else {
    console.log('\nAll tools have valid ObjectId category references ✅');
  }

  const finalCats = await db.collection('categories').find({}).toArray();
  console.log(`Final category count: ${finalCats.length}`);

  await mongoose.disconnect();
}

fixMappings().catch(err => { console.error(err); process.exit(1); });
