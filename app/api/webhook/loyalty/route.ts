import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/auth';
import { sendTextMessage } from '@/lib/invoice-sender';
import * as templates from '@/lib/whatsapp-templates';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-webhook-signature');

    if (!verifyWebhookSignature(signature, body)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const { loyalty } = data;

    if (!loyalty?.customerPhone) {
      return NextResponse.json({ success: true, message: 'No phone — skipped' });
    }

    const message = templates.loyaltyPoints(loyalty);

    sendTextMessage(loyalty.customerPhone, message, 'loyalty_points', loyalty.orderId).catch(() => {});

    return NextResponse.json({ success: true, orderId: loyalty.orderId });
  } catch (err: any) {
    logger.error('WEBHOOK-LOYALTY', 'Loyalty webhook error', { error: err.message });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
