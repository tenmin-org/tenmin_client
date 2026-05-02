export interface Store {
  id: number;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  is_active: boolean;
  is_new?: boolean;
  delivery_price?: number;
}

export interface Category {
  id: number;
  store_id: number;
  name: string;
  /** Латинский slug для локального файла `src/assets/categories/{code}.webp` */
  code: string | null;
  image_url: string | null;
  position: number;
  parent_id: number | null;
  has_children: boolean;
}

export interface Product {
  id: number;
  store_id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  measure: string | null;
  is_available: boolean;
}

export interface ProductBrief {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  measure: string | null;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  limit: number;
  offset: number;
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
  /** Локально для товаров по кг; с API корзины не приходит. */
  weight_grams?: number;
}

export interface Cart {
  id: number | null;
  store_id: number | null;
  items: CartItem[];
  delivery_price?: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  weight_grams?: number | null;
  product: ProductBrief;
}

/** Как клиент планирует оплатить при получении (сохраняется в заказе). */
export type PaymentMethod = 'transfer' | 'card';

/** GET /orders — без позиций, для быстрого списка */
export interface OrderSummary {
  id: number;
  store_id: number;
  status: string;
  comment: string | null;
  total_price: number;
  /** С сервера с миграции; старые заказы без поля — считаем переводом */
  payment_method?: PaymentMethod;
  created_at: string;
}

export interface Order {
  id: number;
  store_id: number;
  status: string;
  comment: string | null;
  total_price: number;
  payment_method?: PaymentMethod;
  items: OrderItem[];
  created_at: string;
}
