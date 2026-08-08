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
import { getSessionUser } from '@/lib/auth';
import {
  getFavoriteVenueIds,
  getUnreadNotificationCount,
} from '@/server/repositories/users';
import { DEMO_USER_ID } from '@/data/db';

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
    'Каталог ресторанов, кафе, баров Алматы. 50 реальных заведений, живые отзывы, честные цены, мгновенное бронирование и AI-подбор места под ваш повод.',
  keywords: ['рестораны Алматы', 'бронирование стола', 'банкетный зал', 'кафе', 'AI-подбор', 'Market Fix'],
  openGraph: {
    title: 'Market Fix — найти и забронировать место за 30 секунд',
    description:
      'Более 50 реальных заведений Алматы, живые отзывы и бронирование в один клик.',
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
  const sessionUser = await getSessionUser();
  const categories = getCategories();
  const userId = sessionUser?.id ?? DEMO_USER_ID;
  const unreadCount = sessionUser ? getUnreadNotificationCount(userId) : 0;
  const favoriteVenueIds = sessionUser ? getFavoriteVenueIds(userId) : [];

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
            <Header
              user={sessionUser}
              isAuthenticated={Boolean(sessionUser)}
              unreadCount={unreadCount}
            />
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
