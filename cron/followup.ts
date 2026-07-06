const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || '';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '';
const STORE_API = process.env.ADYAWEAR_STORE_API || 'https://www.adyawear.in/api';
const DELAY_DAYS = parseInt(process.env.FOLLOWUP_DELAY_DAYS || '3');

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
  console.log(`[CRON] Post-delivery follow-up — checking orders delivered ${DELAY_DAYS} days ago...`);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DELAY_DAYS);

  // In production, fetch delivered orders from ADYAWEAR API
  // For now, this is a placeholder that logs the intent
  console.log(`[CRON] Would fetch orders delivered before ${cutoff.toISOString()}`);
  console.log(`[CRON] For each order, send care tips + review request`);
  console.log(`[CRON] Follow-up cron complete`);
}

run().catch(console.error);
