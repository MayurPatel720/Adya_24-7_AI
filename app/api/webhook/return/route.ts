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
    const { returnData } = data;

    if (!returnData?.customerPhone) {
      return NextResponse.json({ success: true, message: 'No phone — skipped' });
    }

    const name = returnData.customerName || 'there';
    const orderId = String(returnData.orderId || '');
    const status = String(returnData.status || '');
    const details = returnData.adminNote || 'Your return request has been received and is being processed.';
    const refund =
      returnData.refundAmount != null
        ? '₹' + returnData.refundAmount.toLocaleString('en-IN')
        : status === 'completed'
          ? 'Refund will be initiated'
          : 'To be confirmed';

    sendMessageTemplate(returnData.customerPhone, 'return_update', [name, orderId, status, details, refund], 'return_update', orderId).catch((err) => {
      logger.error('WEBHOOK-RETURN', 'Failed to send return_update', { error: err.message });
    });

    return NextResponse.json({ success: true, orderId });
  } catch (err: any) {
    logger.error('WEBHOOK-RETURN', 'Return webhook error', { error: err.message });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}