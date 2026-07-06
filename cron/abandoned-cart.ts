const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.ADMIN_API_KEY || 'adyawear_admin_2026';
const STORE_URL = process.env.ADYAWEAR_STORE_URL || 'https://www.adyawear.in';

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
  console.log('[CRON] Abandoned cart check — looking for carts abandoned 1hr ago...');
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 1);
  console.log(`[CRON] Would query carts abandoned before ${cutoff.toISOString()}`);
  console.log(`[CRON] Abandoned cart cron complete`);
}

run().catch(console.error);
