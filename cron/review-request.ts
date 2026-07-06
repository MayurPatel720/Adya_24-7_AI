const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.ADMIN_API_KEY || 'adyawear_admin_2026';
const DELAY_DAYS = parseInt(process.env.REVIEW_REQUEST_DELAY_DAYS || '5');

async function sendMessage(to: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/whatsapp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({ to, message: text }),
    });
    return res.ok;
  } catch { return false; }
}

async function run() {
  console.log(`[CRON] Review request — checking orders delivered ${DELAY_DAYS} days ago...`);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DELAY_DAYS);
  console.log(`[CRON] Would fetch orders delivered before ${cutoff.toISOString()}`);
  console.log(`[CRON] Review request cron complete`);
}

run().catch(console.error);
