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
    const { event, order } = data;

    if (!order?.shippingAddress?.phone) {
      return NextResponse.json({ success: true, message: 'No phone — skipped' });
    }

    const phone = order.shippingAddress.phone;
    let message = '';
    let templateName = '';

    switch (event) {
      case 'order.shipped':
        message = templates.shipped(order);
        templateName = 'shipped';
        break;
      case 'order.out_for_delivery':
        message = templates.outForDelivery(order);
        templateName = 'out_for_delivery';
        break;
      case 'order.delivered':
        message = templates.delivered(order);
        templateName = 'delivered';
        break;
      case 'order.cancelled':
        message = `❌ *Order Cancelled*\n\nHi ${order.shippingAddress.fullName},\n\nYour order #${order.orderId} has been cancelled.\n\nIf this was a mistake, please contact us.`;
        templateName = 'cancelled';
        break;
      default:
        return NextResponse.json({ success: true, message: 'Event not handled' });
    }

    sendTextMessage(phone, message, templateName, order.orderId).catch(() => {});

    return NextResponse.json({ success: true, event, orderId: order.orderId });
  } catch (err: any) {
    logger.error('WEBHOOK-SHIP', 'Shipping webhook error', { error: err.message });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
