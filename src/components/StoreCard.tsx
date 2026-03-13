import React from 'react';
import { Store as StoreIcon, ChevronRight } from 'lucide-react';
import type { Store } from '@/types';

interface StoreCardProps {
  store: Store;
  onClick: () => void;
}

export const StoreCard = React.memo(function StoreCard({
  store,
  onClick,
}: StoreCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
    >
      {store.image_url ? (
        <img
          src={store.image_url}
          alt={store.name}
          className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
          <StoreIcon className="text-green-500" size={24} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-base truncate">{store.name}</h3>
        <p className="text-sm text-gray-500 truncate">{store.address}</p>
      </div>

      <ChevronRight className="ml-auto text-gray-400 flex-shrink-0" size={20} />
    </div>
  );
});
