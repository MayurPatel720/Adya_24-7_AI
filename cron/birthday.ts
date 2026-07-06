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
  console.log('[CRON] Birthday check — looking for customers with birthdays today...');

  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  console.log(`[CRON] Would query customers with birthday on ${month}-${day}`);
  console.log(`[CRON] For each, send birthday greeting with 15% discount code`);

  // Template
  const name = 'Customer';
  const message = [
    `🎂 *Happy Birthday, ${name}!*`,
    ``,
    `Wishing you a wonderful day filled with joy and laughter!`,
    ``,
    `To celebrate, here's *15% OFF* your next order.`,
    `Use code: *BIRTHDAY15*`,
    ``,
    `Shop now: ${STORE_URL}`,
    ``,
    `With love, Team ADYAWEAR 💛`,
  ].join('\n');

  console.log(`[CRON] Sample birthday message prepared`);
  console.log(`[CRON] Birthday cron complete`);
}

run().catch(console.error);
