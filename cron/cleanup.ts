import { cleanupOldMessages } from '../lib/db';

async function run() {
  console.log('[CRON] Running 14-day message cleanup...');
  const deleted = cleanupOldMessages();
  console.log(`[CRON] Cleanup complete. Deleted ${deleted} old messages.`);
}

run().catch((err) => {
  console.error('[CRON] Cleanup failed:', err);
  process.exit(1);
});
