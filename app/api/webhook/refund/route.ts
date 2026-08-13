import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/auth';
import { sendMessageTemplate } from '@/lib/invoice-sender';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-webhook-signature');

    if (!verifyWebhookSignature(signature, body)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const { refund } = data;

    if (!refund?.customerPhone) {
      return NextResponse.json({ success: true, message: 'No phone — skipped' });
    }

    const name = refund.customerName || 'there';
    const orderId = String(refund.orderId || '');
    const amount = '₹' + (refund.refundAmount ?? 0).toLocaleString('en-IN');
    const expectedBy = 'within 5-7 business days';

    sendMessageTemplate(refund.customerPhone, 'refund_processed', [name, orderId, amount, expectedBy], 'refund_processed', orderId).catch((err) => {
      logger.error('WEBHOOK-REFUND', `Failed to send refund_processed`, { error: err.message });
    });

    return NextResponse.json({ success: true, orderId });
  } catch (err: any) {
    logger.error('WEBHOOK-REFUND', 'Refund webhook error', { error: err.message });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}