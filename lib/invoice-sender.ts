import { sendTextMessage as sendWhatsAppText, sendDocumentMessage, uploadMedia } from './whatsapp';
import { logger } from './logger';

export async function sendInvoiceViaWhatsApp(
  customerPhone: string,
  orderId: string,
  invoicePdfBase64: string,
  fileName: string
): Promise<boolean> {
  const caption = `Invoice for order #${orderId}\n\nThank you for shopping with ADYAWEAR!`;
  const buffer = Buffer.from(invoicePdfBase64, 'base64');

  const mediaId = await uploadMedia(buffer, 'application/pdf');
  if (!mediaId) {
    logger.error('INVOICE', `Failed to upload invoice for order ${orderId}`);
    return false;
  }

  const success = await sendDocumentMessage(customerPhone, mediaId, fileName, caption);

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
  const success = await sendWhatsAppText(customerPhone, text);

  if (success) {
    logger.info(event, `Message sent to ${customerPhone}`, { orderId });
  } else {
    logger.error(event, `Failed to send to ${customerPhone}`);
  }

  return success;
}
