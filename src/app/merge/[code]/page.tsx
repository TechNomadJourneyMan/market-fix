import type { Metadata } from 'next';
import { MergeRoomView } from '@/components/merge/merge-room';
import { getCuisines } from '@/server/repositories/taxonomy';

export const metadata: Metadata = {
  title: 'Комната Merge Menu',
};

export default async function MergeRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cuisines = getCuisines();

  return <MergeRoomView code={code.toUpperCase()} cuisines={cuisines} />;
}
