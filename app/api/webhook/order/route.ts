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
      logger.warn('WEBHOOK', 'Order event missing phone number', { event });
      return NextResponse.json({ success: true, message: 'No phone — skipped' });
    }

    const phone = order.shippingAddress.phone;
    let message = '';
    let templateName = '';

    switch (event) {
      case 'customer.created':
        message = templates.welcome(order.shippingAddress.fullName || 'there');
        templateName = 'welcome';
        break;
      case 'order.created':
        message = templates.orderPlaced(order);
        templateName = 'order_placed';
        break;
      case 'payment.success':
        message = templates.paymentReceived(order);
        templateName = 'payment_received';
        break;
      case 'order.confirmed':
        message = templates.orderConfirmed(order);
        templateName = 'order_confirmed';
        break;
      default:
        logger.info('WEBHOOK', `Unknown order event: ${event}`);
        return NextResponse.json({ success: true, message: 'Event not handled' });
    }

    // Fire-and-forget — don't block the response
    sendTextMessage(phone, message, templateName, order.orderId).catch((err) => {
      logger.error('WEBHOOK', `Failed to send ${templateName}`, { error: err.message });
    });

    return NextResponse.json({ success: true, event, orderId: order.orderId });
  } catch (err: any) {
    logger.error('WEBHOOK', 'Order webhook error', { error: err.message });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
