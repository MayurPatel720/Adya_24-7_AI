import { sendTextMessage, sendDocumentMessage, verifyToken } from './whatsapp';

export async function sendWhatsAppMessage(params: { to: string; text: string }): Promise<boolean> {
  return sendTextMessage(params.to, params.text);
}

export async function sendWhatsAppDocument(
  to: string,
  base64Data: string,
  fileName: string,
  caption?: string
): Promise<boolean> {
  const buffer = Buffer.from(base64Data, 'base64');
  const mediaId = await uploadMedia(buffer, 'application/pdf');
  if (!mediaId) return false;
  return sendDocumentMessage(to, mediaId, fileName, caption);
}

export async function checkConnection(): Promise<boolean> {
  return verifyToken();
}

async function uploadMedia(buffer: Buffer, mimeType: string): Promise<string | null> {
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
  const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v23.0';
  const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) return null;

  const formData = new FormData();
  const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  formData.append('file', new Blob([ab], { type: mimeType }), 'file');
  formData.append('messaging_product', 'whatsapp');
  formData.append('type', mimeType);

  try {
    const res = await fetch(`${BASE_URL}/${PHONE_NUMBER_ID}/media`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` },
      body: formData,
    });
    const data = await res.json();
    return data.id || null;
  } catch {
    return null;
  }
}
