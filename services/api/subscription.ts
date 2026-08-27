import { apiJson } from './client';
import { ServerSubscription, OrderSession } from '../../types/subscription';

export const subscriptionApi = {
  async get(): Promise<ServerSubscription | null> {
    const res = await apiJson<{ subscription: ServerSubscription | null }>('/subscription', { method: 'GET' });
    return res?.subscription || null;
  },
  async createOrder(planId: string): Promise<OrderSession> {
    const res = await apiJson<OrderSession>('/subscription/order', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
    return res;
  },
  async verify(orderId: string): Promise<ServerSubscription> {
    const res = await apiJson<{ subscription: ServerSubscription }>('/subscription/verify', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
    return res.subscription;
  },
};
