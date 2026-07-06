'use client';

import { useState, useEffect } from 'react';

interface LogEntry {
  id: string;
  to: string;
  event: string;
  template: string;
  status: string;
  error?: string;
  timestamp: string;
  orderId?: string;
}

interface Stats {
  total: number;
  sent: number;
  failed: number;
  byEvent: Record<string, number>;
}

export default function AdminPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const [sendPhone, setSendPhone] = useState('');
  const [sendMsg, setSendMsg] = useState('');
  const [sending, setSending] = useState(false);

  const fetchLogs = async () => {
    if (!apiKey) return;
    try {
      const res = await fetch('/api/admin/logs?limit=100', {
        headers: { 'x-api-key': apiKey },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setStats(data.stats);
        setAuthenticated(true);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (apiKey) fetchLogs();
  }, [apiKey]);

  const handleSend = async () => {
    if (!sendPhone || !sendMsg) return;
    setSending(true);
    try {
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ to: sendPhone, message: sendMsg }),
      });
      setSendMsg('');
      fetchLogs();
    } catch {}
    setSending(false);
  };

  if (!authenticated) {
    return (
      <div style={{ maxWidth: 400, margin: '100px auto', padding: 20 }}>
        <h2 style={{ color: '#C4964A', fontWeight: 300, letterSpacing: 3, textTransform: 'uppercase' }}>
          Admin Login
        </h2>
        <input
          type="password"
          placeholder="Admin API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
          style={{ width: '100%', padding: '12px 16px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 4, color: '#e0e0e0', fontSize: 14, boxSizing: 'border-box' }}
        />
        <button
          onClick={fetchLogs}
          style={{ marginTop: 12, padding: '12px 24px', background: '#C4964A', color: '#0a0806', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer', width: '100%', fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' }}
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ color: '#C4964A', fontWeight: 300, letterSpacing: 4, textTransform: 'uppercase', fontSize: 22, marginBottom: 30 }}>
        ADYAWEAR — WhatsApp Dashboard
      </h1>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 30 }}>
          <StatCard label="Total Messages" value={stats.total} />
          <StatCard label="Sent" value={stats.sent} color="#4ade80" />
          <StatCard label="Failed" value={stats.failed} color="#f87171" />
          <StatCard label="Success Rate" value={`${stats.total ? Math.round((stats.sent / stats.total) * 100) : 0}%`} />
        </div>
      )}

      {/* Quick Send */}
      <div style={{ padding: 20, border: '1px solid #2a2a2a', borderRadius: 8, marginBottom: 30 }}>
        <h3 style={{ color: '#C4964A', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginTop: 0 }}>
          Quick Send
        </h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            placeholder="+91XXXXXXXXXX"
            value={sendPhone}
            onChange={(e) => setSendPhone(e.target.value)}
            style={{ flex: 1, padding: '10px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 4, color: '#e0e0e0', fontSize: 13 }}
          />
          <input
            placeholder="Message..."
            value={sendMsg}
            onChange={(e) => setSendMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={{ flex: 2, padding: '10px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 4, color: '#e0e0e0', fontSize: 13 }}
          />
          <button
            onClick={handleSend}
            disabled={sending}
            style={{ padding: '10px 20px', background: '#C4964A', color: '#0a0806', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>

      {/* Message Log */}
      <div style={{ padding: 20, border: '1px solid #2a2a2a', borderRadius: 8 }}>
        <h3 style={{ color: '#C4964A', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginTop: 0 }}>
          Recent Messages
        </h3>
        {loading ? (
          <p style={{ color: '#8A7E72' }}>Loading...</p>
        ) : logs.length === 0 ? (
          <p style={{ color: '#8A7E72' }}>No messages yet.</p>
        ) : (
          <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {logs.map((log) => (
              <div key={log.id} style={{ padding: '8px 0', borderBottom: '1px solid #1a1a1a', display: 'grid', gridTemplateColumns: '120px 100px 1fr 100px 60px', gap: 8, alignItems: 'center' }}>
                <span style={{ color: '#8A7E72' }}>{new Date(log.timestamp).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                <span style={{ color: '#C4964A' }}>{log.event}</span>
                <span style={{ color: '#d0c2b0' }}>{log.to}</span>
                <span style={{ color: '#8A7E72' }}>{log.orderId || '-'}</span>
                <span style={{ color: log.status === 'sent' ? '#4ade80' : '#f87171', textAlign: 'right' }}>
                  {log.status === 'sent' ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => fetchLogs()} style={{ marginTop: 16, padding: '8px 16px', background: 'transparent', color: '#C4964A', border: '1px solid #C4964A', borderRadius: 4, cursor: 'pointer', fontSize: 12, letterSpacing: 1 }}>
        REFRESH
      </button>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ padding: 16, background: '#111', borderRadius: 8, border: '1px solid #2a2a2a' }}>
      <div style={{ color: '#8A7E72', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ color: color || '#C4964A', fontSize: 24, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
