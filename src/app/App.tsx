import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from '@/layouts/MainLayout';
import { StorePage } from '@/pages/StorePage';
import { ProductsPage } from '@/pages/ProductsPage';
import { BasketPage } from '@/pages/BasketPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { useUserStore } from '@/store/userStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 300_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppInit() {
  const setStoreId = useUserStore((s) => s.setStoreId);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready();
    tg?.expand();

    const startParam = tg?.initDataUnsafe?.start_param;
    if (startParam) {
      const raw = startParam.startsWith('store_')
        ? startParam.slice(6)
        : startParam;
      const id = Number(raw);
      if (!isNaN(id) && id > 0) setStoreId(id);
    }
  }, [setStoreId]);

  return null;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInit />
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<StorePage />} />
            <Route path="/products/:categoryId" element={<ProductsPage />} />
            <Route path="/basket" element={<BasketPage />} />
            <Route path="/orders" element={<OrdersPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
