import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Store as StoreIcon } from 'lucide-react';
import { fetchStores, fetchStore } from '@/api/stores';
import { fetchCategories } from '@/api/categories';
import { fetchCart } from '@/api/cart';
import { useUserStore } from '@/store/userStore';
import { useCartStore } from '@/store/cartStore';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { StoreCard } from '@/components/StoreCard';
import { CategoryCard } from '@/components/CategoryCard';
import { CartSummary } from '@/components/CartSummary';
import { HeroHeader } from '@/components/HeroHeader';
import { SectionHeading } from '@/components/SectionHeading';
import { Loader } from '@/components/Loader';
import { EmptyState } from '@/components/EmptyState';
import type { Category } from '@/types';

const CATEGORIES_LIMIT = 10;

export function StorePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storeId = useUserStore((s) => s.storeId);
  const setStoreId = useUserStore((s) => s.setStoreId);
  const hasFloatingCart = useCartStore((s) => s.items.length > 0);

  useEffect(() => {
    const paramId = searchParams.get('store_id');
    if (paramId && !storeId) {
      setStoreId(Number(paramId));
    }
  }, [searchParams, storeId, setStoreId]);

  const { data: stores, isLoading: storesLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: fetchStores,
    enabled: !storeId,
  });

  const { data: store } = useQuery({
    queryKey: ['store', storeId],
    queryFn: () => fetchStore(storeId!),
    enabled: !!storeId,
  });

  useQuery({
    queryKey: ['cart', storeId],
    queryFn: async () => {
      const cart = await fetchCart(storeId!);
      useCartStore.getState().setCart(cart);
      return cart;
    },
    enabled: !!storeId,
  });

  const { data: firstPage, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', storeId],
    queryFn: () =>
      fetchCategories(storeId!, { limit: CATEGORIES_LIMIT, offset: 0 }),
    enabled: !!storeId,
  });

  const [extraPages, setExtraPages] = useState<Category[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (firstPage) {
      setExtraPages([]);
      offsetRef.current = firstPage.length;
      setHasMore(firstPage.length === CATEGORIES_LIMIT);
    }
  }, [firstPage]);

  const categories = useMemo(
    () => [...(firstPage ?? []), ...extraPages],
    [firstPage, extraPages],
  );

  const loadMoreCategories = useCallback(async () => {
    if (!storeId || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchCategories(storeId, {
        limit: CATEGORIES_LIMIT,
        offset: offsetRef.current,
      });
      setExtraPages((prev) => [...prev, ...data]);
      offsetRef.current += data.length;
      setHasMore(data.length === CATEGORIES_LIMIT);
    } catch {
      /* keep current state */
    } finally {
      setLoadingMore(false);
    }
  }, [storeId, loadingMore]);

  const setTriggerRef = useInfiniteScroll(
    loadMoreCategories,
    hasMore,
    loadingMore || categoriesLoading,
  );

  if (!storeId) {
    return (
      <div className="pb-4">
        <HeroHeader
          icon={<StoreIcon strokeWidth={1.75} />}
          title="Магазины"
          description="Выберите магазин для заказа"
        />

        {storesLoading && (
          <div className="px-page">
            <Loader />
          </div>
        )}

        {!storesLoading && stores?.length === 0 && (
          <div className="px-page">
            <EmptyState
              icon={<StoreIcon size={48} />}
              title="Нет доступных магазинов"
              description="Попробуйте позже"
            />
          </div>
        )}

        {!storesLoading && stores && stores.length > 0 && (
          <div className="px-page">
            <SectionHeading>Все магазины</SectionHeading>
            <div className="rounded-[14px] bg-gray-100/90 p-2 shadow-inner shadow-gray-200/40">
              <div className="space-y-2">
                {stores.map((s) => (
                  <StoreCard key={s.id} store={s} onClick={() => setStoreId(s.id)} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={hasFloatingCart ? 'pb-floating-cart' : 'pb-4'}>
      {store && (
        <HeroHeader
          compact
          icon={<MapPin strokeWidth={2} />}
          title={store.name}
          description={store.address ?? undefined}
        />
      )}

      <div className="px-page">
        <SectionHeading>Категории</SectionHeading>

        {categoriesLoading && categories.length === 0 && <Loader />}

        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onClick={() => navigate(`/products/${cat.id}`)}
            />
          ))}
        </div>

        {hasMore && (
          <div ref={setTriggerRef} className="py-4">
            {loadingMore && <Loader />}
          </div>
        )}

        {!categoriesLoading && categories.length === 0 && (
          <EmptyState
            title="Нет категорий"
            description="В этом магазине пока нет товаров"
          />
        )}
      </div>

      <CartSummary />
    </div>
  );
}
