import Link from 'next/link';
import { Instagram, Mail, MessageCircle, Phone } from 'lucide-react';
import type { Category } from '@/types';
import { Logo } from './logo';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Гостям',
    links: [
      { label: 'Каталог заведений', href: '/catalog' },
      { label: 'AI-подбор места', href: '/ai' },
      { label: 'Акции и спецпредложения', href: '/catalog?promo=1' },
      { label: 'Свободно сейчас', href: '/catalog?availableNow=1' },
      { label: 'Мои бронирования', href: '/account/bookings' },
    ],
  },
  {
    title: 'Бизнесу',
    links: [
      { label: 'Подключить заведение', href: '/business' },
      { label: 'Дашборд и аналитика', href: '/business/analytics' },
      { label: 'Управление бронями', href: '/business/bookings' },
      { label: 'Работа с отзывами', href: '/business/reviews' },
    ],
  },
];

export function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="mt-20 border-t bg-muted/30">
      <div className="container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Находим места в Алматы. Бронирование за 30 секунд, честные отзывы
              и AI-подбор, который понимает повод.
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
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="mb-3.5 text-sm font-semibold">{column.title}</p>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="mb-3.5 text-sm font-semibold">Категории</p>
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
            © {new Date().getFullYear()} Market Fix. Каталог заведений Алматы.
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
