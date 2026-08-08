'use client';

import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function ShareButton({
  title,
  slug,
  className,
}: {
  title: string;
  slug: string;
  className?: string;
}) {
  const share = async () => {
    const url = `${window.location.origin}/venue/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `Смотри «${title}» на Market Fix`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Ссылка скопирована');
    } catch {
      /* user cancelled share */
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={share} className={className}>
      <Share2 className="size-4" />
      Поделиться
    </Button>
  );
}
