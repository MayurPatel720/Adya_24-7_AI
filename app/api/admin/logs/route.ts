import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminApiKey } from '@/lib/auth';
import { getLogs, getLogStats } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (!verifyAdminApiKey(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const event = url.searchParams.get('event') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '100');

    const logs = getLogs({ event, status, limit });
    const stats = getLogStats();

    return NextResponse.json({ logs, stats });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
