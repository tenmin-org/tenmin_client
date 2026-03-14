import { useEffect, useRef, useState, useCallback } from 'react';
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
import { Loader } from '@/components/Loader';
import { EmptyState } from '@/components/EmptyState';
import type { Category } from '@/types';

const CATEGORIES_LIMIT = 10;

export function StorePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storeId = useUserStore((s) => s.storeId);
  const setStoreId = useUserStore((s) => s.setStoreId);
  const setCart = useCartStore((s) => s.setCart);

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

  const { data: cart } = useQuery({
    queryKey: ['cart', storeId],
    queryFn: () => fetchCart(storeId!),
    enabled: !!storeId,
  });

  useEffect(() => {
    if (cart) {
      setCart(cart);
    }
  }, [cart, setCart]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef(0);

  const { isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', storeId],
    queryFn: async () => {
      const data = await fetchCategories(storeId!, CATEGORIES_LIMIT, 0);
      setCategories(data);
      offsetRef.current = data.length;
      setHasMore(data.length === CATEGORIES_LIMIT);
      return data;
    },
    enabled: !!storeId,
  });

  const loadMoreCategories = useCallback(async () => {
    if (!storeId || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchCategories(storeId, CATEGORIES_LIMIT, offsetRef.current);
      setCategories((prev) => [...prev, ...data]);
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
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold mb-1">Магазины</h1>
        <p className="text-sm text-gray-500 mb-5">Выберите магазин для заказа</p>

        {storesLoading && <Loader />}

        {!storesLoading && stores?.length === 0 && (
          <EmptyState
            icon={<StoreIcon size={48} />}
            title="Нет доступных магазинов"
            description="Попробуйте позже"
          />
        )}

        <div className="space-y-3">
          {stores?.map((s) => (
            <StoreCard key={s.id} store={s} onClick={() => setStoreId(s.id)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {store && (
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold">{store.name}</h1>
          {store.address && (
            <div className="flex items-center gap-1.5 mt-1 text-gray-500">
              <MapPin size={14} />
              <span className="text-sm">{store.address}</span>
            </div>
          )}
        </div>
      )}

      <div className="px-4">
        <h2 className="text-lg font-semibold mb-3">Категории</h2>

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
