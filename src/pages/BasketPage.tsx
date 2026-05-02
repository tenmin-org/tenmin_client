import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ShoppingBag, Wallet } from 'lucide-react';
import { createOrder } from '@/api/orders';
import { updateCartItem, removeFromCart, clearCart as clearCartApi, fetchCart } from '@/api/cart';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import { useTelegram } from '@/hooks/useTelegram';
import { CartItemCard } from '@/components/CartItemCard';
import { HeroHeader } from '@/components/HeroHeader';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { formatPrice } from '@/utils/format';

function pluralize(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'товар';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'товара';
  return 'товаров';
}

export function BasketPage() {
  const navigate = useNavigate();
  const { haptic, closeMiniApp } = useTelegram();
  const items = useCartStore((s) => s.items);
  const storeId = useUserStore((s) => s.storeId);
  const getTotalPrice = useCartStore((s) => s.getTotalPrice);
  const getTotalItems = useCartStore((s) => s.getTotalItems);
  const getGrandTotal = useCartStore((s) => s.getGrandTotal);
  const deliveryPrice = useCartStore((s) => s.deliveryPrice);

  const [comment, setComment] = useState('');

  useQuery({
    queryKey: ['cart', storeId],
    queryFn: async () => {
      const cart = await fetchCart(storeId!);
      useCartStore.getState().setCart(cart);
      return cart;
    },
    enabled: !!storeId,
  });

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();
  const grandTotal = getGrandTotal();

  const orderMutation = useMutation({
    mutationFn: () => {
      if (!storeId) throw new Error('No store selected');
      return createOrder({
        store_id: storeId,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
        comment: comment.trim() || undefined,
      });
    },
    onSuccess: () => {
      haptic?.notificationOccurred('success');
      if (storeId) clearCartApi(storeId).catch(() => {});
      useCartStore.getState().clearCart();
      // В Telegram Mini App можно закрыть Web App сразу после оформления.
      if (window.Telegram?.WebApp) {
        closeMiniApp();
        return;
      }
      navigate('/orders');
    },
    onError: () => {
      haptic?.notificationOccurred('error');
    },
  });

  const handleUpdate = async (productId: number, quantity: number) => {
    if (!storeId) return;
    useCartStore.getState().optimisticSetQty(productId, quantity);
    try {
      const cart = await updateCartItem(productId, storeId, quantity);
      useCartStore.getState().setCart(cart);
    } catch { /* keep optimistic state */ }
  };

  const handleRemove = async (productId: number) => {
    if (!storeId) return;
    useCartStore.getState().optimisticRemove(productId);
    try {
      const cart = await removeFromCart(productId, storeId);
      useCartStore.getState().setCart(cart);
    } catch { /* keep optimistic state */ }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[80vh]">
        <HeroHeader
          icon={<ShoppingBag strokeWidth={1.75} />}
          title="Корзина"
          description="Добавьте товары из каталога — оформим доставку за пару шагов"
        />
        <div className="px-page">
          <EmptyState
            title="Пока пусто"
            description="Загляните в магазин и добавьте товары"
            action={{ label: 'В каталог', onClick: () => navigate('/') }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-44">
      <PageHeader title="Корзина" onBack={() => navigate(-1)} />

      <div className="px-page pt-4 space-y-3">
        {items.map((item) => (
          <CartItemCard
            key={item.product_id}
            item={item}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
            disabled={orderMutation.isPending}
          />
        ))}
      </div>

      <div className="px-page mt-4">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Дополнительные товары, пожелания к доставке..."
          className="w-full p-3.5 bg-white rounded-2xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-green-400 transition-colors"
          rows={3}
        />
      </div>

      <div className="fixed left-0 right-0 z-30 px-page pt-2 pb-4 bg-gradient-to-t from-gray-50 via-gray-50 bottom-above-tab-bar">
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
          <div className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-amber-800">
            <Wallet size={16} className="mt-0.5 flex-shrink-0" />
            <p className="text-xs font-medium">
              Оплата производится при получении заказа
            </p>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">
              {totalItems} {pluralize(totalItems)}
            </span>
            <span className="text-lg font-bold">{formatPrice(totalPrice)}</span>
          </div>
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-gray-500">Доставка</span>
            <span className="font-semibold">{formatPrice(deliveryPrice)}</span>
          </div>
          <div className="flex justify-between items-center mb-3 pt-2 border-t border-gray-100">
            <span className="text-sm font-semibold text-gray-800">Итого</span>
            <span className="text-lg font-bold">{formatPrice(grandTotal)}</span>
          </div>
          <button
            onClick={() => orderMutation.mutate()}
            disabled={orderMutation.isPending}
            className="w-full py-3.5 bg-green-500 text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {orderMutation.isPending ? 'Оформляем...' : 'Отправить курьеру'}
          </button>
          {orderMutation.isError && (
            <p className="text-red-500 text-xs text-center mt-2">
              Ошибка при создании заказа. Попробуйте снова.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
