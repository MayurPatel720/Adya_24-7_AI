import { NextResponse } from 'next/server';
import { getWhatsAppSession } from '@/lib/whatsapp';

export async function GET() {
  try {
    const session = getWhatsAppSession();
    const status = session.getStatus();

    return NextResponse.json({
      connected: status === 'connected',
      status,
      service: 'baileys',
      uptime: process.uptime()
    });
  } catch (error) {
    return NextResponse.json({ 
      connected: false,
      status: 'error',
      error: 'Failed to check status'
    }, { status: 500 });
  }
}
