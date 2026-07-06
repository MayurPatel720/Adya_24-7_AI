export default function HomePage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 20px' }}>
      <h1 style={{ color: '#C4964A', fontWeight: 300, letterSpacing: 4, textTransform: 'uppercase', fontSize: 28, marginBottom: 8 }}>
        ADYAWEAR
      </h1>
      <h2 style={{ color: '#8A7E72', fontWeight: 300, fontSize: 16, marginTop: 0, letterSpacing: 2 }}>
        24-7 AI — WhatsApp Bridge Service
      </h2>

      <div style={{ marginTop: 40, padding: 24, border: '1px solid #2a2a2a', borderRadius: 8 }}>
        <h3 style={{ color: '#C4964A', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', marginTop: 0 }}>
          Service Status
        </h3>
        <p style={{ color: '#8A7E72' }}>
          This service bridges the ADYAWEAR store with WhatsApp via OpenClaw Gateway.
        </p>
        <div style={{ marginTop: 20 }}>
          <StatusRow label="API Health" endpoint="/api/health" />
          <StatusRow label="WhatsApp Status" endpoint="/api/whatsapp/status" />
          <StatusRow label="Admin Dashboard" endpoint="/admin" />
        </div>
      </div>

      <div style={{ marginTop: 30, padding: 24, border: '1px solid #2a2a2a', borderRadius: 8 }}>
        <h3 style={{ color: '#C4964A', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', marginTop: 0 }}>
          Webhook Endpoints
        </h3>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#8A7E72', lineHeight: 1.8 }}>
          <div>POST /api/webhook/order — Order events</div>
          <div>POST /api/webhook/shipping — Shipping updates</div>
          <div>POST /api/webhook/refund — Refund events</div>
          <div>POST /api/webhook/return — Return status</div>
          <div>POST /api/webhook/invoice — Invoice PDF send</div>
          <div>POST /api/webhook/cart — Abandoned cart</div>
          <div>POST /api/webhook/stock — Back in stock</div>
          <div>POST /api/webhook/loyalty — Loyalty points</div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, endpoint }: { label: string; endpoint: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
      <span style={{ color: '#d0c2b0' }}>{label}</span>
      <a href={endpoint} target="_blank" rel="noopener" style={{ color: '#C4964A', fontSize: 13 }}>
        {endpoint} →
      </a>
    </div>
  );
}
