import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getPhoneNumberInfo } from '@/lib/whatsapp';

export async function GET() {
  try {
    const connected = await verifyToken();
    const phoneInfo = await getPhoneNumberInfo();

    return NextResponse.json({
      status: connected ? 'connected' : 'disconnected',
      connected,
      service: 'cloud_api',
      phoneNumber: (phoneInfo as Record<string, unknown>)?.display_phone_number || 'unknown',
      verifiedName: (phoneInfo as Record<string, unknown>)?.verified_name || 'unknown',
      qualityRating: (phoneInfo as Record<string, unknown>)?.quality_rating || 'unknown',
    });
  } catch (error) {
    return NextResponse.json({ status: 'error', error: 'Failed to get status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const connected = await verifyToken();
    if (connected) {
      return NextResponse.json({ success: true, message: 'Already connected via Cloud API' });
    }
    return NextResponse.json({ error: 'Cloud API token invalid' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });
  }
}
