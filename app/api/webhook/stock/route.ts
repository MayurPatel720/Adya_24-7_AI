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
    const { stock } = data;

    if (!stock?.customerPhone) {
      return NextResponse.json({ success: true, message: 'No phone — skipped' });
    }

    const name = stock.customerName || 'there';

    sendMessageTemplate(stock.customerPhone, 'back_in_stock', [name, String(stock.productName || '')], 'back_in_stock', '').catch((err) => {
      logger.error('WEBHOOK-STOCK', 'Failed to send back_in_stock', { error: err.message });
    });

    return NextResponse.json({ success: true, productName: stock.productName });
  } catch (err: any) {
    logger.error('WEBHOOK-STOCK', 'Stock webhook error', { error: err.message });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}