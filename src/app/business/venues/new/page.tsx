import type { Metadata } from 'next';
import { AddVenueForm } from '@/components/business/add-venue-form';
import { getCategories, getCuisines } from '@/server/repositories/taxonomy';
import { DISTRICTS } from '@/data/seed/geo';
import { getTranslator } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator('business');
  return { title: t('newVenue.metaTitle') };
}

export default async function NewVenuePage() {
  const t = await getTranslator('business');
  const categories = getCategories();
  const cuisines = getCuisines();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">{t('newVenue.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('newVenue.description')}</p>
      </header>

      <div className="rounded-3xl border bg-card p-5 sm:p-7">
        <AddVenueForm categories={categories} cuisines={cuisines} districts={DISTRICTS} />
      </div>
    </div>
  );
}
