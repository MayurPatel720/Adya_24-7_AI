import { NextResponse } from 'next/server';
import { verifyToken, getPhoneNumberInfo, isMetaRateLimited } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tokenValid = await verifyToken();
    const phoneInfo = await getPhoneNumberInfo();

    return NextResponse.json({
      connected: tokenValid,
      status: tokenValid ? 'connected' : 'disconnected',
      service: 'cloud_api',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || 'not configured',
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || 'not configured',
      phoneNumber: (phoneInfo as Record<string, unknown>)?.display_phone_number || 'unknown',
      verifiedName: (phoneInfo as Record<string, unknown>)?.verified_name || 'unknown',
      qualityRating: (phoneInfo as Record<string, unknown>)?.quality_rating || 'unknown',
      metaRateLimited: isMetaRateLimited(),
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
