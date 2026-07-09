import { saveMessage } from './db';

const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v23.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

interface TemplateParam {
  type: 'text';
  text: string;
}

interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters: TemplateParam[];
}

interface SendTemplatePayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: { code: string };
    components?: TemplateComponent[];
  };
}

interface SendTextPayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: { body: string };
}

interface SendImagePayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'image';
  image: { link: string; caption?: string };
}

interface SendDocumentPayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'document';
  document: { link: string; filename: string; caption?: string };
}

export interface WhatsAppMessage {
  to: string;
  text?: string;
  imageUrl?: string;
  documentUrl?: string;
  documentName?: string;
  caption?: string;
}

export interface MessageLog {
  id: string;
  from: string;
  to: string;
  body: string;
  type: 'sent' | 'received';
  timestamp: number;
  status: 'delivered' | 'read' | 'failed';
  template?: string;
}

function headers(): Record<string, string> {
  return {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

export async function sendTextMessage(to: string, text: string): Promise<boolean> {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.error('WhatsApp credentials not configured');
    return false;
  }

  const payload: SendTextPayload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  };

  try {
    const res = await fetch(`${BASE_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.error) {
      console.error('WhatsApp send error:', data.error);
      return false;
    }
    saveMessage(to, 'sent', text, 'text');
    return true;
  } catch (err) {
    console.error('WhatsApp send failed:', err);
    return false;
  }
}

export async function sendTemplateMessage(
  to: string,
  templateName: string,
  params: string[],
  langCode: string = 'en'
): Promise<boolean> {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.error('WhatsApp credentials not configured');
    return false;
  }

  const bodyParams: TemplateParam[] = params.map((p) => ({
    type: 'text' as const,
    text: p,
  }));

  const payload: SendTemplatePayload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: langCode },
      components: [
        {
          type: 'body',
          parameters: bodyParams,
        },
      ],
    },
  };

  try {
    const res = await fetch(`${BASE_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.error) {
      console.error('WhatsApp template send error:', data.error);
      return false;
    }
    console.log(`Template ${templateName} sent to ${to}`);
    saveMessage(to, 'sent', `[Template: ${templateName}] ${params.join(', ')}`, 'template', templateName);
    return true;
  } catch (err) {
    console.error('WhatsApp template send failed:', err);
    return false;
  }
}

export async function sendImageMessage(to: string, imageUrl: string, caption?: string): Promise<boolean> {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) return false;

  const payload: SendImagePayload = {
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: { link: imageUrl, caption },
  };

  try {
    const res = await fetch(`${BASE_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return !data.error;
  } catch {
    return false;
  }
}

export async function sendDocumentMessage(
  to: string,
  documentUrl: string,
  filename: string,
  caption?: string
): Promise<boolean> {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) return false;

  const payload: SendDocumentPayload = {
    messaging_product: 'whatsapp',
    to,
    type: 'document',
    document: { link: documentUrl, filename, caption },
  };

  try {
    const res = await fetch(`${BASE_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return !data.error;
  } catch {
    return false;
  }
}

export async function uploadMedia(buffer: Buffer, mimeType: string): Promise<string | null> {
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

export async function verifyToken(): Promise<boolean> {
  if (!ACCESS_TOKEN) return false;

  try {
    const res = await fetch(`${BASE_URL}/me?access_token=${ACCESS_TOKEN}`);
    const data = await res.json();
    return !!data.id;
  } catch {
    return false;
  }
}

export async function getPhoneNumberInfo(): Promise<Record<string, unknown> | null> {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) return null;

  try {
    const res = await fetch(`${BASE_URL}/${PHONE_NUMBER_ID}`, {
      headers: headers(),
    });
    return await res.json();
  } catch {
    return null;
  }
}

// Template name mapping for Cloud API
export const TEMPLATE_NAMES = {
  welcome: 'welcome_premium',
  order_placed: 'order_confirm_premium',
  payment_received: 'payment_confirm_premium',
  order_shipped: 'order_shipped_premium',
  out_for_delivery: 'out_for_delivery_premium',
  order_delivered: 'order_delivered_premium',
  refund_processed: 'refund_status_premium',
  return_update: 'return_status_premium',
  review_request: 'review_ask_premium',
  birthday_greeting: 'birthday_wish_premium',
  abandoned_cart: 'cart_reminder_premium',
  back_in_stock: 'back_in_stock_premium',
  loyalty_points: 'loyalty_reward_premium',
  care_tips: 'care_tips_premium',
  wholesale_update: 'wholesale_status_premium',
} as const;

export type TemplateKey = keyof typeof TEMPLATE_NAMES;
