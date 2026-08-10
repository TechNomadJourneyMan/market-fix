import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileTabBar } from '@/components/layout/mobile-tabbar';
import { AppChrome } from '@/components/layout/app-chrome';
import { themeScript } from '@/components/layout/theme-toggle';
import { BookingDialog } from '@/components/booking/booking-dialog';
import { CompareBar } from '@/components/compare/compare-bar';
import { getCategories } from '@/server/repositories/taxonomy';
import { getSessionUser } from '@/lib/auth';
import {
  getFavoriteVenueIds,
  getUnreadNotificationCount,
} from '@/server/repositories/users';
import { DEMO_USER_ID } from '@/data/db';
import { getI18nBootstrap, getTranslator } from '@/i18n/server';
import { OG_LOCALES } from '@/i18n/config';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Market Fix — найти и забронировать место за 30 секунд',
    template: '%s · Market Fix',
  },
  description:
    'Платформа поиска, объективной оценки и бронирования заведений Алматы. Объяснимый рейтинг, AI-модерация отзывов и свободные столы.',
  keywords: ['рестораны Алматы', 'бронирование стола', 'рейтинг заведений', 'AI-подбор', 'Market Fix'],
  openGraph: {
    title: 'Market Fix — найти и забронировать место',
    description:
      'Объективный рейтинг, качественные отзывы и бронирование стола в Алматы.',
    type: 'website',
    locale: 'ru_RU',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0f16' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [sessionUser, { locale, dictionary }, t] = await Promise.all([
    getSessionUser(),
    getI18nBootstrap(),
    getTranslator('navigation'),
  ]);
  const categories = getCategories();
  const userId = sessionUser?.id ?? DEMO_USER_ID;
  const unreadCount = sessionUser ? getUnreadNotificationCount(userId) : 0;
  const favoriteVenueIds = sessionUser ? getFavoriteVenueIds(userId) : [];

  return (
    <html lang={locale} suppressHydrationWarning className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <meta property="og:locale" content={OG_LOCALES[locale]} />
      </head>
      <body className="min-h-dvh font-sans">
        <Providers
          favoriteVenueIds={favoriteVenueIds}
          locale={locale}
          dictionary={dictionary}
        >
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-background focus:px-4 focus:py-2 focus:shadow-lift"
          >
            {t('skipToContent')}
          </a>

          <AppChrome
            header={
              <Header
                user={sessionUser}
                isAuthenticated={Boolean(sessionUser)}
                unreadCount={unreadCount}
              />
            }
            footer={<Footer categories={categories.filter((item) => item.venueCount > 0)} />}
          >
            {children}
          </AppChrome>

          <MobileTabBar />
          <CompareBar />
          <BookingDialog />
        </Providers>
      </body>
    </html>
  );
}
