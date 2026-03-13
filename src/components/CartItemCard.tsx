import React from 'react';
import { Plus, Minus, Trash2, Package } from 'lucide-react';
import type { CartItem } from '@/types';
import { formatPrice } from '@/utils/format';

interface CartItemCardProps {
  item: CartItem;
  onUpdate: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
  disabled?: boolean;
}

export const CartItemCard = React.memo(function CartItemCard({
  item,
  onUpdate,
  onRemove,
  disabled,
}: CartItemCardProps) {
  return (
    <div className="flex gap-3 p-3 bg-white rounded-2xl shadow-sm">
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
        {item.product.image_url ? (
          <img
            src={item.product.image_url}
            alt={item.product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Package className="text-gray-400" size={24} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm leading-tight line-clamp-2">
          {item.product.name}
        </h3>
        <p className="text-sm font-bold mt-1">
          {formatPrice(item.product.price * item.quantity)}
        </p>
      </div>

      <div className="flex flex-col items-end justify-between flex-shrink-0">
        <button
          onClick={() => onRemove(item.product_id)}
          disabled={disabled}
          className="p-1 text-gray-400 active:text-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              item.quantity <= 1
                ? onRemove(item.product_id)
                : onUpdate(item.product_id, item.quantity - 1)
            }
            disabled={disabled}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
          >
            <Minus size={14} />
          </button>
          <span className="text-sm font-semibold min-w-[20px] text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdate(item.product_id, item.quantity + 1)}
            disabled={disabled}
            className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
});
