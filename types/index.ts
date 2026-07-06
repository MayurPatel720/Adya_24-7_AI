export interface WebhookEvent {
  event: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface OrderData {
  orderId: string;
  userId?: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: string;
  subtotal: number;
  shipping: number;
  total: number;
  discount?: number;
  couponCode?: string;
  awbNumber?: string;
  courierName?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  orderStatus: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface ShippingUpdate {
  orderId: string;
  awbNumber?: string;
  courierName?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  orderStatus: string;
}

export interface RefundData {
  orderId: string;
  refundAmount: number;
  refundId?: string;
  customerName: string;
  customerPhone: string;
}

export interface ReturnData {
  orderId: string;
  returnId: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  customerName: string;
  customerPhone: string;
  adminNote?: string;
  refundAmount?: number;
}

export interface InvoiceData {
  orderId: string;
  customerPhone: string;
  invoicePdfBase64: string;
  fileName: string;
}

export interface CartData {
  userId: string;
  customerPhone?: string;
  customerName?: string;
  items: { name: string; price: number; quantity: number }[];
  subtotal: number;
  abandonedAt: string;
}

export interface StockData {
  productName: string;
  productSlug: string;
  customerPhone: string;
  customerName: string;
}

export interface LoyaltyData {
  customerPhone: string;
  customerName: string;
  pointsEarned: number;
  totalPoints: number;
  orderId: string;
}

export interface WhatsAppMessage {
  to: string;
  text?: string;
  imageUrl?: string;
  documentUrl?: string;
  documentName?: string;
  caption?: string;
}

export interface MessageLog {
  id: string;
  to: string;
  event: string;
  template: string;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
  timestamp: string;
  orderId?: string;
}

export interface ServiceConfig {
  whatsappEnabled: boolean;
  openclawConnected: boolean;
  lastHealthCheck: string;
  totalSent: number;
  totalFailed: number;
}
