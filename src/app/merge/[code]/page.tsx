import type { Metadata } from 'next';
import { MergeRoomView } from '@/components/merge/merge-room';
import { getCuisines } from '@/server/repositories/taxonomy';
import { getTranslator } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator('merge');
  return { title: t('meta.roomTitle') };
}

export default async function MergeRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cuisines = getCuisines();

  return <MergeRoomView code={code.toUpperCase()} cuisines={cuisines} />;
}
