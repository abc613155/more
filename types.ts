export interface Product {
  id: string;
  brand: string;
  style: string;
  color: string;
  price: number;
  promoRules: string;
  diopterRange: string;
  productUrl: string;
}

export interface CartItem {
  id: string;
  buyerId: string;
  productId: string;
  brand: string;
  style: string;
  color: string;
  price: number;
  quantity: number;
  diopter: string;
  gifts?: any[];
}

export interface SubBuyer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface User {
  lineUid: string;
  displayName: string;
}

export interface Order {
  id?: string;
  userId: string;
  buyers: SubBuyer[];
  items: CartItem[];
  totalPrice: number;
  timestamp: string;
}

export interface PromoHint {
  nextThreshold: number;
  savings: number;
  avgPrice: number;
  message: string;
}
