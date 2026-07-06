const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.ADMIN_API_KEY || 'adyawear_admin_2026';
const STORE_API = process.env.ADYAWEAR_STORE_API || 'https://www.adyawear.in/api';
const DELAY_DAYS = parseInt(process.env.FOLLOWUP_DELAY_DAYS || '3');

async function sendMessage(to: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/whatsapp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({ to, message: text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function run() {
  console.log(`[CRON] Post-delivery follow-up — checking orders delivered ${DELAY_DAYS} days ago...`);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DELAY_DAYS);

  // TODO: Fetch delivered orders from ADYAWEAR API
  // const orders = await fetch(`${STORE_API}/orders/delivered?before=${cutoff.toISOString()}`);
  
  console.log(`[CRON] Would fetch orders delivered before ${cutoff.toISOString()}`);
  console.log(`[CRON] For each order, send care tips + review request`);
  console.log(`[CRON] Follow-up cron complete`);
}

run().catch(console.error);
