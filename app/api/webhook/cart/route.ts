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
    const { cart } = data;

    if (!cart?.customerPhone) {
      return NextResponse.json({ success: true, message: 'No phone — skipped' });
    }

    const name = cart.customerName || 'there';
    const itemsText = Array.isArray(cart.items)
      ? cart.items.map((i: any) => `${i.name} x${i.quantity}`).slice(0, 4).join(', ')
      : '';
    const total = '₹' + (cart.subtotal ?? cart.total ?? 0).toLocaleString('en-IN');

    sendMessageTemplate(cart.customerPhone, 'abandoned_cart', [name, itemsText, total], 'abandoned_cart', '').catch((err) => {
      logger.error('WEBHOOK-CART', 'Failed to send abandoned_cart', { error: err.message });
    });

    return NextResponse.json({ success: true, userId: cart.userId });
  } catch (err: any) {
    logger.error('WEBHOOK-CART', 'Cart webhook error', { error: err.message });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}