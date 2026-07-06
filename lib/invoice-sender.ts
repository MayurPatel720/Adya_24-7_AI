import { sendWhatsAppDocument, sendWhatsAppMessage } from './openclaw';
import { appendLog, generateId } from './db';
import { logger } from './logger';

export async function sendInvoiceViaWhatsApp(
  customerPhone: string,
  orderId: string,
  invoicePdfBase64: string,
  fileName: string
): Promise<boolean> {
  const caption = `📄 Invoice for order #${orderId}\n\nThank you for shopping with ADYAWEAR!`;

  const success = await sendWhatsAppDocument(
    customerPhone,
    invoicePdfBase64,
    fileName,
    caption
  );

  appendLog({
    id: generateId(),
    to: customerPhone,
    event: 'invoice_sent',
    template: 'invoice',
    status: success ? 'sent' : 'failed',
    error: success ? undefined : 'Failed to send invoice document',
    timestamp: new Date().toISOString(),
    orderId,
  });

  if (success) {
    logger.info('INVOICE', `Invoice sent for order ${orderId} to ${customerPhone}`);
  } else {
    logger.error('INVOICE', `Failed to send invoice for order ${orderId}`);
  }

  return success;
}

export async function sendTextMessage(
  customerPhone: string,
  text: string,
  event: string,
  orderId?: string
): Promise<boolean> {
  const success = await sendWhatsAppMessage({ to: customerPhone, text });

  appendLog({
    id: generateId(),
    to: customerPhone,
    event,
    template: event,
    status: success ? 'sent' : 'failed',
    timestamp: new Date().toISOString(),
    orderId,
  });

  return success;
}
