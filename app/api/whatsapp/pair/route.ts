import { NextRequest, NextResponse } from 'next/server';

const OPENCLAW_INTERNAL = 'http://localhost:3001';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '';

export async function GET() {
  try {
    // Try to get QR code from OpenClaw's web UI
    const res = await fetch(`${OPENCLAW_INTERNAL}/`, {
      headers: { 'Authorization': `Bearer ${GATEWAY_TOKEN}` },
      redirect: 'manual',
    });

    // If OpenClaw has a QR endpoint, use it
    const qrRes = await fetch(`${OPENCLAW_INTERNAL}/channels/whatsapp/qr`, {
      headers: { 'Authorization': `Bearer ${GATEWAY_TOKEN}` },
    }).catch(() => null);

    if (qrRes?.ok) {
      const data = await qrRes.json();
      return NextResponse.json({ qr: data.qr || data.data, status: 'ready' });
    }

    // Fallback: check gateway status
    const statusRes = await fetch(`${OPENCLAW_INTERNAL}/api/health`, {
      headers: { 'Authorization': `Bearer ${GATEWAY_TOKEN}` },
    }).catch(() => null);

    if (statusRes?.ok) {
      return NextResponse.json({
        status: 'gateway_running',
        message: 'OpenClaw gateway is running. Use the WebChat UI below to pair WhatsApp.',
        webchatUrl: `${OPENCLAW_INTERNAL}/web/?token=${GATEWAY_TOKEN}`,
      });
    }

    return NextResponse.json({
      status: 'gateway_not_ready',
      message: 'OpenClaw gateway is starting up. Please wait...',
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      message: err.message,
    });
  }
}

// Trigger WhatsApp login via OpenClaw CLI
export async function POST(req: NextRequest) {
  try {
    const { execSync } = require('child_process');

    // Try to trigger login
    const output = execSync('openclaw channels login --channel whatsapp 2>&1', {
      timeout: 30000,
      encoding: 'utf8',
    });

    return NextResponse.json({ success: true, output });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: 'Could not trigger login programmatically. Use the WebChat UI instead.',
      error: err.message,
    });
  }
}
