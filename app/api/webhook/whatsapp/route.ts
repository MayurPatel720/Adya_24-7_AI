import { NextRequest, NextResponse } from 'next/server';
import { sendTextMessage } from '@/lib/whatsapp';

const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'adyawear_verify_2026';

async function generateAIResponse(message: string): Promise<string> {
  const lower = message.toLowerCase();

  if (lower.includes('order') && (lower.includes('status') || lower.includes('track'))) {
    return 'To check your order status, please share your Order ID (e.g., #ADY12345). You can also track your order at https://adyawear.in/track-order';
  }
  if (lower.includes('delivery')) {
    return 'Our standard delivery takes 3-5 business days. Express delivery (1-2 days) is available for select pin codes. What is your Order ID?';
  }
  if (lower.includes('return') || lower.includes('exchange')) {
    return 'We offer 7-day easy returns and exchanges. Please share your Order ID and reason for return, and we will process it immediately.';
  }
  if (lower.includes('refund')) {
    return 'Refunds are processed within 5-7 business days after we receive the returned item. Please share your Order ID to check refund status.';
  }
  if (lower.includes('size') || lower.includes('chart')) {
    return 'Our size chart is available at https://adyawear.in/size-guide. We recommend measuring yourself and comparing with our chart for the perfect fit.';
  }
  if (lower.includes('cod') || lower.includes('cash on delivery')) {
    return 'Yes, we offer Cash on Delivery (COD) for orders under ₹5,000. Prepaid orders get an additional 5% discount!';
  }
  if (lower.includes('discount') || lower.includes('coupon') || lower.includes('offer')) {
    return 'Check out our current offers at https://adyawear.in/offers. Sign up for our WhatsApp updates to get exclusive coupons!';
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return 'Hello! Welcome to ADYAWEAR. How can I help you today? I can help with orders, returns, sizing, and more.';
  }
  if (lower.includes('thank')) {
    return "You're welcome! Is there anything else I can help you with?";
  }
  return 'Thank you for reaching out to ADYAWEAR! I can help you with:\n\n• Order tracking and status\n• Returns and exchanges\n• Size guidance\n• Payment options\n• Current offers\n\nWhat would you like to know?';
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];

    if (!changes) {
      return NextResponse.json({ status: 'no changes' });
    }

    const value = changes.value;

    if (value.messages) {
      for (const message of value.messages) {
        const from = message.from;
        const text = message.text?.body;

        if (text) {
          console.log(`Incoming message from ${from}: ${text}`);
          const aiResponse = await generateAIResponse(text);
          await sendTextMessage(from, aiResponse);
        }
      }
    }

    if (value.statuses) {
      for (const status of value.statuses) {
        console.log(`Message status: ${status.id} -> ${status.status}`);
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
