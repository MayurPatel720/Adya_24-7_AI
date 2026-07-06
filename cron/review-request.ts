const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || '';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '';
const STORE_API = process.env.ADYAWEAR_STORE_API || 'https://www.adyawear.in/api';
const DELAY_DAYS = parseInt(process.env.REVIEW_REQUEST_DELAY_DAYS || '5');

async function sendMessage(to: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/whatsapp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify({ to, text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function run() {
  console.log(`[CRON] Review request — checking orders delivered ${DELAY_DAYS} days ago...`);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DELAY_DAYS);

  console.log(`[CRON] Would fetch orders delivered before ${cutoff.toISOString()}`);
  console.log(`[CRON] For each order, send review request with product-specific link`);
  console.log(`[CRON] Review request cron complete`);
}

run().catch(console.error);
