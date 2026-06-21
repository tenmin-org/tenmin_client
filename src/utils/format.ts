export function formatPriceAmount(price: number | string): string {
  return parseFloat(String(price)).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

export function formatPrice(price: number): string {
  return formatPriceAmount(price) + '₸';
}
