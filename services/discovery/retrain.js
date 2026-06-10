import { RETRAIN_THRESHOLD } from './config.js';

export default async function handleRetrain(mongoose, insertedCount) {
  if (insertedCount === 0) {
    console.log('  🧠 No new tools — skipping ML retrain check');
    return { inserted: 0, accumulated: 0 };
  }

  const coll = mongoose.connection.db.collection('system');
  const counterDoc = await coll.findOneAndUpdate(
    { _id: 'ml_accumulated_new_tools' },
    { $inc: { value: insertedCount } },
    { upsert: true, returnDocument: 'after' },
  );

  const total = counterDoc?.value?.value ?? insertedCount;
  console.log(`  🧠 ML retrain counter: ${total}/${RETRAIN_THRESHOLD}`);

  if (total >= RETRAIN_THRESHOLD) {
    console.log('  🚀 Threshold reached! Triggering ML retrain on VPS...');
    await coll.updateOne({ _id: 'ml_accumulated_new_tools' }, { $set: { value: 0 } });

    const { VPS_HOST, VPS_USER, VPS_SSH_KEY, VPS_DEPLOY_PATH } = process.env;
    const deployPath = VPS_DEPLOY_PATH || '/var/www/amz';

    if (VPS_HOST && VPS_USER && VPS_SSH_KEY) {
      const { writeFileSync, rmSync } = await import('fs');
      const { execSync } = await import('child_process');
      const keyPath = '/tmp/vps_ssh_key';
      writeFileSync(keyPath, VPS_SSH_KEY.trimEnd() + '\n', { mode: 0o600 });

      const cmds = [
        `cd ${deployPath}/ml-service`,
        'source .venv/bin/activate 2>/dev/null || python3 -m venv .venv && source .venv/bin/activate',
        'pip install -r requirements.txt -q',
        `sed -i 's/DB_NAME = "myapp"/DB_NAME = "clitool"/' scripts/train.py 2>/dev/null; true`,
        'python scripts/train.py',
        'sudo systemctl restart ml-inference 2>/dev/null; echo "ML service restart: $?"',
      ].join(' && ');

      try {
        execSync(
          `ssh -i ${keyPath} -o StrictHostKeyChecking=no -o ConnectTimeout=15 ${VPS_USER}@${VPS_HOST} '${cmds}'`,
          { timeout: 300000, stdio: 'inherit' },
        );
        console.log('  ✅ ML retrain completed successfully');
      } catch (e) {
        console.error(`  ❌ ML retrain failed: ${e.message}`);
      } finally {
        try { rmSync(keyPath); } catch { /* ok */ }
      }
    } else {
      console.log('  ⚠ VPS SSH vars not set. Skipping ML retrain.');
    }
  }

  return { inserted: insertedCount, accumulated: total };
}
