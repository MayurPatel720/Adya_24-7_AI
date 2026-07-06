import { getWhatsAppSession } from './whatsapp';

export async function sendWhatsAppMessage(params: { to: string; text: string }): Promise<boolean> {
  const session = getWhatsAppSession();
  return session.sendMessage(params.to, params.text);
}

export async function sendWhatsAppDocument(
  to: string,
  base64Data: string,
  fileName: string,
  caption?: string
): Promise<boolean> {
  const session = getWhatsAppSession();
  const buffer = Buffer.from(base64Data, 'base64');
  return session.sendDocument(to, buffer, fileName, 'application/pdf');
}

export async function checkConnection(): Promise<boolean> {
  const session = getWhatsAppSession();
  return session.getStatus() === 'connected';
}
