import { NextResponse } from 'next/server';
import { cleanupOldMessages } from '@/lib/db';

export async function GET() {
  try {
    const deleted = cleanupOldMessages();
    console.log(`[CRON] Cleanup complete. Deleted ${deleted} old messages.`);
    return NextResponse.json({
      status: 'ok',
      deleted,
      message: `Deleted ${deleted} messages older than 14 days`,
    });
  } catch (error) {
    console.error('[CRON] Cleanup failed:', error);
    return NextResponse.json({ status: 'error', error: 'Cleanup failed' }, { status: 500 });
  }
}
