import { NextResponse } from 'next/server';
import { checkOpenClawStatus } from '@/lib/openclaw';
import { getLogStats } from '@/lib/db';

export async function GET() {
  const [openclaw, stats] = await Promise.all([
    checkOpenClawStatus(),
    Promise.resolve(getLogStats()),
  ]);

  return NextResponse.json({
    openclaw: openclaw.connected ? 'connected' : 'disconnected',
    openclawDetails: openclaw.details,
    messages: stats,
    timestamp: new Date().toISOString(),
  });
}
