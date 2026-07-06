import { NextRequest, NextResponse } from 'next/server';

const OPENCLAW_INTERNAL = 'http://localhost:3001';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '/';

    // Proxy request to OpenClaw internal web UI
    const res = await fetch(`${OPENCLAW_INTERNAL}${path}`, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENCLAW_GATEWAY_TOKEN || ''}`,
      },
    });

    // Get response content type
    const contentType = res.headers.get('content-type') || 'text/html';

    // If it's HTML, inject our wrapper
    if (contentType.includes('text/html')) {
      const html = await res.text();
      // Wrap with our header
      const wrapped = `
<!DOCTYPE html>
<html>
<head>
  <title>OpenClaw Dashboard — ADYAWEAR</title>
  <style>
    body { margin: 0; font-family: system-ui; background: #0a0806; }
    .header {
      background: #111; padding: 12px 20px; border-bottom: 1px solid #2a2a2a;
      display: flex; align-items: center; justify-content: space-between;
    }
    .header h1 { color: #C4964A; font-size: 14px; letter-spacing: 2px; margin: 0; text-transform: uppercase; }
    .header a { color: #8A7E72; text-decoration: none; font-size: 12px; }
    iframe { width: 100%; height: calc(100vh - 50px); border: none; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ADYAWEAR — OpenClaw</h1>
    <a href="/pair">← Back to Pairing</a>
  </div>
  <iframe src="${OPENCLAW_INTERNAL}${path}"></iframe>
</body>
</html>`;
      return new NextResponse(wrapped, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // For non-HTML, just proxy
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      status: res.status,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      error: 'Could not connect to OpenClaw',
      message: err.message,
      help: 'OpenClaw gateway may not be running yet. It takes a few seconds to start after deployment.',
    }, { status: 502 });
  }
}
