import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/auth';
import { sendMessageTemplate } from '@/lib/invoice-sender';
import { logger } from '@/lib/logger';

function fmtDate(input: string | undefined): string {
  if (!input) return 'within 7 days';
  const d = new Date(input);
  if (isNaN(d.getTime())) return input;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STORE_URL = process.env.ADYAWEAR_STORE_URL || 'https://www.adyawear.in';

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
    const name = order.shippingAddress.fullName || 'there';
    const orderId = String(order.orderId || '');
    let templateKey = '';
    let params: string[] = [];

    switch (event) {
      case 'order.shipped': {
        const tracking = order.awbNumber
          ? `${order.courierName || 'Courier'} • ${order.awbNumber}`
          : order.trackingUrl || 'On its way to you';
        templateKey = 'order_shipped';
        params = [name, orderId, tracking, fmtDate(order.estimatedDelivery)];
        break;
      }
      case 'order.out_for_delivery': {
        const addr = [order.shippingAddress.line1, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.pincode]
          .filter(Boolean)
          .join(', ');
        templateKey = 'out_for_delivery';
        params = [name, orderId, addr || 'your address', phone];
        break;
      }
      case 'order.delivered':
        templateKey = 'order_delivered';
        params = [name, orderId, fmtDate(new Date().toISOString()), `${STORE_URL}/account/orders/${orderId}`];
        break;
      case 'order.cancelled':
        templateKey = 'order_cancelled';
        params = [name, orderId];
        break;
      default:
        return NextResponse.json({ success: true, message: 'Event not handled' });
    }

    sendMessageTemplate(phone, templateKey, params, templateKey, orderId).catch((err) => {
      logger.error('WEBHOOK-SHIP', `Failed to send ${templateKey}`, { error: err.message });
    });

    return NextResponse.json({ success: true, event, orderId });
  } catch (err: any) {
    logger.error('WEBHOOK-SHIP', 'Shipping webhook error', { error: err.message });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}