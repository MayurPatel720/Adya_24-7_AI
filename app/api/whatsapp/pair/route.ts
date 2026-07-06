import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppSession } from '@/lib/whatsapp';

export async function GET() {
  try {
    const session = getWhatsAppSession();
    const status = session.getStatus();
    const qr = session.getQR();

    return NextResponse.json({
      status,
      qr: status === 'disconnected' ? qr : null,
      connected: status === 'connected'
    });
  } catch (error) {
    return NextResponse.json({ status: 'error', error: 'Failed to get status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getWhatsAppSession();
    await session.connect();
    return NextResponse.json({ success: true, message: 'Connecting...' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });
  }
}
