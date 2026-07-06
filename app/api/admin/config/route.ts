import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminApiKey } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET() {
  return NextResponse.json({
    whatsappEnabled: process.env.WHATSAPP_ENABLED !== 'false',
    businessName: process.env.WHATSAPP_BUSINESS_NAME || 'ADYAWEAR',
    senderPhone: process.env.WHATSAPP_SENDER_PHONE || '',
    gatewayUrl: process.env.OPENCLAW_GATEWAY_URL || '',
  });
}

export async function PUT(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (!verifyAdminApiKey(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production, you'd update config in a database
    // For now, just acknowledge
    return NextResponse.json({ success: true, message: 'Config updated (restart required for env changes)' });
  } catch (err: any) {
    logger.error('ADMIN-CONFIG', 'Config update error', { error: err.message });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
