import { getWhatsAppSession } from './whatsapp';
import { logger } from './logger';

export async function sendInvoiceViaWhatsApp(
  customerPhone: string,
  orderId: string,
  invoicePdfBase64: string,
  fileName: string
): Promise<boolean> {
  const caption = `📄 Invoice for order #${orderId}\n\nThank you for shopping with ADYAWEAR!`;
  const session = getWhatsAppSession();
  
  const buffer = Buffer.from(invoicePdfBase64, 'base64');
  const success = await session.sendDocument(customerPhone, buffer, fileName, 'application/pdf');

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
  const session = getWhatsAppSession();
  const success = await session.sendMessage(customerPhone, text);

  if (success) {
    logger.info(event, `Message sent to ${customerPhone}`, { orderId });
  } else {
    logger.error(event, `Failed to send to ${customerPhone}`);
  }

  return success;
}
