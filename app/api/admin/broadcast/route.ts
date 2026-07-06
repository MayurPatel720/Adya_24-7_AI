import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminApiKey } from '@/lib/auth';
import { sendTextMessage } from '@/lib/invoice-sender';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (!verifyAdminApiKey(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { phones, message } = body;

    if (!Array.isArray(phones) || !message) {
      return NextResponse.json({ error: 'Missing phones array or message' }, { status: 400 });
    }

    if (phones.length > 50) {
      return NextResponse.json({ error: 'Max 50 recipients per broadcast' }, { status: 400 });
    }

    let sent = 0;
    let failed = 0;

    for (const phone of phones) {
      try {
        const success = await sendTextMessage(phone, message, 'broadcast');
        if (success) sent++;
        else failed++;
        // Rate limit: 1 message per 100ms
        await new Promise((r) => setTimeout(r, 100));
      } catch {
        failed++;
      }
    }

    logger.info('BROADCAST', `Broadcast complete: ${sent} sent, ${failed} failed`);

    return NextResponse.json({ success: true, sent, failed, total: phones.length });
  } catch (err: any) {
    logger.error('BROADCAST', 'Broadcast error', { error: err.message });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
