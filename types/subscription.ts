export type PlanId = 'monthly' | 'yearly';
export type SubscriptionStatus = 'trial' | 'active' | 'expired';

// Local plan metadata (must match backend subscriptionConfig).
export interface Plan {
  id: PlanId;
  label: string;
  days: number;
  price: number; // INR
}

// Response shape from GET /api/v1/subscription
export interface ServerSubscription {
  id: string;
  userId: string;
  planId: string | null;
  planName: string | null;
  status: SubscriptionStatus;
  premium: boolean;
  trialStartedAt: string;
  trialEndsAt: string;
  activeUntil: string | null;
  daysRemaining: number;
}

// Response from POST /api/v1/subscription/order
export interface OrderSession {
  orderId: string;
  cashfreeOrderId: string;
  paymentSessionId: string;
  amount: number;
  currency: string;
}
