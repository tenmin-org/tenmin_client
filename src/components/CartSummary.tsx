import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/format';

function pluralize(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'товар';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'товара';
  return 'товаров';
}

export function CartSummary() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const getTotalPrice = useCartStore((s) => s.getTotalPrice);
  const getTotalItems = useCartStore((s) => s.getTotalItems);

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-30">
      <button
        onClick={() => navigate('/basket')}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-green-500 text-white rounded-2xl shadow-lg active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-2">
          <ShoppingCart size={20} />
          <span className="font-semibold">
            {totalItems} {pluralize(totalItems)}
          </span>
        </div>
        <span className="font-bold">{formatPrice(totalPrice)}</span>
      </button>
    </div>
  );
}
