const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || '';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '';

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
  console.log('[CRON] Daily summary — generating stats...');

  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  // In production, fetch stats from ADYAWEAR API
  const stats = {
    date: today,
    messagesSent: 0,
    ordersProcessed: 0,
    invoicesSent: 0,
  };

  const summary = [
    `📊 *Daily WhatsApp Summary — ${today}*`,
    ``,
    `📨 Messages sent: ${stats.messagesSent}`,
    `📦 Orders processed: ${stats.ordersProcessed}`,
    `📄 Invoices sent: ${stats.invoicesSent}`,
  ].join('\n');

  if (ADMIN_PHONE) {
    await sendMessage(ADMIN_PHONE, summary);
    console.log('[CRON] Summary sent to admin');
  } else {
    console.log('[CRON] ADMIN_PHONE not set — summary logged only');
    console.log(summary);
  }

  console.log('[CRON] Daily summary complete');
}

run().catch(console.error);
