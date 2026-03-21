import React from 'react';
import { ShoppingBag } from 'lucide-react';
import type { Category } from '@/types';
import { getLocalCategoryImageSrc } from '@/utils/categoryLocalImage';

interface CategoryCardProps {
  category: Category;
  /** StoreCategory.position родителя — для файлов вида `1_2.png` у подкатегорий */
  parentStorePosition?: number;
  onClick: () => void;
}

export const CategoryCard = React.memo(function CategoryCard({
  category,
  parentStorePosition,
  onClick,
}: CategoryCardProps) {
  const imageSrc = getLocalCategoryImageSrc(
    category.position,
    category.parent_id != null
      ? (parentStorePosition ?? null)
      : undefined,
  );

  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl aspect-square cursor-pointer active:scale-[0.97] transition-transform shadow-sm"
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={category.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
          <ShoppingBag className="text-green-500" size={40} />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <p className="text-white font-semibold text-sm">{category.name}</p>
      </div>
    </div>
  );
});
