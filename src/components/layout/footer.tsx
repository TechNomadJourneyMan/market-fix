import Link from 'next/link';
import { Instagram, Mail, MessageCircle, Phone } from 'lucide-react';
import type { Category } from '@/types';
import { getTranslator } from '@/i18n/server';
import { LanguageSwitcher } from './language-switcher';
import { Logo } from './logo';

const COLUMNS: { titleKey: string; links: { key: string; href: string }[] }[] = [
  {
    titleKey: 'footer.guests',
    links: [
      { key: 'footer.guests.catalog', href: '/catalog' },
      { key: 'footer.guests.services', href: '/services' },
      { key: 'footer.guests.ai', href: '/ai' },
      { key: 'footer.guests.merge', href: '/merge' },
      { key: 'footer.guests.availableNow', href: '/catalog?availableNow=1' },
      { key: 'footer.guests.bookings', href: '/account/bookings' },
    ],
  },
  {
    titleKey: 'footer.business',
    links: [
      { key: 'footer.business.connect', href: '/business' },
      { key: 'footer.business.analytics', href: '/business/analytics' },
      { key: 'footer.business.bookings', href: '/business/bookings' },
      { key: 'footer.business.reviews', href: '/business/reviews' },
    ],
  },
];

export async function Footer({ categories }: { categories: Category[] }) {
  const t = await getTranslator('navigation');
  const tLayout = await getTranslator('layout');

  return (
    <footer className="mt-20 border-t bg-muted/30">
      <div className="container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t('footer.tagline')}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href="tel:+77000000000"
                className="inline-flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary"
              >
                <Phone className="size-3.5" /> +7 700 000 00 00
              </a>
              <a
                href="mailto:hello@market-fix.kz"
                className="inline-flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary"
              >
                <Mail className="size-3.5" /> hello@market-fix.kz
              </a>
            </div>
            <div className="pt-2">
              <LanguageSwitcher variant="inline" />
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.titleKey} className="min-w-0">
              <p className="mb-3.5 text-sm font-semibold">{t(column.titleKey)}</p>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {tLayout(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="min-w-0">
            <p className="mb-3.5 text-sm font-semibold">{t('footer.categories')}</p>
            <ul className="space-y-2.5">
              {categories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/catalog?category=${category.slug}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {tLayout('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center gap-3">
            <FooterSocial href="https://instagram.com" label="Instagram">
              <Instagram className="size-4" />
            </FooterSocial>
            <FooterSocial href="https://t.me" label="Telegram">
              <MessageCircle className="size-4" />
            </FooterSocial>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterSocial({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-xl border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {children}
    </a>
  );
}
