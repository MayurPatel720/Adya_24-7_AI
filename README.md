# Adya 24-7 AI — WhatsApp Bridge

WhatsApp notification bridge service for **ADYAWEAR**. Receives webhooks from the ADYAWEAR store and sends automated WhatsApp messages to customers via OpenClaw Gateway.

## Architecture

```
ADYAWEAR Store → This Service → OpenClaw Gateway → WhatsApp → Customer
```

## Features

- 18 message templates (order, shipping, invoice, review, birthday, etc.)
- Invoice PDF sharing via WhatsApp
- Post-delivery follow-up cron
- Review request automation
- Birthday greetings
- Abandoned cart recovery
- Back-in-stock alerts
- Admin dashboard with message logs
- Bulk broadcast with rate limiting
- HMAC webhook verification

## Setup

### 1. Deploy on Render

1. Fork/push this repo to GitHub
2. Connect Render to the repo
3. Set environment variables in Render dashboard
4. Deploy

### 2. Set up OpenClaw on VPS

```bash
curl -fsSL https://docs.openclaw.ai/install.sh | sh
openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
```

Pair WhatsApp via QR code when prompted.

### 3. Configure ADYAWEAR Store

Add to your ADYAWEAR store's Vercel env vars:

```
WHATSAPP_BRIDGE_URL=https://adya-24-7-ai.onrender.com
WHATSAPP_BRIDGE_SECRET=your_webhook_secret
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/webhook/order` | POST | Order events |
| `/api/webhook/shipping` | POST | Shipping updates |
| `/api/webhook/refund` | POST | Refund events |
| `/api/webhook/return` | POST | Return status |
| `/api/webhook/invoice` | POST | Send invoice PDF |
| `/api/webhook/cart` | POST | Abandoned cart |
| `/api/webhook/stock` | POST | Back in stock |
| `/api/webhook/loyalty` | POST | Loyalty points |
| `/api/whatsapp/send` | POST | Manual send |
| `/api/whatsapp/status` | GET | Connection status |
| `/api/whatsapp/incoming` | POST | Inbound messages |
| `/api/admin/logs` | GET | Message logs |
| `/api/admin/config` | GET/PUT | Service config |
| `/api/admin/broadcast` | POST | Bulk send |

## Admin Dashboard

Visit `/admin` to view message logs, stats, and send test messages.

## Cost

| Item | Monthly |
|------|---------|
| Render Starter | $7 |
| VPS (OpenClaw) | ~$5 |
| MiMo API | ~$1-3 |
| WhatsApp | Free |
| **Total** | **~$13-15** |

## License

Private — ADYAWEAR
