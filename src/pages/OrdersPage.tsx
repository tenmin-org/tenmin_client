import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, ChevronRight, Clock } from 'lucide-react';
import { cancelOrder, fetchOrders, fetchOrder } from '@/api/orders';
import { Loader } from '@/components/Loader';
import { HeroHeader } from '@/components/HeroHeader';
import { PageHeader } from '@/components/PageHeader';
import { SectionHeading } from '@/components/SectionHeading';
import { EmptyState } from '@/components/EmptyState';
import { formatPrice } from '@/utils/format';
import { orderItemLineSubtotal } from '@/utils/cartPricing';

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
  const { orderId: orderIdParam } = useParams<{ orderId?: string }>();
  const queryClient = useQueryClient();

  const selectedId =
    orderIdParam && !Number.isNaN(Number(orderIdParam)) && Number(orderIdParam) > 0
      ? Number(orderIdParam)
      : null;

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetchOrders(),
  });

  const {
    data: orderDetail,
    isLoading: detailLoading,
    isError: detailError,
  } = useQuery({
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

  if (selectedId && detailError) {
    return (
      <div className="pb-4">
        <PageHeader title="Заказ" onBack={() => navigate('/orders')} />
        <p className="px-page pt-4 text-sm text-gray-600">
          Не удалось загрузить заказ. Возможно, ссылка устарела.
        </p>
      </div>
    );
  }

  if (selectedId && orderDetail) {
    return (
      <div className="pb-4">
        <PageHeader
          title={`Заказ #${orderDetail.id}`}
          subtitle={formatDate(orderDetail.created_at)}
          onBack={() => navigate('/orders')}
        />

        <div className="px-page pt-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <StatusBadge status={orderDetail.status} />
            <span className="font-bold text-right tabular-nums flex-shrink-0">
              {formatPrice(orderDetail.total_price)}
            </span>
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

          <div className="bg-white rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1">Оплата при получении</p>
            <p className="text-sm font-medium text-gray-900">
              {orderDetail.payment_method === 'card' ? 'Карта' : 'Перевод'}
            </p>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-sm font-semibold">Товары</p>
            </div>
            {orderDetail.items.map((item) => {
              const line = orderItemLineSubtotal(item);
              const metaKg =
                item.product?.measure === 'кг' &&
                item.weight_grams != null &&
                item.weight_grams > 0
                  ? `${item.weight_grams} г × ${formatPrice(item.price)}/кг`
                  : `${item.quantity} × ${formatPrice(item.price)}`;
              return (
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
                    <p className="text-xs text-gray-500">{metaKg}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatPrice(line)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <HeroHeader
        icon={<Package strokeWidth={1.75} />}
        title="Мои заказы"
        description="История заказов и статусы доставки"
      />

      <div className="px-page pt-1">
        {isLoading && <Loader />}

        {!isLoading && (!orders || orders.length === 0) && (
          <EmptyState
            icon={<Clock size={48} />}
            title="Нет заказов"
            description="Ваши заказы появятся здесь"
            action={{ label: 'Перейти в каталог', onClick: () => navigate('/') }}
          />
        )}

        {!isLoading && orders && orders.length > 0 && (
          <div className="px-page">
            <SectionHeading>Ваши заказы</SectionHeading>
            <div className="rounded-[14px] bg-gray-100/90 p-2 shadow-inner shadow-gray-200/40">
              <div className="space-y-2">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="cursor-pointer rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04] active:scale-[0.99] transition-transform"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">Заказ #{order.id}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatDate(order.created_at)}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold tabular-nums">
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
        )}
      </div>
    </div>
  );
}
