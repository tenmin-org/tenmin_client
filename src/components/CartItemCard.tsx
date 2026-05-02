import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Minus, Trash2, Package } from 'lucide-react';
import type { CartItem } from '@/types';
import { formatPrice } from '@/utils/format';
import {
  cartLineSubtotal,
  defaultWeightGrams,
  isKgProduct,
  lineWeightGrams,
} from '@/utils/cartPricing';

interface CartItemCardProps {
  item: CartItem;
  onUpdate: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
  onSetWeightGrams?: (productId: number, grams: number) => void;
  /** Скрыть нижнюю панель корзины (клавиатура на телефоне) */
  onCartFieldFocus?: () => void;
  onCartFieldBlur?: () => void;
  disabled?: boolean;
}

export const CartItemCard = React.memo(function CartItemCard({
  item,
  onUpdate,
  onRemove,
  onSetWeightGrams,
  onCartFieldFocus,
  onCartFieldBlur,
  disabled,
}: CartItemCardProps) {
  const [weightEditorOpen, setWeightEditorOpen] = useState(false);
  const [gramsDraft, setGramsDraft] = useState('');
  const isKg = isKgProduct(item.product);
  const maxG = item.quantity * 50000;
  const committedGrams = lineWeightGrams(item);

  const commitWeight = useCallback(() => {
    if (!onSetWeightGrams) return;
    const def = defaultWeightGrams(item.quantity);
    const raw = gramsDraft.trim();
    if (raw === '') {
      onSetWeightGrams(item.product_id, def);
      setGramsDraft(String(def));
      return;
    }
    const n = parseInt(raw.replace(/\D/g, ''), 10);
    if (!Number.isFinite(n)) {
      onSetWeightGrams(item.product_id, def);
      setGramsDraft(String(def));
      return;
    }
    const clamped = Math.min(Math.max(50, n), maxG);
    onSetWeightGrams(item.product_id, clamped);
    setGramsDraft(String(clamped));
  }, [gramsDraft, item.product_id, item.quantity, maxG, onSetWeightGrams]);

  /** Подставить вес из стора при открытии редактора и при смене количества / веса снаружи (не при каждом ререндере item). */
  useEffect(() => {
    if (!weightEditorOpen) return;
    setGramsDraft(String(committedGrams));
  }, [weightEditorOpen, committedGrams]);

  const draftParsed = useMemo(() => {
    const t = gramsDraft.trim();
    if (t === '') return null;
    const n = parseInt(t.replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? n : null;
  }, [gramsDraft]);

  const lineTotal = useMemo(() => {
    if (!isKg) return cartLineSubtotal(item);
    if (
      weightEditorOpen &&
      draftParsed != null &&
      draftParsed >= 50 &&
      draftParsed <= maxG
    ) {
      return item.product.price * (draftParsed / 1000);
    }
    return cartLineSubtotal(item);
  }, [draftParsed, isKg, item, maxG, weightEditorOpen]);

  const closeWeightEditor = useCallback(() => {
    commitWeight();
    setWeightEditorOpen(false);
    onCartFieldBlur?.();
  }, [commitWeight, onCartFieldBlur]);

  return (
    <div className="flex gap-3 p-3 bg-white rounded-2xl shadow-sm">
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
        {item.product.image_url ? (
          <img
            src={item.product.image_url}
            alt={item.product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Package className="text-gray-400" size={24} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm leading-tight line-clamp-2">
          {item.product.name}
        </h3>
        <p className="text-sm font-bold mt-1">{formatPrice(lineTotal)}</p>
        {isKg && onSetWeightGrams && (
          <div className="mt-1.5">
            {!weightEditorOpen ? (
              <button
                type="button"
                onClick={() => {
                  setGramsDraft(String(lineWeightGrams(item)));
                  setWeightEditorOpen(true);
                }}
                disabled={disabled}
                className="text-xs font-medium text-green-600 underline underline-offset-2 hover:text-green-700 disabled:opacity-50"
              >
                Указать точный вес
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <label className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="whitespace-nowrap">Вес, г</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    autoFocus
                    value={gramsDraft}
                    disabled={disabled}
                    onFocus={() => onCartFieldFocus?.()}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d]/g, '');
                      setGramsDraft(v);
                    }}
                    onBlur={() => {
                      commitWeight();
                      onCartFieldBlur?.();
                    }}
                    className="w-24 px-2 py-1 rounded-lg border border-gray-200 text-sm font-medium tabular-nums focus:outline-none focus:border-green-400 disabled:opacity-50"
                  />
                </label>
                <button
                  type="button"
                  onClick={closeWeightEditor}
                  disabled={disabled}
                  className="text-xs font-medium text-gray-500 px-2 py-1 rounded-lg bg-gray-100 active:scale-95 disabled:opacity-50"
                >
                  Свернуть
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end justify-between flex-shrink-0">
        <button
          onClick={() => onRemove(item.product_id)}
          disabled={disabled}
          className="p-1 text-gray-400 active:text-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              item.quantity <= 1
                ? onRemove(item.product_id)
                : onUpdate(item.product_id, item.quantity - 1)
            }
            disabled={disabled}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
          >
            <Minus size={14} />
          </button>
          <span className="text-sm font-semibold min-w-[20px] text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdate(item.product_id, item.quantity + 1)}
            disabled={disabled}
            className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
});
