import { Product, Order, User } from '../types';

const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz-ZYRbFh5REExMLhRUaZzLsfkyl3pY5O3j2_I_DRicxIIfCVgnFYpw7aJfD6qGucb-/exec'; 

export async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${GAS_WEB_APP_URL}?action=getProducts`);
    return await response.json();
  } catch (error) {
    console.error('Fetch products error:', error);
    return [];
  }
}

export async function fetchOrders(lineUid: string): Promise<Order[]> {
  try {
    const response = await fetch(`${GAS_WEB_APP_URL}?action=getOrders&userId=${lineUid}`);
    return await response.json();
  } catch (error) {
    return [];
  }
}

export async function submitOrder(order: Order): Promise<boolean> {
  try {
    await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'submitOrder', order })
    });
    return true; 
  } catch (error) {
    return false;
  }
}

export async function syncMember(user: User): Promise<void> {
  try {
    await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'syncMember', user })
    });
  } catch (e) {}
}
