import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { fetchCategories, fetchCategory } from '@/api/categories';
import { fetchProducts } from '@/api/products';
import { useTelegram } from '@/hooks/useTelegram';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useUserStore } from '@/store/userStore';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';
import { CartSummary } from '@/components/CartSummary';
import { Loader } from '@/components/Loader';
import { EmptyState } from '@/components/EmptyState';
import type { Category, Product } from '@/types';

const PRODUCTS_LIMIT = 20;

export function ProductsPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const storeId = useUserStore((s) => s.storeId);
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

  const { data: categoryMeta } = useQuery({
    queryKey: ['category', storeId, catId],
    queryFn: () => fetchCategory(storeId!, catId),
    enabled: !!storeId && !!catId,
  });

  const {
    data: subcategories = [],
    isLoading: subcatsLoading,
    isSuccess: subcatsLoaded,
  } = useQuery({
    queryKey: ['categories', storeId, 'children', catId],
    queryFn: () => fetchCategories(storeId!, { parentId: catId }),
    enabled: !!storeId && !!catId,
  });

  const showSubcategories = subcatsLoaded && subcategories.length > 0;

  const productsEnabled =
    !!storeId && !!catId && subcatsLoaded && !showSubcategories;

  const { data: firstProductsPage, isLoading: productsLoading } = useQuery({
    queryKey: ['products', storeId, catId],
    queryFn: () => fetchProducts(storeId!, catId, PRODUCTS_LIMIT, 0),
    enabled: productsEnabled,
  });

  const [extraProducts, setExtraProducts] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef(0);

  useEffect(() => {
    setExtraProducts([]);
    offsetRef.current = firstProductsPage?.items.length ?? 0;
    setHasMore(
      (firstProductsPage?.items.length ?? 0) <
        (firstProductsPage?.total ?? 0),
    );
  }, [firstProductsPage, storeId, catId]);

  const products = useMemo(
    () => [...(firstProductsPage?.items ?? []), ...extraProducts],
    [firstProductsPage, extraProducts],
  );

  const total = firstProductsPage?.total ?? 0;

  const loadMore = useCallback(async () => {
    if (!storeId || loadingMore || !productsEnabled) return;
    setLoadingMore(true);
    try {
      const data = await fetchProducts(
        storeId,
        catId,
        PRODUCTS_LIMIT,
        offsetRef.current,
      );
      setExtraProducts((prev) => [...prev, ...data.items]);
      offsetRef.current += data.items.length;
      setHasMore(offsetRef.current < data.total);
    } catch {
      /* keep state */
    } finally {
      setLoadingMore(false);
    }
  }, [storeId, catId, loadingMore, productsEnabled]);

  const setTriggerRef = useInfiniteScroll(
    loadMore,
    hasMore,
    loadingMore || productsLoading,
  );

  const title = categoryMeta?.name ?? 'Каталог';

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-semibold text-base">{title}</h1>
            {!showSubcategories && total > 0 && (
              <p className="text-xs text-gray-500">{total} товаров</p>
            )}
            {showSubcategories && (
              <p className="text-xs text-gray-500">Выберите подкатегорию</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {subcatsLoading && <Loader />}

        {!subcatsLoading && showSubcategories && (
          <div className="grid grid-cols-2 gap-3">
            {subcategories.map((cat: Category) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                parentStorePosition={categoryMeta?.position}
                onClick={() => navigate(`/products/${cat.id}`)}
              />
            ))}
          </div>
        )}

        {!subcatsLoading && !showSubcategories && productsLoading && (
          <Loader />
        )}

        {!subcatsLoading && !showSubcategories && (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!subcatsLoading && !showSubcategories && hasMore && (
          <div ref={setTriggerRef} className="py-4">
            {loadingMore && <Loader />}
          </div>
        )}

        {!subcatsLoading &&
          !showSubcategories &&
          !productsLoading &&
          products.length === 0 &&
          subcatsLoaded && (
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
