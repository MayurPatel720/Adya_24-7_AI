import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminApiKey } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/openclaw';
import { appendLog, generateId } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (!verifyAdminApiKey(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { to, text, imageUrl, documentUrl, documentName, caption } = body;

    if (!to) {
      return NextResponse.json({ error: 'Missing "to" field' }, { status: 400 });
    }

    const success = await sendWhatsAppMessage({ to, text, imageUrl, documentUrl, documentName, caption });

    appendLog({
      id: generateId(),
      to,
      event: 'manual_send',
      template: 'manual',
      status: success ? 'sent' : 'failed',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success });
  } catch (err: any) {
    logger.error('WA-SEND', 'Manual send error', { error: err.message });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
