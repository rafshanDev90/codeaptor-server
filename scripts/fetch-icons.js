import mongoose from 'mongoose';
import CliTool from '../models/clitool.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/clitool';
const ICON_BASE = 'https://geticon.dev/?url=';

function extractDomain(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

async function checkIcon(domain) {
  const url = `${ICON_BASE}${domain}`;
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000), redirect: 'follow' });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.startsWith('image/')) return url;
    return null;
  } catch {
    return null;
  }
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const tools = await CliTool.find({ officialUrl: { $exists: true, $ne: '' } }).lean();
  console.log(`Found ${tools.length} tools with officialUrl`);

  let updated = 0;
  let skipped = 0;

  for (const tool of tools) {
    if (tool.iconUrl) {
      console.log(`  SKIP ${tool.name} — already has iconUrl`);
      skipped++;
      continue;
    }

    const domain = extractDomain(tool.officialUrl);
    if (!domain) {
      console.log(`  SKIP ${tool.name} — could not parse domain from ${tool.officialUrl}`);
      skipped++;
      continue;
    }

    console.log(`  CHECK ${tool.name} (${domain})...`);
    const iconUrl = await checkIcon(domain);
    if (iconUrl) {
      await CliTool.updateOne({ _id: tool._id }, { $set: { iconUrl } });
      console.log(`    ✅ ${iconUrl}`);
      updated++;
    } else {
      console.log(`    ❌ no icon`);
      skipped++;
    }

    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
