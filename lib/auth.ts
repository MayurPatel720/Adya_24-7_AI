import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

export function verifyWebhookSignature(signature: string | null, body: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('[AUTH] WEBHOOK_SECRET not set — skipping verification');
    return true;
  }

  if (!signature) return false;

  try {
    const expected = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

export function verifyAdminApiKey(apiKey: string | null): boolean {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return true;
  return apiKey === expected;
}
