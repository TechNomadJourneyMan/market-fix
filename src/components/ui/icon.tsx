import * as React from 'react';
import * as Lucide from 'lucide-react';
import type { LucideProps } from 'lucide-react';

/**
 * Резолвер иконок по имени из данных (Category.icon, Service.icon…).
 * Позволяет хранить иконки строкой — как это будет в БД.
 */
export function Icon({
  name,
  fallback = 'Circle',
  ...props
}: { name: string; fallback?: string } & LucideProps) {
  const registry = Lucide as unknown as Record<string, React.ComponentType<LucideProps>>;
  const Component = registry[name] ?? registry[fallback] ?? Lucide.Circle;
  return <Component {...props} />;
}
