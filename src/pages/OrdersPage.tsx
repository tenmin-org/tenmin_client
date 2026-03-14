import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Package, ChevronRight, Clock } from 'lucide-react';
import { cancelOrder, fetchOrders, fetchOrder } from '@/api/orders';
import { Loader } from '@/components/Loader';
import { EmptyState } from '@/components/EmptyState';
import { formatPrice } from '@/utils/format';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Ожидает', color: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: 'Принят', color: 'bg-blue-100 text-blue-700' },
  delivering: { label: 'Доставляется', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Доставлен', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Отменен', color: 'bg-red-100 text-red-700' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: string }) {
  const info = STATUS_MAP[status] ?? {
    label: status,
    color: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${info.color}`}>
      {info.label}
    </span>
  );
}

function canCancelOrder(status: string) {
  return status !== 'delivered' && status !== 'cancelled';
}

export function OrdersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetchOrders(),
  });

  const { data: orderDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['order', selectedId],
    queryFn: () => fetchOrder(selectedId!),
    enabled: !!selectedId,
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: number) => cancelOrder(orderId),
    onSuccess: async (_, orderId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['order', orderId] }),
      ]);
    },
  });

  if (selectedId && detailLoading) {
    return <Loader />;
  }

  if (selectedId && orderDetail) {
    return (
      <div className="pb-4">
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setSelectedId(null)}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-semibold text-base">Заказ #{orderDetail.id}</h1>
              <p className="text-xs text-gray-500">
                {formatDate(orderDetail.created_at)}
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <StatusBadge status={orderDetail.status} />
            <span className="font-bold">{formatPrice(orderDetail.total_price)}</span>
          </div>

          {canCancelOrder(orderDetail.status) && (
            <button
              onClick={() => cancelMutation.mutate(orderDetail.id)}
              disabled={cancelMutation.isPending}
              className="w-full rounded-2xl bg-red-50 text-red-600 py-3 text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cancelMutation.isPending ? 'Отмена...' : 'Отменить заказ'}
            </button>
          )}

          {orderDetail.comment && (
            <div className="bg-white rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-1">Комментарий</p>
              <p className="text-sm">{orderDetail.comment}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-sm font-semibold">Товары</p>
            </div>
            {orderDetail.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.product?.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="text-gray-400" size={16} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.product?.name ?? `Товар #${item.product_id}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.quantity} × {formatPrice(item.price)}
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <h1 className="font-semibold text-base">Мои заказы</h1>
        </div>
      </div>

      <div className="px-4 pt-4">
        {isLoading && <Loader />}

        {!isLoading && (!orders || orders.length === 0) && (
          <EmptyState
            icon={<Clock size={48} />}
            title="Нет заказов"
            description="Ваши заказы появятся здесь"
            action={{ label: 'Перейти в каталог', onClick: () => navigate('/') }}
          />
        )}

        <div className="space-y-3">
          {orders?.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedId(order.id)}
              className="bg-white rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">Заказ #{order.id}</span>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {formatDate(order.created_at)}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold">
                    {formatPrice(order.total_price)}
                  </span>
                  <ChevronRight className="text-gray-400" size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
