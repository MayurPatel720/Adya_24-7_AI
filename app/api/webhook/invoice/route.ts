import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/auth';
import { sendInvoiceViaWhatsApp } from '@/lib/invoice-sender';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-webhook-signature');

    if (!verifyWebhookSignature(signature, body)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const { invoice } = data;

    if (!invoice?.customerPhone || !invoice?.invoicePdfBase64) {
      return NextResponse.json({ error: 'Missing phone or invoice data' }, { status: 400 });
    }

    const success = await sendInvoiceViaWhatsApp(
      invoice.customerPhone,
      invoice.orderId,
      invoice.invoicePdfBase64,
      invoice.fileName || `invoice-${invoice.orderId}.pdf`
    );

    return NextResponse.json({ success, orderId: invoice.orderId });
  } catch (err: any) {
    logger.error('WEBHOOK-INVOICE', 'Invoice webhook error', { error: err.message });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
