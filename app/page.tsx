'use client';

import { useState, useEffect, useCallback } from 'react';

export default function HomePage() {
  const [status, setStatus] = useState('disconnected');
  const [qr, setQr] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, sent: 0, received: 0 });
  const [autoConnect, setAutoConnect] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/pair');
      const data = await res.json();
      setStatus(data.status);
      if (data.qr) setQr(data.qr);
      
      if (data.status === 'connected') {
        const statsRes = await fetch('/api/health');
        const statsData = await statsRes.json();
        setStats(statsData.messages);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    if (autoConnect && status === 'disconnected') {
      connect();
      setAutoConnect(false);
    }
  }, [autoConnect, status]);

  const connect = async () => {
    try {
      setStatus('connecting');
      await fetch('/api/whatsapp/pair', { method: 'POST' });
    } catch {}
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 20px' }}>
      <h1 style={{ color: '#C4964A', fontWeight: 300, letterSpacing: 4, textTransform: 'uppercase', fontSize: 28, marginBottom: 8 }}>
        ADYAWEAR
      </h1>
      <h2 style={{ color: '#8A7E72', fontWeight: 300, fontSize: 16, marginTop: 0, letterSpacing: 2 }}>
        24-7 AI — WhatsApp Bridge Service
      </h2>

      {/* Connection Status Card */}
      <div style={{ 
        marginTop: 24, padding: 24, borderRadius: 8,
        background: status === 'connected' ? '#0a1a0a' : status === 'connecting' ? '#1a1a0a' : '#1a0a0a',
        border: `1px solid ${status === 'connected' ? '#2a4a2a' : status === 'connecting' ? '#4a4a2a' : '#4a2a2a'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 12, height: 12, borderRadius: '50%',
            background: status === 'connected' ? '#4CAF50' : status === 'connecting' ? '#FFC107' : '#F44336'
          }} />
          <span style={{ 
            color: status === 'connected' ? '#4CAF50' : status === 'connecting' ? '#FFC107' : '#F44336',
            fontWeight: 600, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1
          }}>
            {status === 'connected' ? 'WhatsApp Connected' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>

        {status === 'disconnected' && (
          <button 
            onClick={connect}
            style={{
              marginTop: 16, padding: '12px 24px', background: '#C4964A', color: '#0a0806',
              border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 13, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: 1
            }}
          >
            Connect WhatsApp
          </button>
        )}

        {qr && status === 'connecting' && (
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <p style={{ color: '#d0c2b0', marginBottom: 16 }}>Scan this QR code with WhatsApp:</p>
            <div style={{ 
              background: 'white', padding: 20, borderRadius: 8, display: 'inline-block'
            }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qr)}`}
                alt="WhatsApp QR Code"
                style={{ width: 256, height: 256 }}
              />
            </div>
            <p style={{ color: '#8A7E72', marginTop: 16, fontSize: 12 }}>
              Open WhatsApp → Settings → Linked Devices → Link a Device
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {status === 'connected' && (
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <QuickSendCard to="+917859976160" label="Test Message" message="Hello! This is a test from ADYAWEAR AI." />
          <StatsCard stats={stats} />
        </div>
      )}

      {/* Navigation Links */}
      <div style={{ marginTop: 30, padding: 24, border: '1px solid #2a2a2a', borderRadius: 8 }}>
        <h3 style={{ color: '#C4964A', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', marginTop: 0 }}>
          Quick Links
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a href="/admin" style={{ color: '#C4964A', textDecoration: 'none', fontSize: 14 }}>
            Admin Dashboard →
          </a>
          <a href="/api/whatsapp/status" style={{ color: '#C4964A', textDecoration: 'none', fontSize: 14 }} target="_blank">
            API Status →
          </a>
          <a href="/api/health" style={{ color: '#C4964A', textDecoration: 'none', fontSize: 14 }} target="_blank">
            Health Check →
          </a>
        </div>
      </div>

      {/* Webhook Endpoints */}
      <div style={{ marginTop: 24, padding: 24, border: '1px solid #2a2a2a', borderRadius: 8 }}>
        <h3 style={{ color: '#C4964A', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', marginTop: 0 }}>
          Webhook Endpoints
        </h3>
        <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#8A7E72', lineHeight: 2 }}>
          <div>POST /api/webhook/order — Order events</div>
          <div>POST /api/webhook/shipping — Shipping updates</div>
          <div>POST /api/webhook/refund — Refund events</div>
          <div>POST /api/webhook/invoice — Invoice PDF send</div>
          <div>POST /api/webhook/cart — Abandoned cart</div>
          <div>POST /api/webhook/stock — Back in stock</div>
        </div>
      </div>
    </div>
  );
}

function QuickSendCard({ to, label, message }: { to: string; label: string; message: string }) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');

  const send = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message })
      });
      const data = await res.json();
      setResult(data.success ? 'Sent!' : 'Failed');
    } catch {
      setResult('Error');
    }
    setSending(false);
    setTimeout(() => setResult(''), 3000);
  };

  return (
    <div style={{ padding: 20, border: '1px solid #2a2a2a', borderRadius: 8 }}>
      <div style={{ color: '#d0c2b0', fontSize: 13, marginBottom: 8 }}>{label}</div>
      <div style={{ color: '#8A7E72', fontSize: 12, marginBottom: 12 }}>{to}</div>
      <button
        onClick={send}
        disabled={sending}
        style={{
          width: '100%', padding: '10px 16px', background: '#C4964A', color: '#0a0806',
          border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 12, cursor: 'pointer',
          textTransform: 'uppercase', letterSpacing: 1
        }}
      >
        {sending ? 'Sending...' : result || 'Send Test'}
      </button>
    </div>
  );
}

function StatsCard({ stats }: { stats: { total: number; sent: number; received: number } }) {
  return (
    <div style={{ padding: 20, border: '1px solid #2a2a2a', borderRadius: 8 }}>
      <div style={{ color: '#C4964A', fontSize: 13, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
        Messages
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <div>
          <div style={{ color: '#d0c2b0', fontSize: 24, fontWeight: 300 }}>{stats.total}</div>
          <div style={{ color: '#8A7E72', fontSize: 11 }}>Total</div>
        </div>
        <div>
          <div style={{ color: '#4CAF50', fontSize: 24, fontWeight: 300 }}>{stats.sent}</div>
          <div style={{ color: '#8A7E72', fontSize: 11 }}>Sent</div>
        </div>
        <div>
          <div style={{ color: '#2196F3', fontSize: 24, fontWeight: 300 }}>{stats.received}</div>
          <div style={{ color: '#8A7E72', fontSize: 11 }}>Received</div>
        </div>
      </div>
    </div>
  );
}
