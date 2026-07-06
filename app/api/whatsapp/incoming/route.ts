import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppSession, WhatsAppMessage } from '@/lib/whatsapp';
import { logger } from '@/lib/logger';

const AI_RESPONSE_DELAY = 1000;

let isInitialized = false;

async function initializeBot() {
  if (isInitialized) return;
  
  const session = getWhatsAppSession();
  
  session.onMessage(async (msg: WhatsAppMessage) => {
    const from = msg.key.remoteJid;
    const text = msg.message?.conversation || 
                 msg.message?.extendedTextMessage?.text || '';
    
    if (!text) return;
    
    logger.info(`AI processing message from ${from}: ${text}`);
    
    try {
      const aiResponse = await generateAIResponse(text, from);
      
      if (aiResponse) {
        await new Promise(resolve => setTimeout(resolve, AI_RESPONSE_DELAY));
        await session.sendMessage(from, aiResponse);
      }
    } catch (error) {
      logger.error('AI response error:', error);
      await session.sendMessage(from, 'Thank you for your message. Our team will get back to you shortly.');
    }
  });
  
  isInitialized = true;
}

async function generateAIResponse(message: string, from: string): Promise<string> {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('order') && (lowerMsg.includes('status') || lowerMsg.includes('track'))) {
    return 'To check your order status, please share your Order ID (e.g., #ADY12345). You can also track your order at https://adyawear.in/track-order';
  }
  
  if (lowerMsg.includes('delivery')) {
    return 'Our standard delivery takes 3-5 business days. Express delivery (1-2 days) is available for select pin codes. What is your Order ID?';
  }
  
  if (lowerMsg.includes('return') || lowerMsg.includes('exchange')) {
    return 'We offer 7-day easy returns and exchanges. Please share your Order ID and reason for return, and we will process it immediately.';
  }
  
  if (lowerMsg.includes('refund')) {
    return 'Refunds are processed within 5-7 business days after we receive the returned item. Please share your Order ID to check refund status.';
  }
  
  if (lowerMsg.includes('size') || lowerMsg.includes('chart')) {
    return 'Our size chart is available at https://adyawear.in/size-guide. We recommend measuring yourself and comparing with our chart for the perfect fit.';
  }
  
  if (lowerMsg.includes('cod') || lowerMsg.includes('cash on delivery')) {
    return 'Yes, we offer Cash on Delivery (COD) for orders under ₹5,000. Prepaid orders get an additional 5% discount!';
  }
  
  if (lowerMsg.includes('discount') || lowerMsg.includes('coupon') || lowerMsg.includes('offer')) {
    return 'Check out our current offers at https://adyawear.in/offers. Sign up for our WhatsApp updates to get exclusive coupons!';
  }
  
  if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
    return 'Hello! Welcome to ADYAWEAR. How can I help you today? I can help with orders, returns, sizing, and more.';
  }
  
  if (lowerMsg.includes('thank')) {
    return 'You\'re welcome! Is there anything else I can help you with?';
  }
  
  return 'Thank you for reaching out to ADYAWEAR! I can help you with:\n\n• Order tracking and status\n• Returns and exchanges\n• Size guidance\n• Payment options\n• Current offers\n\nWhat would you like to know?';
}

export async function POST(request: NextRequest) {
  try {
    await initializeBot();
    
    const body = await request.json();
    const { from, message } = body;

    if (!from || !message) {
      return NextResponse.json({ error: 'Missing from or message' }, { status: 400 });
    }

    const session = getWhatsAppSession();
    
    if (session.getStatus() !== 'connected') {
      return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 503 });
    }

    const success = await session.sendMessage(from, message);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  await initializeBot();
  return NextResponse.json({ status: 'ok', messages: 'Bot active' });
}
