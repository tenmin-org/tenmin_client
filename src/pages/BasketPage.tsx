import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ChevronRight, CreditCard, Info, Landmark, ShoppingBag } from 'lucide-react';
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
import { weightGramsForOrderPayload } from '@/utils/cartPricing';
import type { PaymentMethod } from '@/types';

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');
  /** Нижняя панель с итогом перекрывает поле при открытой клавиатуре — прячем, пока в фокусе поле в корзине. */
  const [checkoutBarHidden, setCheckoutBarHidden] = useState(false);
  const cartFieldsRef = useRef<HTMLDivElement>(null);
  const paymentSectionRef = useRef<HTMLDivElement>(null);
  const checkoutDockRef = useRef<HTMLDivElement>(null);
  const revealBarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToPaymentSection = useCallback(() => {
    haptic?.impactOccurred('light');
    const el = paymentSectionRef.current;
    if (!el) return;

    const measureAndScroll = () => {
      const dock = checkoutDockRef.current;
      const viewportH = window.visualViewport?.height ?? window.innerHeight;
      const dockTop = dock?.getBoundingClientRect().top ?? viewportH;
      const gap = 20;
      const safeBottom = dockTop - gap;
      const r = el.getBoundingClientRect();
      const overflow = r.bottom - safeBottom;
      const scrollDelta = Math.max(0, overflow);
      window.scrollTo({
        top: window.scrollY + scrollDelta,
        behavior: 'smooth',
      });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(measureAndScroll);
    });
  }, [haptic]);

  const hideCheckoutBar = useCallback(() => {
    if (revealBarTimerRef.current) {
      clearTimeout(revealBarTimerRef.current);
      revealBarTimerRef.current = null;
    }
    setCheckoutBarHidden(true);
  }, []);

  const scheduleShowCheckoutBar = useCallback(() => {
    if (revealBarTimerRef.current) clearTimeout(revealBarTimerRef.current);
    revealBarTimerRef.current = setTimeout(() => {
      revealBarTimerRef.current = null;
      const el = document.activeElement;
      if (
        el &&
        cartFieldsRef.current?.contains(el) &&
        (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
      ) {
        return;
      }
      setCheckoutBarHidden(false);
    }, 200);
  }, []);

  useEffect(
    () => () => {
      if (revealBarTimerRef.current) clearTimeout(revealBarTimerRef.current);
    },
    [],
  );

  /** При входе на корзину показываем список товаров сверху, а не хвост страницы. */
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
        items: items.map((i) => {
          const w = weightGramsForOrderPayload(i);
          return {
            product_id: i.product_id,
            quantity: i.quantity,
            ...(w != null ? { weight_grams: w } : {}),
          };
        }),
        comment: comment.trim() || undefined,
        payment_method: paymentMethod,
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
    <div
      className={
        checkoutBarHidden
          ? 'pb-with-bottom-nav'
          : 'pb-[max(18rem,min(52vh,26rem))]'
      }
    >
      <PageHeader title="Корзина" onBack={() => navigate(-1)} />

      <div ref={cartFieldsRef}>
        <div className="px-page pt-4 space-y-3">
          {items.map((item) => (
            <CartItemCard
              key={item.product_id}
              item={item}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
              onSetWeightGrams={(productId, grams) =>
                useCartStore.getState().setWeightGrams(productId, grams)
              }
              onCartFieldFocus={hideCheckoutBar}
              onCartFieldBlur={scheduleShowCheckoutBar}
              disabled={orderMutation.isPending}
            />
          ))}
        </div>

        <div className="px-page mt-6 scroll-mt-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Комментарии</h2>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onFocus={hideCheckoutBar}
            onBlur={scheduleShowCheckoutBar}
            placeholder="Дополнительные товары, пожелания к доставке…"
            className="w-full min-h-[5.5rem] p-3.5 bg-white rounded-2xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-green-400 transition-colors"
            rows={4}
          />
        </div>

        <div
          ref={paymentSectionRef}
          id="basket-payment-method"
          className="px-page mt-6 pb-10 scroll-mt-36"
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Способ оплаты</h2>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            Оплата при получении — укажите, как удобнее рассчитаться с курьером.
          </p>
          <div
            className="flex rounded-2xl border border-gray-200 bg-gray-50/80 p-1 gap-1"
            role="group"
            aria-label="Способ оплаты при получении"
          >
            <button
              type="button"
              disabled={orderMutation.isPending}
              onClick={() => setPaymentMethod('transfer')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                paymentMethod === 'transfer'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-gray-600 active:bg-gray-100/90'
              }`}
            >
              <Landmark size={18} strokeWidth={1.75} className="opacity-90" />
              Перевод
            </button>
            <button
              type="button"
              disabled={orderMutation.isPending}
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                paymentMethod === 'card'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-gray-600 active:bg-gray-100/90'
              }`}
            >
              <CreditCard size={18} strokeWidth={1.75} className="opacity-90" />
              Карта
            </button>
          </div>
        </div>
      </div>

      {!checkoutBarHidden && (
        <div
          ref={checkoutDockRef}
          className="fixed left-0 right-0 z-30 px-page pt-2 pb-4 bg-gradient-to-t from-gray-50 via-gray-50 bottom-above-tab-bar"
        >
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
            <button
              type="button"
              onClick={scrollToPaymentSection}
              disabled={orderMutation.isPending}
              aria-label={`Изменить способ оплаты. Сейчас: ${paymentMethod === 'transfer' ? 'перевод' : 'карта'}`}
              className="mb-3 w-full flex gap-2.5 rounded-xl border border-gray-100 bg-gray-50/90 px-3 py-2.5 text-left transition-colors active:bg-gray-100/90 disabled:opacity-60 disabled:pointer-events-none"
            >
              <Info
                size={17}
                className="text-gray-400 flex-shrink-0 mt-0.5"
                strokeWidth={2}
                aria-hidden
              />
              <div className="min-w-0 flex-1 text-xs text-gray-600 leading-snug">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-800 pr-1">Оплата при получении</p>
                  <span className="flex flex-shrink-0 items-center gap-0.5 rounded-lg bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                    {paymentMethod === 'transfer' ? 'Перевод' : 'Карта'}
                    <ChevronRight size={14} className="opacity-70" aria-hidden />
                  </span>
                </div>
                <p className="mt-1">
                  Сумма ориентировочная — по весу точный итог сообщит курьер при доставке.
                </p>
              </div>
            </button>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">
                {totalItems} {pluralize(totalItems)}
              </span>
              <span className="text-lg font-bold tabular-nums">
                ≈&nbsp;{formatPrice(totalPrice)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-gray-500">Доставка</span>
              <span className="font-semibold tabular-nums">{formatPrice(deliveryPrice)}</span>
            </div>
            <div className="flex justify-between items-center mb-3 pt-2 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-800">Итого</span>
              <span className="text-lg font-bold tabular-nums">
                ≈&nbsp;{formatPrice(grandTotal)}
              </span>
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
      )}
    </div>
  );
}
