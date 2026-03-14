import React, { useState } from 'react';
import { Plus, Minus, Package } from 'lucide-react';
import type { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import { addToCart, updateCartItem, removeFromCart } from '@/api/cart';
import { formatPrice } from '@/utils/format';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = React.memo(function ProductCard({
  product,
}: ProductCardProps) {
  const items = useCartStore((s) => s.items);
  const storeId = useUserStore((s) => s.storeId);
  const [loading, setLoading] = useState(false);

  const cartItem = items.find((i) => i.product_id === product.id);
  const quantity = cartItem?.quantity ?? 0;

  const handleAdd = async () => {
    if (!storeId || loading) return;
    setLoading(true);
    useCartStore.getState().addItem({
      id: 0,
      product_id: product.id,
      quantity: 1,
      product,
    });
    try {
      const cart = await addToCart(product.id, storeId);
      useCartStore.getState().setCart(cart);
    } catch {
      useCartStore.getState().removeItem(product.id);
    } finally {
      setLoading(false);
    }
  };

  const handleIncrease = async () => {
    if (loading) return;
    setLoading(true);
    useCartStore.getState().updateItem(product.id, quantity + 1);
    try {
      const cart = await updateCartItem(product.id, quantity + 1);
      useCartStore.getState().setCart(cart);
    } catch {
      useCartStore.getState().updateItem(product.id, quantity);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrease = async () => {
    if (loading) return;
    setLoading(true);
    if (quantity <= 1) {
      useCartStore.getState().removeItem(product.id);
    } else {
      useCartStore.getState().updateItem(product.id, quantity - 1);
    }
    try {
      const cart =
        quantity <= 1
          ? await removeFromCart(product.id)
          : await updateCartItem(product.id, quantity - 1);
      useCartStore.getState().setCart(cart);
    } catch {
      if (quantity <= 1) {
        useCartStore.getState().addItem({
          id: cartItem?.id ?? 0,
          product_id: product.id,
          quantity,
          product,
        });
      } else {
        useCartStore.getState().updateItem(product.id, quantity);
      }
    } finally {
      setLoading(false);
    }
  };

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
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-1 mb-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto">
          <span className="font-bold text-sm">{formatPrice(product.price)}</span>

          {product.is_available &&
            (quantity === 0 ? (
              <button
                onClick={handleAdd}
                disabled={loading}
                className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
              >
                <Plus size={18} />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDecrease}
                  disabled={loading}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-semibold min-w-[20px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrease}
                  disabled={loading}
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
