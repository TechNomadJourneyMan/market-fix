import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileTabBar } from '@/components/layout/mobile-tabbar';
import { themeScript } from '@/components/layout/theme-toggle';
import { BookingDialog } from '@/components/booking/booking-dialog';
import { getCategories } from '@/server/repositories/taxonomy';
import {
  getCurrentUser,
  getFavoriteVenueIds,
  getUnreadNotificationCount,
} from '@/server/repositories/users';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Мезгіл — найти и забронировать место за 30 секунд',
    template: '%s · Мезгіл',
  },
  description:
    'Каталог ресторанов, кафе, баров и банкетных залов Алматы. Живые отзывы, честные цены, мгновенное бронирование и AI-подбор места под ваш повод.',
  keywords: ['рестораны Алматы', 'бронирование стола', 'банкетный зал', 'кафе', 'AI-подбор'],
  openGraph: {
    title: 'Мезгіл — найти и забронировать место за 30 секунд',
    description:
      'Более 30 проверенных заведений, живые отзывы и бронирование в один клик.',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Данные оболочки читаются на сервере — шапка приходит уже заполненной.
  const user = getCurrentUser();
  const categories = getCategories();
  const unreadCount = getUnreadNotificationCount(user.id);
  const favoriteVenueIds = getFavoriteVenueIds(user.id);

  return (
    <html lang="ru" suppressHydrationWarning className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh font-sans">
        <Providers favoriteVenueIds={favoriteVenueIds}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-background focus:px-4 focus:py-2 focus:shadow-lift"
          >
            Перейти к содержимому
          </a>

          <div className="flex min-h-dvh flex-col">
            <Header user={user} unreadCount={unreadCount} />
            <main id="main" className="flex-1 pb-20 lg:pb-0">
              {children}
            </main>
            <Footer categories={categories} />
          </div>

          <MobileTabBar />
          <BookingDialog />
        </Providers>
      </body>
    </html>
  );
}
