import type { CartItem, OrderItem, ProductBrief } from '@/types';

export const KG_MEASURE = 'кг';

export function isKgProduct(product: { measure: string | null }): boolean {
  return product.measure === KG_MEASURE;
}

export function defaultWeightGrams(quantity: number): number {
  return Math.max(1, quantity) * 1000;
}

/** Актуальный вес строки корзины в граммах (для товаров по кг). */
export function lineWeightGrams(item: CartItem): number {
  if (!isKgProduct(item.product)) return item.quantity * 1000;
  const w = item.weight_grams;
  if (w != null && w > 0) return w;
  return defaultWeightGrams(item.quantity);
}

export function cartLineSubtotal(item: CartItem): number {
  if (isKgProduct(item.product)) {
    return item.product.price * (lineWeightGrams(item) / 1000);
  }
  return item.product.price * item.quantity;
}

/** Сумма по позиции в заказе (учёт веса для кг). */
export function orderItemLineSubtotal(item: OrderItem): number {
  const unit = Number(item.price);
  if (item.weight_grams != null && item.weight_grams > 0) {
    return unit * (item.weight_grams / 1000);
  }
  return unit * item.quantity;
}

export function weightGramsForOrderPayload(item: CartItem): number | undefined {
  if (!isKgProduct(item.product)) return undefined;
  return Math.round(lineWeightGrams(item));
}
