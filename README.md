# Adya 24-7 AI — WhatsApp Bridge

WhatsApp notification + AI chat bridge for **ADYAWEAR**. Everything runs in one Render service: OpenClaw Gateway (WhatsApp + MiMo AI) + Next.js Bridge (webhooks + templates).

## Architecture (Single Service)

```
┌─────────────────────────────────────────────────────┐
│            Render Service ($7/mo)                    │
│                                                     │
│  ┌─────────────────┐    ┌─────────────────────┐    │
│  │ Next.js Bridge   │───►│ OpenClaw Gateway     │    │
│  │ (port 3000)      │    │ (port 3001)          │    │
│  │ - Webhook routes │    │ - WhatsApp channel   │    │
│  │ - Message temps  │    │ - MiMo V2.5 AI      │    │
│  │ - Admin dashboard│    │ - QR-paired          │    │
│  └─────────────────┘    └──────────┬──────────┘    │
│                                     │                │
└─────────────────────────────────────┼────────────────┘
                                      │
                                      ▼
                               ┌──────────────┐
                               │   WhatsApp   │
                               │   (Customer) │
                               └──────────────┘
```

## Features

- 18 WhatsApp message templates (order, shipping, invoice, review, birthday, etc.)
- Invoice PDF sharing via WhatsApp
- AI customer support via MiMo V2.5 (via OpenClaw)
- Post-delivery follow-up cron
- Review request automation
- Birthday greetings
- Abandoned cart recovery
- Back-in-stock alerts
- Admin dashboard with message logs
- Bulk broadcast with rate limiting
- HMAC webhook verification

## Deploy on Render (5 minutes)

### Step 1: Fork the Repo

```bash
# On GitHub, fork MayurPatel720/Adya_24-7_AI to your account
```

### Step 2: Create Render Service

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Name**: `adya-24-7-ai`
   - **Runtime**: Node
   - **Plan**: Starter ($7/mo)
   - **Build Command**: `bash scripts/build.sh`
   - **Start Command**: `bash scripts/start.sh`

### Step 3: Set Environment Variables

In Render dashboard → Environment tab, add:

| Variable | Value |
|----------|-------|
| `XIAOMI_API_KEY` | `sk-or-v1-your-key-here` (your OpenRouter key) |
| `WHATSAPP_SENDER_PHONE` | `+91XXXXXXXXXX` (your WhatsApp number) |
| `ADMIN_PHONE` | `+91XXXXXXXXXX` (your phone for alerts) |

All other vars have default values in render.yaml.

### Step 4: Pair WhatsApp (One-Time Setup)

After first deploy, you need to pair WhatsApp. Render doesn't have interactive shell, so you need to:

1. **Install OpenClaw locally** on your computer:
   ```bash
   curl -fsSL https://docs.openclaw.ai/install.sh | sh
   ```

2. **Run pairing locally** (with your Render env vars):
   ```bash
   export XIAOMI_API_KEY="sk-or-v1-your-key"
   openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
   openclaw channels login
   # Scan QR with WhatsApp → Linked Devices → Link a Device
   ```

3. **Copy session files** to Render:
   - Copy `~/.openclaw/sessions/` folder
   - Use Render's Persistent Disk or git to include session data

Alternatively, use **Render Shell** (if available on your plan):
1. Go to Render dashboard → your service → Shell
2. Run: `openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"`
3. Run: `openclaw channels login`
4. Scan the QR code with your phone

### Step 5: Add Webhooks in ADYAWEAR Store

In your ADYAWEAR store's Vercel env vars, add:
```
WHATSAPP_BRIDGE_URL=https://adya-24-7-ai.onrender.com
WHATSAPP_BRIDGE_SECRET=adyawear_bridge_secret_2026
```

Then add webhook calls in your store's API routes (see README in repo).

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check + stats |
| `/api/webhook/order` | POST | Order events (created, confirmed) |
| `/api/webhook/shipping` | POST | Shipping updates (shipped, delivered) |
| `/api/webhook/refund` | POST | Refund events |
| `/api/webhook/return` | POST | Return status updates |
| `/api/webhook/invoice` | POST | Send invoice PDF via WhatsApp |
| `/api/webhook/cart` | POST | Abandoned cart alerts |
| `/api/webhook/stock` | POST | Back-in-stock alerts |
| `/api/webhook/loyalty` | POST | Loyalty points updates |
| `/api/whatsapp/send` | POST | Manual WhatsApp send |
| `/api/whatsapp/status` | GET | OpenClaw connection status |
| `/api/whatsapp/incoming` | POST | Inbound messages (AI chat) |
| `/api/admin/logs` | GET | Message logs (admin only) |
| `/api/admin/config` | GET/PUT | Service configuration |
| `/api/admin/broadcast` | POST | Bulk send (max 50) |
| `/admin` | GET | Admin dashboard |

## Admin Dashboard

Visit `https://adya-24-7-ai.onrender.com/admin` to:
- View message logs and stats
- Send test WhatsApp messages
- Monitor OpenClaw connection status

Default admin key: `adyawear_admin_2026` (change in env vars)

## Message Templates

| # | Template | Trigger |
|---|----------|---------|
| 1 | Welcome | New customer registration |
| 2 | Order Placed | Order created |
| 3 | Payment Received | Razorpay payment success |
| 4 | Order Confirmed | Admin confirms order |
| 5 | Shipped | AWB + courier + tracking |
| 6 | Out for Delivery | Same-day notification |
| 7 | Delivered | Delivery + review link |
| 8 | Invoice | PDF document via WhatsApp |
| 9 | Refund Processed | Refund confirmation |
| 10 | Return Status | Return approval/rejection |
| 11 | Review Request | 3 days post-delivery |
| 12 | Care Tips | 5 days post-delivery |
| 13 | Birthday | Customer birthday |
| 14 | Abandoned Cart | Cart recovery |
| 15 | Back in Stock | Wishlist restock |
| 16 | Loyalty Points | Points earned |
| 17 | Wholesale Update | B2B order status |
| 18 | AI Support | 24/7 chat via MiMo V2.5 |

## Cost

| Item | Monthly |
|------|---------|
| Render Starter | $7 |
| MiMo API (via OpenRouter) | ~$1-3 |
| WhatsApp | Free (QR-pairing) |
| **Total** | **~$8-10** |

## License

Private — ADYAWEAR
