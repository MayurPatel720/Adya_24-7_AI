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
  console.log('[CRON] Abandoned cart check — looking for carts abandoned 1hr ago...');

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 1);

  console.log(`[CRON] Would query carts abandoned before ${cutoff.toISOString()}`);
  console.log(`[CRON] For each cart with phone number, send reminder`);

  const itemLines = `• Premium Viscose Saree × 1 — ₹1,299\n• Georgette Coord Set × 1 — ₹1,499`;
  const message = [
    `🛒 *You left items in your cart!*`,
    ``,
    `Hi there,`,
    `You have some beautiful pieces waiting for you:`,
    ``,
    itemLines,
    ``,
    `💰 Subtotal: ₹2,798`,
    ``,
    `Complete your order before they're gone!`,
    `${STORE_URL}/cart`,
  ].join('\n');

  console.log(`[CRON] Sample abandoned cart message prepared`);
  console.log(`[CRON] Abandoned cart cron complete`);
}

run().catch(console.error);
