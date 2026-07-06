import { MessageLog } from '@/types';
import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'data');
const LOG_FILE = path.join(LOG_DIR, 'messages.json');

function ensureDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '[]', 'utf8');
}

export function appendLog(entry: MessageLog): void {
  try {
    ensureDir();
    const logs: MessageLog[] = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    logs.unshift(entry);
    // Keep last 10000 entries
    if (logs.length > 10000) logs.length = 10000;
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Write error:', err);
  }
}

export function getLogs(filters?: { event?: string; status?: string; limit?: number }): MessageLog[] {
  try {
    ensureDir();
    let logs: MessageLog[] = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));

    if (filters?.event) logs = logs.filter((l) => l.event === filters.event);
    if (filters?.status) logs = logs.filter((l) => l.status === filters.status);

    return logs.slice(0, filters?.limit || 100);
  } catch {
    return [];
  }
}

export function getLogStats(): { total: number; sent: number; failed: number; byEvent: Record<string, number> } {
  const logs = getLogs({ limit: 10000 });
  const byEvent: Record<string, number> = {};

  for (const log of logs) {
    byEvent[log.event] = (byEvent[log.event] || 0) + 1;
  }

  return {
    total: logs.length,
    sent: logs.filter((l) => l.status === 'sent').length,
    failed: logs.filter((l) => l.status === 'failed').length,
    byEvent,
  };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
