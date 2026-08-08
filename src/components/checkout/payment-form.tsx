'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Info, Lock, ShieldCheck } from 'lucide-react';
import type { PaymentMethod, PaymentMethodKind } from '@/types';
import { apiClient, ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

interface PaymentFormProps {
  bookingId: string;
  total: number;
  methods: PaymentMethod[];
}

export function PaymentForm({ bookingId, total, methods }: PaymentFormProps) {
  const router = useRouter();
  const [method, setMethod] = React.useState<PaymentMethodKind>('card');
  const [isPaying, setIsPaying] = React.useState(false);

  const pay = async () => {
    setIsPaying(true);
    try {
      const result = await apiClient.post<{ nextHref: string; notice: string }>(
        '/api/payments',
        { bookingId, method },
      );
      toast.success('Оплата прошла успешно');
      router.push(result.nextHref);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось провести оплату');
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        {methods.map((item) => {
          const isActive = method === item.kind;
          return (
            <button
              key={item.kind}
              type="button"
              disabled={!item.isAvailable}
              onClick={() => setMethod(item.kind)}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all',
                isActive
                  ? 'border-primary bg-primary/[0.04] shadow-glow'
                  : 'hover:border-foreground/20 hover:bg-secondary/50',
                !item.isAvailable && 'cursor-not-allowed opacity-50',
              )}
            >
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl',
                  isActive ? 'brand-gradient text-white' : 'bg-secondary text-muted-foreground',
                )}
              >
                <Icon name={item.icon} className="size-[18px]" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="block text-xs text-muted-foreground">{item.description}</span>
              </span>

              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  isActive ? 'border-primary' : 'border-muted-foreground/30',
                )}
              >
                {isActive ? <span className="size-2.5 rounded-full bg-primary" /> : null}
              </span>
            </button>
          );
        })}
      </div>

      {/* Демо-форма карты: поля отключены, данные не собираются. */}
      {method === 'card' ? (
        <div className="space-y-3 rounded-2xl border bg-muted/30 p-4">
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Lock className="size-3.5" />
            Демонстрационная форма — реальные данные карты не запрашиваются
          </p>
          <div className="grid gap-2.5">
            <div className="h-11 rounded-xl border bg-background/60" />
            <div className="grid grid-cols-2 gap-2.5">
              <div className="h-11 rounded-xl border bg-background/60" />
              <div className="h-11 rounded-xl border bg-background/60" />
            </div>
          </div>
        </div>
      ) : null}

      <Button size="xl" className="w-full" onClick={pay} isLoading={isPaying}>
        {isPaying ? 'Обрабатываем платёж…' : `Оплатить ${formatPrice(total)}`}
      </Button>

      <div className="space-y-2 text-xs text-muted-foreground">
        <p className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" />
          Платёж защищён. Депозит засчитывается в счёт заведения.
        </p>
        <p className="flex items-start gap-2">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Это демо-режим: списание не производится, эквайринг будет подключен позже.
        </p>
      </div>
    </div>
  );
}
