import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-webhook-signature');

    if (!verifyWebhookSignature(signature, body)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const { from, message, messageId, timestamp } = data;

    logger.info('INCOMING', `Message from ${from}: ${message?.substring(0, 100)}`);

    // For now, just log it. In production, you'd forward to OpenClaw AI agent.
    // OpenClaw handles the AI response natively when configured.
    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error('INCOMING', 'Incoming message error', { error: err.message });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
