import { OrderData, ShippingUpdate, RefundData, ReturnData, LoyaltyData, CartData, StockData } from '@/types';

const STORE_URL = process.env.ADYAWEAR_STORE_URL || 'https://www.adyawear.in';

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const orderLink = (id: string) => `${STORE_URL}/account/orders/${id}`;
const trackLink = () => `${STORE_URL}/track-order`;
const reviewLink = (slug: string) => `${STORE_URL}/products/${slug}#reviews`;

// ─── 1. Welcome ──────────────────────────────────────────────
export function welcome(name: string): string {
  return `Welcome to ADYAWEAR! 🎉\n\nHi ${name}, thank you for joining us.\n\nWe have a special surprise for your first order — use code WELCOME10 for 10% off!\n\nShop now: ${STORE_URL}\n\nQuestions? Just reply here. We're always happy to help! 😊`;
}

// ─── 2. Order Placed ─────────────────────────────────────────
export function orderPlaced(order: OrderData): string {
  const itemLines = order.items
    .slice(0, 5)
    .map((i) => `• ${i.name} (${i.size}) × ${i.quantity} — ${fmt(i.price * i.quantity)}`)
    .join('\n');
  const extra = order.items.length > 5 ? `\n• ...+${order.items.length - 5} more items` : '';

  return [
    `✅ *Order Confirmed!* 🎉`,
    ``,
    `Hi ${order.shippingAddress.fullName},`,
    ``,
    `Your order *#${order.orderId}* has been placed successfully.`,
    ``,
    `📦 *Items:*`,
    `${itemLines}${extra}`,
    ``,
    `💰 *Total:* ${fmt(order.total)}`,
    `💳 *Payment:* ${order.paymentMethod === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'}`,
    ``,
    `🚚 We'll notify you when your order ships.`,
    ``,
    `View order: ${orderLink(order.orderId)}`,
  ].join('\n');
}

// ─── 3. Payment Received ─────────────────────────────────────
export function paymentReceived(order: OrderData): string {
  return [
    `💳 *Payment Received!*`,
    ``,
    `Hi ${order.shippingAddress.fullName},`,
    `We've received your payment of *${fmt(order.total)}* for order *#${order.orderId}*.`,
    ``,
    `Your order is now being processed.`,
    `View order: ${orderLink(order.orderId)}`,
  ].join('\n');
}

// ─── 4. Order Confirmed (Admin) ──────────────────────────────
export function orderConfirmed(order: OrderData): string {
  return [
    `✅ *Order Confirmed*`,
    ``,
    `Hi ${order.shippingAddress.fullName},`,
    `Great news! Your order *#${order.orderId}* has been confirmed and is being prepared.`,
    ``,
    `We'll send you tracking details once it ships.`,
    `View order: ${orderLink(order.orderId)}`,
  ].join('\n');
}

// ─── 5. Shipped ──────────────────────────────────────────────
export function shipped(order: OrderData): string {
  const lines = [
    `🚚 *Order Shipped!*`,
    ``,
    `Hi ${order.shippingAddress.fullName},`,
    `Your order *#${order.orderId}* is on its way!`,
    ``,
    `📍 *Courier:* ${order.courierName || 'Standard Shipping'}`,
    `📋 *AWB:* ${order.awbNumber || 'Pending'}`,
  ];

  if (order.estimatedDelivery) {
    const eta = new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    lines.push(`📅 *Est. Delivery:* ${eta}`);
  }

  if (order.trackingUrl) {
    lines.push(`🔗 *Track:* ${order.trackingUrl}`);
  } else {
    lines.push(`🔗 *Track:* ${trackLink()}`);
  }

  lines.push(``, `We'll notify you when it's out for delivery!`);

  return lines.join('\n');
}

// ─── 6. Out for Delivery ─────────────────────────────────────
export function outForDelivery(order: OrderData): string {
  return [
    `📦 *Out for Delivery!*`,
    ``,
    `Hi ${order.shippingAddress.fullName},`,
    `Your order *#${order.orderId}* is out for delivery today!`,
    ``,
    `📍 Delivering to: ${order.shippingAddress.city}, ${order.shippingAddress.state}`,
    `🚚 Courier: ${order.courierName || 'Standard'}`,
    ``,
    `Please keep your phone handy. 📱`,
  ].join('\n');
}

// ─── 7. Delivered ────────────────────────────────────────────
export function delivered(order: OrderData): string {
  return [
    `✅ *Order Delivered!*`,
    ``,
    `Hi ${order.shippingAddress.fullName},`,
    `Your order *#${order.orderId}* has been delivered! 🎉`,
    ``,
    `We hope you love your new pieces from ADYAWEAR.`,
    ``,
    `Would you take a moment to share your feedback?`,
    `⭐ ${reviewLink(order.items[0]?.slug || '')}`,
    ``,
    `Thank you for choosing ADYAWEAR 🙏`,
  ].join('\n');
}

// ─── 8. Refund Processed ────────────────────────────────────
export function refundProcessed(data: RefundData): string {
  return [
    `💸 *Refund Processed*`,
    ``,
    `Hi ${data.customerName},`,
    `Your refund of *${fmt(data.refundAmount)}* for order *#${data.orderId}* has been processed.`,
    ``,
    `The amount will be credited to your original payment method within 5-7 business days.`,
    ``,
    `${data.refundId ? `Refund ID: ${data.refundId}` : ''}`,
  ].join('\n');
}

// ─── 9. Return Status ────────────────────────────────────────
export function returnStatus(data: ReturnData): string {
  const messages: Record<string, { heading: string; body: string }> = {
    pending: { heading: 'Return Request Received', body: 'We have received your return request. Our team will review it within 24-48 hours.' },
    approved: { heading: 'Return Approved ✅', body: 'Your return has been approved. Our team will arrange a reverse pickup within 2-3 business days.' },
    rejected: { heading: 'Return Request Update', body: 'Unfortunately, your return request could not be approved at this time. Contact us for details.' },
    completed: { heading: 'Return Completed ✅', body: 'Your return has been processed. Your refund will be credited within 5-7 business days.' },
  };

  const msg = messages[data.status] || messages.pending;

  const lines = [
    `↩️ *${msg.heading}*`,
    ``,
    `Hi ${data.customerName},`,
    msg.body,
    ``,
    `Order: *#${data.orderId}*`,
  ];

  if (data.adminNote) lines.push(`📝 Note: ${data.adminNote}`);
  if (data.refundAmount) lines.push(`💰 Refund: *${fmt(data.refundAmount)}*`);

  return lines.join('\n');
}

// ─── 10. Review Request ──────────────────────────────────────
export function reviewRequest(order: OrderData): string {
  const productNames = order.items.map((i) => i.name).join(', ');
  return [
    `⭐ *How was your experience?*`,
    ``,
    `Hi ${order.shippingAddress.fullName},`,
    `You recently received: *${productNames}*`,
    ``,
    `We'd love to hear your feedback! It only takes 30 seconds and helps us serve you better.`,
    ``,
    `Leave a review: ${reviewLink(order.items[0]?.slug || '')}`,
    ``,
    `Your feedback means the world to us! 🙏`,
  ].join('\n');
}

// ─── 11. Post-Delivery Care Tips ─────────────────────────────
export function careTips(order: OrderData): string {
  return [
    `🧵 *Care Tips for Your ADYAWEAR Pieces*`,
    ``,
    `Hi ${order.shippingAddress.fullName},`,
    `Here are some tips to keep your garments looking fresh:`,
    ``,
    `• Hand wash or dry clean for best results`,
    `• Avoid direct sunlight when drying`,
    `• Store in a cool, dry place`,
    `• Use a padded hanger for ethnic wear`,
    ``,
    `Need help? Reply here anytime! 😊`,
    `Shop more: ${STORE_URL}`,
  ].join('\n');
}

// ─── 12. Birthday ────────────────────────────────────────────
export function birthday(name: string): string {
  return [
    `🎂 *Happy Birthday, ${name}!*`,
    ``,
    `Wishing you a wonderful day filled with joy and laughter!`,
    ``,
    `To celebrate, here's *15% OFF* your next order.`,
    `Use code: *BIRTHDAY15*`,
    ``,
    `Shop now: ${STORE_URL}`,
    ``,
    `With love, Team ADYAWEAR 💛`,
  ].join('\n');
}

// ─── 13. Abandoned Cart ──────────────────────────────────────
export function abandonedCart(data: CartData): string {
  const itemLines = data.items
    .slice(0, 3)
    .map((i) => `• ${i.name} × ${i.quantity} — ${fmt(i.price * i.quantity)}`)
    .join('\n');
  const extra = data.items.length > 3 ? `\n• ...+${data.items.length - 3} more` : '';

  return [
    `🛒 *You left items in your cart!*`,
    ``,
    `Hi ${data.customerName || 'there'},`,
    `You have some beautiful pieces waiting for you:`,
    ``,
    `${itemLines}${extra}`,
    ``,
    `💰 Subtotal: ${fmt(data.subtotal)}`,
    ``,
    `Complete your order before they're gone!`,
    `${STORE_URL}/cart`,
  ].join('\n');
}

// ─── 14. Back in Stock ───────────────────────────────────────
export function backInStock(data: StockData): string {
  return [
    `🔔 *Back in Stock!*`,
    ``,
    `Hi ${data.customerName},`,
    `Good news! *${data.productName}* that you were interested in is back in stock!`,
    ``,
    `Grab it before it sells out again:`,
    `${STORE_URL}/products/${data.productSlug}`,
  ].join('\n');
}

// ─── 15. Loyalty Points ──────────────────────────────────────
export function loyaltyPoints(data: LoyaltyData): string {
  return [
    `🌟 *Loyalty Points Update*`,
    ``,
    `Hi ${data.customerName},`,
    `You've earned *${data.pointsEarned} points* for your recent order *#${data.orderId}*.`,
    ``,
    `💰 *Total Balance:* ${data.totalPoints} points`,
    ``,
    `Redeem your points for discounts on your next purchase!`,
    `Shop: ${STORE_URL}`,
  ].join('\n');
}

// ─── 16. OTP Verification ────────────────────────────────────
export function verificationOtp(code: string, name: string): string {
  return [
    `🔐 *Your Verification Code*`,
    ``,
    `Hi ${name},`,
    ``,
    `Use this code to complete your login:`,
    ``,
    `*${code}*`,
    ``,
    `This code expires in 5 minutes.`,
    `If you didn't request this, ignore this message.`,
    ``,
    `Team ADYAWEAR 💛`,
  ].join('\n');
}

// ─── 17. Wholesale Update ────────────────────────────────────
export function wholesaleUpdate(orderId: string, status: string, note?: string): string {
  const lines = [
    `📋 *Wholesale Order Update*`,
    ``,
    `Order *#${orderId}* status: *${status}*`,
  ];
  if (note) lines.push(`📝 ${note}`);
  return lines.join('\n');
}
