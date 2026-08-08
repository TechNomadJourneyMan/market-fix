import type { Metadata } from 'next';
import { MergeLobby } from '@/components/merge/merge-lobby';

export const metadata: Metadata = {
  title: 'Merge Menu',
  description: 'Выберите ресторан вместе с друзьями — чат, голоса и AI-shortlist.',
};

export default function MergePage() {
  return (
    <div className="container py-10 sm:py-16">
      <MergeLobby />
    </div>
  );
}
