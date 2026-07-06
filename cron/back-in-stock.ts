const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || '';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '';
const STORE_URL = process.env.ADYAWEAR_STORE_URL || 'https://www.adyawear.in';

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
  console.log('[CRON] Back-in-stock check — looking for restocked wishlist items...');

  console.log(`[CRON] Would query products that were out of stock and are now restocked`);
  console.log(`[CRON] For each customer who wished for it, send notification`);

  const message = [
    `🔔 *Back in Stock!*`,
    ``,
    `Good news! *Premium Viscose Saree* that you were interested in is back in stock!`,
    ``,
    `Grab it before it sells out again:`,
    `${STORE_URL}/products/premium-viscose-saree`,
  ].join('\n');

  console.log(`[CRON] Sample back-in-stock message prepared`);
  console.log(`[CRON] Back-in-stock cron complete`);
}

run().catch(console.error);
