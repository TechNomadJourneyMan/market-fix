import Image from 'next/image';
import { cn } from '@/lib/utils';

/** Логотип Market Fix */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <Image
        src="/market-fix-logo.png"
        alt="Market Fix"
        width={36}
        height={36}
        className="rounded-xl object-contain"
        priority
      />
      {!compact ? (
        <span className="text-[17px] font-semibold tracking-tight">
          Market<span className="text-primary">Fix</span>
        </span>
      ) : null}
    </span>
  );
}
