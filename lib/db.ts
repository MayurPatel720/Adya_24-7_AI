import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');
const MAX_AGE_DAYS = 14;

export interface MessageEntry {
  id: string;
  phone: string;
  direction: 'sent' | 'received';
  text: string;
  timestamp: number;
  type: 'text' | 'template' | 'image' | 'document';
  templateName?: string;
}

interface ConversationsStore {
  messages: MessageEntry[];
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStore(): ConversationsStore {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(CONVERSATIONS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { messages: [] };
  }
}

function writeStore(store: ConversationsStore): void {
  ensureDataDir();
  fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

let idCounter = 0;
function generateId(): string {
  idCounter++;
  return `msg_${Date.now()}_${idCounter}`;
}

export function saveMessage(
  phone: string,
  direction: 'sent' | 'received',
  text: string,
  type: 'text' | 'template' | 'image' | 'document' = 'text',
  templateName?: string
): MessageEntry {
  const store = readStore();
  const entry: MessageEntry = {
    id: generateId(),
    phone: phone.replace(/[^0-9]/g, ''),
    direction,
    text,
    timestamp: Date.now(),
    type,
    ...(templateName ? { templateName } : {}),
  };
  store.messages.push(entry);
  writeStore(store);
  return entry;
}

export function getConversations(): {
  phone: string;
  displayName: string;
  lastMessage: string;
  lastTimestamp: number;
  messageCount: number;
}[] {
  const store = readStore();
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const recent = store.messages.filter((m) => m.timestamp >= cutoff);

  const byPhone = new Map<string, MessageEntry[]>();
  for (const msg of recent) {
    const existing = byPhone.get(msg.phone) || [];
    existing.push(msg);
    byPhone.set(msg.phone, existing);
  }

  const results: {
    phone: string;
    displayName: string;
    lastMessage: string;
    lastTimestamp: number;
    messageCount: number;
  }[] = [];

  for (const [phone, msgs] of byPhone) {
    msgs.sort((a, b) => b.timestamp - a.timestamp);
    const last = msgs[0];
    results.push({
      phone,
      displayName: formatPhone(phone),
      lastMessage: last.text.length > 80 ? last.text.slice(0, 80) + '...' : last.text,
      lastTimestamp: last.timestamp,
      messageCount: msgs.length,
    });
  }

  results.sort((a, b) => b.lastTimestamp - a.lastTimestamp);
  return results;
}

export function getMessages(phone: string, limit = 200): MessageEntry[] {
  const store = readStore();
  const cleaned = phone.replace(/[^0-9]/g, '');
  const filtered = store.messages
    .filter((m) => m.phone === cleaned)
    .sort((a, b) => a.timestamp - b.timestamp);
  return filtered.slice(-limit);
}

export function cleanupOldMessages(): number {
  const store = readStore();
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const before = store.messages.length;
  store.messages = store.messages.filter((m) => m.timestamp >= cutoff);
  writeStore(store);
  return before - store.messages.length;
}

export function getLogStats() {
  const store = readStore();
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const recent = store.messages.filter((m) => m.timestamp >= cutoff);
  return {
    total: recent.length,
    sent: recent.filter((m) => m.direction === 'sent').length,
    received: recent.filter((m) => m.direction === 'received').length,
    failed: 0,
  };
}

export function getMessageLogs(limit = 100) {
  const store = readStore();
  return store.messages
    .slice(-limit)
    .reverse()
    .map((m) => ({
      id: m.id,
      to: m.phone,
      event: m.direction === 'sent' ? 'SENT' : 'RECEIVED',
      template: m.templateName || '',
      status: 'sent',
      timestamp: new Date(m.timestamp).toISOString(),
    }));
}

function formatPhone(phone: string): string {
  if (phone.length === 12 && phone.startsWith('91')) {
    return `+91 ${phone.slice(2, 7)} ${phone.slice(7)}`;
  }
  if (phone.length === 10) {
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return `+${phone}`;
}
