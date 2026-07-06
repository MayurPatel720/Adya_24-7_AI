import { NextResponse } from 'next/server';
import { getLogStats } from '@/lib/db';

export async function GET() {
  const stats = getLogStats();

  return NextResponse.json({
    status: 'ok',
    service: 'Adya 24-7 AI — WhatsApp Bridge',
    version: '1.0.0',
    uptime: process.uptime(),
    messages: stats,
    timestamp: new Date().toISOString(),
  });
}
