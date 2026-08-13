import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/auth';
import { sendMessageTemplate } from '@/lib/invoice-sender';
import { logger } from '@/lib/logger';

function fmtINR(n: number | undefined): string {
  return '₹' + (n ?? 0).toLocaleString('en-IN');
}

function fmtDate(input: string | undefined): string {
  if (!input) return 'within 7 days';
  const d = new Date(input);
  if (isNaN(d.getTime())) return input;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-webhook-signature');

    if (!verifyWebhookSignature(signature, body)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const { event, order } = data;

    if (!order?.shippingAddress?.phone) {
      logger.warn('WEBHOOK', 'Order event missing phone number', { event });
      return NextResponse.json({ success: true, message: 'No phone — skipped' });
    }

    const phone = order.shippingAddress.phone;
    const name = order.shippingAddress.fullName || 'there';
    let templateKey = '';
    let params: string[] = [];

    switch (event) {
      case 'customer.created':
        templateKey = 'welcome';
        params = [name];
        break;
      case 'order.created':
        templateKey = 'order_placed';
        params = [name, String(order.orderId), fmtINR(order.total), fmtDate(order.estimatedDelivery)];
        break;
      case 'payment.success':
        templateKey = 'payment_received';
        params = [name, fmtINR(order.total), String(order.orderId), fmtDate(order.createdAt)];
        break;
      case 'order.confirmed':
        templateKey = 'order_placed';
        params = [name, String(order.orderId), fmtINR(order.total), fmtDate(order.estimatedDelivery)];
        break;
      default:
        logger.info('WEBHOOK', `Unknown order event: ${event}`);
        return NextResponse.json({ success: true, message: 'Event not handled' });
    }

    sendMessageTemplate(phone, templateKey, params, templateKey, order.orderId).catch((err) => {
      logger.error('WEBHOOK', `Failed to send ${templateKey}`, { error: err.message });
    });

    return NextResponse.json({ success: true, event, orderId: order.orderId });
  } catch (err: any) {
    logger.error('WEBHOOK', 'Order webhook error', { error: err.message });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}