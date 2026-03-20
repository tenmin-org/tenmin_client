export interface Store {
  id: number;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  is_active: boolean;
}

export interface Category {
  id: number;
  store_id: number;
  name: string;
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
  is_available: boolean;
}

export interface ProductBrief {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
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
}

export interface Cart {
  id: number | null;
  store_id: number | null;
  items: CartItem[];
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product: ProductBrief;
}

export interface Order {
  id: number;
  store_id: number;
  status: string;
  comment: string | null;
  total_price: number;
  items: OrderItem[];
  created_at: string;
}
