import type { Metadata } from 'next';
import { MergeLobby } from '@/components/merge/merge-lobby';
import { getTranslator } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator('merge');
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default function MergePage() {
  return (
    <div className="container py-10 sm:py-16">
      <MergeLobby />
    </div>
  );
}
