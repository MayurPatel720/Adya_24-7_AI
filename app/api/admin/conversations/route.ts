import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminApiKey } from '@/lib/auth';
import { getConversations, getMessages, getLogStats } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (!verifyAdminApiKey(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const phone = url.searchParams.get('phone');
    const limit = parseInt(url.searchParams.get('limit') || '200');

    const conversations = getConversations();
    const stats = getLogStats();

    let messages: Record<string, unknown[]> = {};

    if (phone) {
      const cleaned = phone.replace(/[^0-9]/g, '');
      messages[cleaned] = getMessages(cleaned, limit);
    }

    return NextResponse.json({
      conversations,
      messages,
      stats,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
