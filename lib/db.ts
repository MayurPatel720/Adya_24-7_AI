import { getWhatsAppSession } from './whatsapp';

export function getLogStats() {
  try {
    const session = getWhatsAppSession();
    return session.getStats();
  } catch {
    return { total: 0, sent: 0, received: 0, failed: 0 };
  }
}

export function getMessageLogs(limit = 50) {
  try {
    const session = getWhatsAppSession();
    const messages = session.getMessages();
    return messages.slice(-limit).reverse();
  } catch {
    return [];
  }
}
