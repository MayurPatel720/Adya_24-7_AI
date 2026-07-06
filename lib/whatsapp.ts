import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
  isJidUser,
  WAMessage,
  makeInMemoryStore,
  WASocketOptions
} from '@whiskeysockets/baileys';
import { logger } from './logger';
import * as fs from 'fs';
import * as path from 'path';

export interface WhatsAppMessage {
  key: {
    remoteJid: string | null;
    fromMe: boolean;
    id: string | null;
  };
  message: any | null;
  messageTimestamp: number;
  pushName?: string;
}

export interface MessageLog {
  id: string;
  from: string;
  to: string;
  body: string;
  type: 'sent' | 'received';
  timestamp: number;
  status: 'delivered' | 'read' | 'failed';
  template?: string;
}

const SESSION_DIR = path.join(process.cwd(), 'data', 'whatsapp-session');
const MESSAGE_LOG_PATH = path.join(process.cwd(), 'data', 'messages.json');
const QR_TIMEOUT = 60000;

class WhatsAppSession {
  private sock: WASocket | null = null;
  private qrCode: string | null = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private qrCallbacks: Array<(qr: string | null) => void> = [];
  private statusCallbacks: Array<(status: string) => void> = [];
  private messageCallbacks: Array<(msg: WhatsAppMessage) => void> = [];

  constructor() {
    this.ensureDirs();
  }

  private ensureDirs() {
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }
    const dataDir = path.dirname(MESSAGE_LOG_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  async connect(): Promise<void> {
    if (this.connectionStatus === 'connected' || this.connectionStatus === 'connecting') {
      return;
    }

    this.connectionStatus = 'connecting';
    this.notifyStatus('connecting');

    try {
      const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: logger as any,
        browser: ['ADYAWEAR AI', 'Safari', '3.0.0'],
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
        retryRequestDelayMs: 2500,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrCode = qr;
          this.notifyQR(qr);
          logger.info('QR code received');
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          
          logger.info(`Connection closed. Status: ${statusCode}. Reconnect: ${shouldReconnect}`);
          
          this.connectionStatus = 'disconnected';
          this.notifyStatus('disconnected');
          this.qrCode = null;

          if (shouldReconnect) {
            setTimeout(() => this.connect(), 3000);
          }
        }

        if (connection === 'open') {
          this.connectionStatus = 'connected';
          this.qrCode = null;
          this.notifyStatus('connected');
          logger.info('WhatsApp connected successfully');
        }
      });

      this.sock.ev.on('messages.upsert', async (update: any) => {
        if (update.type !== 'notify') return;
        
        for (const msg of update.messages) {
          if (!msg.key.fromMe && msg.key.remoteJid && isJidUser(msg.key.remoteJid)) {
            await this.handleIncomingMessage(msg as WhatsAppMessage);
          }
        }
      });

      this.sock.ev.on('messages.update', async (messages: any[]) => {
        for (const msg of messages) {
          if (msg.update.status) {
            await this.handleMessageStatusUpdate(msg);
          }
        }
      });

    } catch (error) {
      logger.error('Failed to connect WhatsApp:', error);
      this.connectionStatus = 'disconnected';
      this.notifyStatus('disconnected');
      throw error;
    }
  }

  private async handleIncomingMessage(msg: WhatsAppMessage) {
    const from = msg.key.remoteJid || '';
    const text = msg.message?.conversation || 
                 msg.message?.extendedTextMessage?.text || '';
    
    logger.info(`Incoming message from ${from}: ${text}`);

    this.logMessage({
      id: msg.key.id || Date.now().toString(),
      from,
      to: 'bot',
      body: text,
      type: 'received',
      timestamp: Date.now(),
      status: 'delivered'
    });

    for (const cb of this.messageCallbacks) {
      cb(msg);
    }
  }

  private async handleMessageStatusUpdate(msg: any) {
    const status = msg.update.status;
    if (!status) return;

    const statusMap: Record<number, string> = {
      0: 'pending',
      1: 'sent',
      2: 'delivered',
      3: 'read',
      4: 'played',
      5: 'failed'
    };

    const mappedStatus = statusMap[status] || 'unknown';
    logger.info(`Message ${msg.key.id} status: ${mappedStatus}`);
  }

  async sendMessage(to: string, text: string): Promise<boolean> {
    if (!this.sock || this.connectionStatus !== 'connected') {
      logger.error('WhatsApp not connected');
      return false;
    }

    try {
      const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
      await this.sock.sendMessage(jid, { text });
      
      this.logMessage({
        id: Date.now().toString(),
        from: 'bot',
        to: jid,
        body: text,
        type: 'sent',
        timestamp: Date.now(),
        status: 'delivered'
      });

      return true;
    } catch (error) {
      logger.error('Failed to send message:', error);
      return false;
    }
  }

  async sendTemplate(to: string, templateName: string, params: Record<string, string>): Promise<boolean> {
    const templates = this.getTemplates();
    const template = templates[templateName];
    
    if (!template) {
      logger.error(`Template ${templateName} not found`);
      return false;
    }

    let message = template;
    for (const [key, value] of Object.entries(params)) {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return this.sendMessage(to, message);
  }

  private getTemplates(): Record<string, string> {
    return {
      welcome: '🎉 Welcome to ADYAWEAR!\n\nThank you for joining us. We offer premium quality clothing and accessories.\n\nHow can we help you today?',
      order_confirmation: '✅ Order Confirmed!\n\nOrder #{{orderId}}\nAmount: ₹{{amount}}\nEstimated Delivery: {{deliveryDate}}\n\nThank you for shopping with ADYAWEAR!',
      shipping: '🚚 Order Shipped!\n\nOrder #{{orderId}}\nTracking: {{trackingUrl}}\nExpected: {{deliveryDate}}\n\nTrack your order: {{trackingUrl}}',
      delivered: '📦 Delivered!\n\nOrder #{{orderId}} has been delivered.\nWe hope you love your purchase!\n\nShare your experience: {{reviewUrl}}',
      review_request: '⭐ How was your experience?\n\nHi {{name}}! Your order #{{orderId}} was delivered {{daysAgo}} days ago.\n\nRate us: {{reviewUrl}}\n\nYour feedback helps us serve you better!',
      birthday: '🎂 Happy Birthday {{name}}!\n\nWishing you a wonderful day! Use code BIRTHDAY15 for 15% off.\n\nShop: {{shopUrl}}',
      abandoned_cart: '🛒 You left something behind!\n\nItems in your cart:\n{{items}}\n\nComplete your order: {{cartUrl}}\n\nUse code COMEBACK10 for 10% off!',
      refund: '💰 Refund Processed\n\nOrder #{{orderId}}\nAmount: ₹{{amount}}\nRefund ID: {{refundId}}\n\nRefund will reflect in 5-7 business days.',
      back_in_stock: '🔔 Back in Stock!\n\n{{productName}} is available again!\n\nShop now: {{productUrl}}\n\nHurry, limited stock!',
    };
  }

  async sendImage(to: string, buffer: Buffer, caption: string): Promise<boolean> {
    if (!this.sock || this.connectionStatus !== 'connected') {
      return false;
    }

    try {
      const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
      await this.sock.sendMessage(jid, {
        image: buffer,
        caption
      });
      return true;
    } catch (error) {
      logger.error('Failed to send image:', error);
      return false;
    }
  }

  async sendDocument(to: string, buffer: Buffer, fileName: string, mimetype: string): Promise<boolean> {
    if (!this.sock || this.connectionStatus !== 'connected') {
      return false;
    }

    try {
      const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
      await this.sock.sendMessage(jid, {
        document: buffer,
        fileName,
        mimetype
      });
      return true;
    } catch (error) {
      logger.error('Failed to send document:', error);
      return false;
    }
  }

  private logMessage(log: MessageLog) {
    try {
      let messages: MessageLog[] = [];
      if (fs.existsSync(MESSAGE_LOG_PATH)) {
        const data = fs.readFileSync(MESSAGE_LOG_PATH, 'utf-8');
        messages = JSON.parse(data);
      }
      messages.push(log);
      fs.writeFileSync(MESSAGE_LOG_PATH, JSON.stringify(messages, null, 2));
    } catch (error) {
      logger.error('Failed to log message:', error);
    }
  }

  onQR(callback: (qr: string | null) => void) {
    this.qrCallbacks.push(callback);
    if (this.qrCode) callback(this.qrCode);
  }

  onStatus(callback: (status: string) => void) {
    this.statusCallbacks.push(callback);
    callback(this.connectionStatus);
  }

  onMessage(callback: (msg: WhatsAppMessage) => void) {
    this.messageCallbacks.push(callback);
  }

  private notifyQR(qr: string | null) {
    for (const cb of this.qrCallbacks) cb(qr);
  }

  private notifyStatus(status: string) {
    for (const cb of this.statusCallbacks) cb(status);
  }

  getStatus(): string {
    return this.connectionStatus;
  }

  getQR(): string | null {
    return this.qrCode;
  }

  async disconnect(): Promise<void> {
    if (this.sock) {
      this.sock.end(undefined);
      this.sock = null;
    }
    this.connectionStatus = 'disconnected';
    this.qrCode = null;
    this.notifyStatus('disconnected');
  }

  getMessages(): MessageLog[] {
    try {
      if (fs.existsSync(MESSAGE_LOG_PATH)) {
        const data = fs.readFileSync(MESSAGE_LOG_PATH, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {}
    return [];
  }

  getStats() {
    const messages = this.getMessages();
    const sent = messages.filter(m => m.type === 'sent');
    const received = messages.filter(m => m.type === 'received');
    
    return {
      total: messages.length,
      sent: sent.length,
      received: received.length,
      failed: messages.filter(m => m.status === 'failed').length
    };
  }
}

let sessionInstance: WhatsAppSession | null = null;

export function getWhatsAppSession(): WhatsAppSession {
  if (!sessionInstance) {
    sessionInstance = new WhatsAppSession();
  }
  return sessionInstance;
}
