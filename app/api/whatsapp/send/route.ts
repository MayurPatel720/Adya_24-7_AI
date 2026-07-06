import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppSession } from '@/lib/whatsapp';
import { verifyWebhookSignature } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message, template, params } = body;

    if (!to || (!message && !template)) {
      return NextResponse.json({ error: 'Missing to and message/template' }, { status: 400 });
    }

    const signature = request.headers.get('x-webhook-signature');
    if (signature && !verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const session = getWhatsAppSession();
    
    if (session.getStatus() !== 'connected') {
      return NextResponse.json({ error: 'WhatsApp not connected. Please pair first.' }, { status: 503 });
    }

    let success: boolean;
    
    if (template) {
      success = await session.sendTemplate(to, template, params || {});
    } else {
      success = await session.sendMessage(to, message);
    }

    if (success) {
      return NextResponse.json({ success: true, to, message: 'Sent' });
    } else {
      return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
