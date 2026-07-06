import { WhatsAppMessage } from '@/types';

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:3001';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '';

export async function sendWhatsAppMessage(msg: WhatsAppMessage): Promise<boolean> {
  try {
    const payload: Record<string, any> = {
      to: msg.to,
    };

    if (msg.text) {
      payload.text = msg.text;
    }

    if (msg.imageUrl) {
      payload.media = { url: msg.imageUrl, type: 'image' };
      if (msg.caption) payload.media.caption = msg.caption;
    }

    if (msg.documentUrl) {
      payload.media = { url: msg.documentUrl, type: 'document', filename: msg.documentName || 'document.pdf' };
      if (msg.caption) payload.media.caption = msg.caption;
    }

    const res = await fetch(`${GATEWAY_URL}/api/whatsapp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[OPENCLAW] Send failed:', res.status, err);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[OPENCLAW] Send error:', err);
    return false;
  }
}

export async function checkOpenClawStatus(): Promise<{ connected: boolean; details?: any }> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/health`, {
      headers: { 'Authorization': `Bearer ${GATEWAY_TOKEN}` },
    });

    if (!res.ok) return { connected: false };

    const data = await res.json();
    return { connected: true, details: data };
  } catch {
    return { connected: false };
  }
}

export async function sendWhatsAppDocument(
  to: string,
  documentBase64: string,
  fileName: string,
  caption?: string
): Promise<boolean> {
  try {
    const payload: Record<string, any> = {
      to,
      media: {
        type: 'document',
        data: documentBase64,
        filename: fileName,
      },
    };

    if (caption) payload.media.caption = caption;

    const res = await fetch(`${GATEWAY_URL}/api/whatsapp/send-media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (err) {
    console.error('[OPENCLAW] Document send error:', err);
    return false;
  }
}
