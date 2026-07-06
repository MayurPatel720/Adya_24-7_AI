import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Adya 24-7 AI — WhatsApp Bridge',
  description: 'WhatsApp notification bridge for ADYAWEAR',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#0a0806', color: '#e0e0e0' }}>
        {children}
      </body>
    </html>
  );
}
