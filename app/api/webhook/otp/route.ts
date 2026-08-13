import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/auth';
import { sendMessageTemplate } from '@/lib/invoice-sender';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-webhook-signature');

    if (!verifyWebhookSignature(signature, body)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const { otp } = data;

    if (!otp?.customerPhone) {
      return NextResponse.json({ success: true, message: 'No phone — skipped' });
    }

    const code = String(otp.otpCode || '');

    sendMessageTemplate(otp.customerPhone, 'otp_sent', [code], 'otp_sent', '', [code]).catch((err) => {
      logger.error('WEBHOOK-OTP', 'Failed to send otp_verification', { error: err.message });
    });

    return NextResponse.json({ success: true, phone: otp.customerPhone });
  } catch (err: any) {
    logger.error('WEBHOOK-OTP', 'OTP webhook error', { error: err.message });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}