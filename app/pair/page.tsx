'use client';

import { useState, useEffect, useRef } from 'react';

export default function PairPage() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/pair');
      const data = await res.json();
      setStatus(data.status || 'unknown');
      setMessage(data.message || '');
    } catch {
      setStatus('error');
      setMessage('Could not connect to service');
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0806' }}>
      {/* Header */}
      <div style={{
        background: '#111', padding: '16px 24px',
        borderBottom: '1px solid #2a2a2a',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <h1 style={{ color: '#C4964A', fontWeight: 300, letterSpacing: 3, textTransform: 'uppercase', fontSize: 16, margin: 0 }}>
            ADYAWEAR
          </h1>
          <p style={{ color: '#8A7E72', fontSize: 11, margin: 0, letterSpacing: 1 }}>WhatsApp Pairing</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: status === 'connected' ? '#4ade80' : status === 'loading' ? '#fbbf24' : '#f87171'
          }} />
          <span style={{ color: '#8A7E72', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            {status === 'loading' ? 'Connecting...' : status}
          </span>
          <a href="/" style={{ color: '#8A7E72', fontSize: 11, textDecoration: 'none', marginLeft: 8 }}>
            ← Home
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
        {/* Left Panel — Instructions */}
        <div style={{
          width: 320, padding: 24, borderRight: '1px solid #2a2a2a',
          overflowY: 'auto'
        }}>
          <h2 style={{ color: '#C4964A', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginTop: 0, marginBottom: 20 }}>
            Connect WhatsApp
          </h2>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: '#d0c2b0', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
              Steps
            </h3>
            <div style={{ color: '#8A7E72', fontSize: 13, lineHeight: 2.2 }}>
              <Step num={1} text="Open WhatsApp on your phone" />
              <Step num={2} text="Go to Settings → Linked Devices" />
              <Step num={3} text='Tap "Link a Device"' />
              <Step num={4} text="Scan the QR code (right panel)" />
              <Step num={5} text="Wait for confirmation" />
            </div>
          </div>

          <div style={{ padding: 16, background: '#1a1a1a', borderRadius: 8, marginBottom: 24 }}>
            <h3 style={{ color: '#C4964A', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 0, marginBottom: 8 }}>
              Tips
            </h3>
            <ul style={{ color: '#8A7E72', fontSize: 12, margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
              <li>QR code expires in 2 minutes</li>
              <li>Use a dedicated number if possible</li>
              <li>Keep this page open while scanning</li>
              <li>After scanning, wait 10 seconds</li>
            </ul>
          </div>

          <button
            onClick={checkStatus}
            style={{
              width: '100%', padding: '10px 16px', background: 'transparent',
              border: '1px solid #C4964A', color: '#C4964A', borderRadius: 4,
              fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
              cursor: 'pointer', fontWeight: 600
            }}
          >
            Refresh Status
          </button>

          {message && (
            <p style={{ color: '#8A7E72', fontSize: 11, marginTop: 12, lineHeight: 1.5 }}>{message}</p>
          )}
        </div>

        {/* Right Panel — OpenClaw Dashboard */}
        <div style={{ flex: 1, position: 'relative' }}>
          <iframe
            ref={iframeRef}
            src="/api/openclaw?path=/"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#fff',
            }}
            title="OpenClaw Dashboard"
          />

          {/* Loading overlay */}
          {status === 'loading' && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#0a0806', zIndex: 10
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 40, height: 40, border: '3px solid #2a2a2a',
                  borderTopColor: '#C4964A', borderRadius: '50%',
                  animation: 'spin 1s linear infinite', margin: '0 auto 16px'
                }} />
                <p style={{ color: '#8A7E72', fontSize: 13, margin: 0 }}>
                  Connecting to OpenClaw gateway...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function Step({ num, text }: { num: number; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{
        color: '#C4964A', fontWeight: 600, fontSize: 12,
        minWidth: 20, textAlign: 'right'
      }}>
        {num}.
      </span>
      <span>{text}</span>
    </div>
  );
}
