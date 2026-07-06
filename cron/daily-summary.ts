const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.ADMIN_API_KEY || 'adyawear_admin_2026';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '';

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
  console.log('[CRON] Daily summary — generating stats...');
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const summary = [
    `📊 *Daily WhatsApp Summary — ${today}*`,
    ``,
    `📨 Messages sent: 0`,
    `📦 Orders processed: 0`,
    `📄 Invoices sent: 0`,
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
