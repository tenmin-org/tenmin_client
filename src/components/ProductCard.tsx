import React, { useCallback, useRef } from 'react';
import { Plus, Minus, Package } from 'lucide-react';
import type { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import { addToCart, updateCartItem, removeFromCart } from '@/api/cart';
import { formatPriceAmount } from '@/utils/format';
import { isKgProduct } from '@/utils/cartPricing';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = React.memo(function ProductCard({
  product,
}: ProductCardProps) {
  const items = useCartStore((s) => s.items);
  const storeId = useUserStore((s) => s.storeId);
  const busyRef = useRef(false);

  const cartItem = items.find((i) => i.product_id === product.id);
  const quantity = cartItem?.quantity ?? 0;

  const sync = useCallback(
    (promise: Promise<unknown>) => {
      busyRef.current = true;
      promise
        .then((cart) => useCartStore.getState().setCart(cart as any))
        .catch(() => {})
        .finally(() => { busyRef.current = false; });
    },
    [],
  );

  const handleAdd = useCallback(() => {
    if (!storeId || busyRef.current) return;
    useCartStore.getState().optimisticAdd(product);
    sync(addToCart(product.id, storeId));
  }, [storeId, product, sync]);

  const handleIncrease = useCallback(() => {
    if (!storeId || busyRef.current) return;
    const next = quantity + 1;
    useCartStore.getState().optimisticSetQty(product.id, next);
    sync(updateCartItem(product.id, storeId, next));
  }, [storeId, product.id, quantity, sync]);

  const handleDecrease = useCallback(() => {
    if (!storeId || busyRef.current) return;
    if (quantity <= 1) {
      useCartStore.getState().optimisticRemove(product.id);
      sync(removeFromCart(product.id, storeId));
    } else {
      const next = quantity - 1;
      useCartStore.getState().optimisticSetQty(product.id, next);
      sync(updateCartItem(product.id, storeId, next));
    }
  }, [storeId, product.id, quantity, sync]);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <div className="aspect-square relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Package className="text-gray-400" size={40} />
          </div>
        )}
        {!product.is_available && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-sm font-medium">Нет в наличии</span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-medium text-sm leading-tight line-clamp-2 mb-1">
          {product.name}
        </h3>
        {isKgProduct(product) && (
          <p className="text-[11px] text-yellow-600 font-medium leading-snug mb-1.5">
            Точный вес можно указать в корзине
          </p>
        )}
        {/* {product.description && (
          <p className="text-xs text-gray-500 line-clamp-1 mb-2">
            {product.description}
          </p>
        )} */}

        <div className="flex items-center justify-between mt-auto">
          <span className="font-bold text-sm">
            {product.measure
              ? `${formatPriceAmount(product.price)} ₸/${product.measure}`
              : `${formatPriceAmount(product.price)} ₸`}
          </span>

          {product.is_available &&
            (quantity === 0 ? (
              <button
                onClick={handleAdd}
                className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center active:scale-90 transition-transform"
              >
                <Plus size={18} />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDecrease}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-semibold min-w-[20px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrease}
                  className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Plus size={14} />
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
});
