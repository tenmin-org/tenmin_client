import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchCategory } from '@/api/categories';
import { fetchProducts } from '@/api/products';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useUserStore } from '@/store/userStore';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';
import { CartSummary } from '@/components/CartSummary';
import { PageHeader } from '@/components/PageHeader';
import { Loader } from '@/components/Loader';
import { EmptyState } from '@/components/EmptyState';
import type { Category, Product } from '@/types';

const PRODUCTS_LIMIT = 20;

export function ProductsPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const storeId = useUserStore((s) => s.storeId);
  const catId = Number(categoryId);

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
  const subtitle = showSubcategories
    ? 'Выберите подкатегорию'
    : total > 0
      ? `${total} товаров`
      : undefined;

  return (
    <div className="pb-4">
      <PageHeader title={title} subtitle={subtitle} onBack={() => navigate(-1)} />

      <div className="px-page pt-4">
        {subcatsLoading && <Loader />}

        {!subcatsLoading && showSubcategories && (
          <div className="grid grid-cols-2 gap-3">
            {subcategories.map((cat: Category) => (
              <CategoryCard
                key={cat.id}
                category={cat}
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
