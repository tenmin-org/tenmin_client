export function formatPriceAmount(price: number): string {
  return price.toLocaleString('ru-RU');
}

export function formatPrice(price: number): string {
  return formatPriceAmount(price) + '₸';
}
