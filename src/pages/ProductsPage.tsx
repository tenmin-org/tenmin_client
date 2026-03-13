import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { fetchProducts } from '@/api/products';
import { useTelegram } from '@/hooks/useTelegram';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { ProductCard } from '@/components/ProductCard';
import { CartSummary } from '@/components/CartSummary';
import { Loader } from '@/components/Loader';
import { EmptyState } from '@/components/EmptyState';
import type { Product } from '@/types';

const PRODUCTS_LIMIT = 20;

export function ProductsPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const catId = Number(categoryId);

  useEffect(() => {
    tg?.BackButton?.show();
    const handler = () => navigate(-1);
    tg?.BackButton?.onClick(handler);
    return () => {
      tg?.BackButton?.offClick(handler);
      tg?.BackButton?.hide();
    };
  }, [tg, navigate]);

  const [products, setProducts] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const offsetRef = useRef(0);

  const { isLoading } = useQuery({
    queryKey: ['products', catId],
    queryFn: async () => {
      const data = await fetchProducts(catId, PRODUCTS_LIMIT, 0);
      setProducts(data.items);
      setTotal(data.total);
      offsetRef.current = data.items.length;
      setHasMore(data.items.length < data.total);
      return data;
    },
    enabled: !!catId,
  });

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchProducts(catId, PRODUCTS_LIMIT, offsetRef.current);
      setProducts((prev) => [...prev, ...data.items]);
      offsetRef.current += data.items.length;
      setHasMore(offsetRef.current < data.total);
    } catch {
      /* keep current state */
    } finally {
      setLoadingMore(false);
    }
  }, [catId, loadingMore]);

  const setTriggerRef = useInfiniteScroll(loadMore, hasMore, loadingMore || isLoading);

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-semibold text-base">Товары</h1>
            {total > 0 && (
              <p className="text-xs text-gray-500">{total} товаров</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {isLoading && products.length === 0 && <Loader />}

        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {hasMore && (
          <div ref={setTriggerRef} className="py-4">
            {loadingMore && <Loader />}
          </div>
        )}

        {!isLoading && products.length === 0 && (
          <EmptyState
            title="Нет товаров"
            description="В этой категории пока нет товаров"
          />
        )}
      </div>

      <CartSummary />
    </div>
  );
}
