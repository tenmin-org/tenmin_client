import { useLocation, useNavigate } from 'react-router-dom';
import { Store, ShoppingCart, Package } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

const tabs = [
  { path: '/', icon: Store, label: 'Магазин' },
  { path: '/orders', icon: Package, label: 'Заказы' },
  { path: '/basket', icon: ShoppingCart, label: 'Корзина' },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const getTotalItems = useCartStore((s) => s.getTotalItems);
  const totalItems = getTotalItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-gray-200 pb-tab-bar">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-page">
        {tabs.map((tab) => {
          const isActive =
            tab.path === '/'
              ? pathname === '/' || pathname.startsWith('/products')
              : pathname === tab.path;

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive ? 'text-green-500' : 'text-gray-400'
              }`}
            >
              <div className="relative">
                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {tab.path === '/basket' && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
