'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Building2,
  CalendarCheck,
  Heart,
  LayoutGrid,
  Menu,
  Search,
  Settings,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import type { User } from '@/types';
import { cn, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/primitives';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SearchBar } from '@/components/search/search-bar';
import { SignOutButton, SignOutMenuItem } from '@/components/auth/sign-out-button';
import { ThemeToggle } from './theme-toggle';
import { Logo } from './logo';

const NAV_LINKS = [
  { href: '/catalog', label: 'Каталог', icon: LayoutGrid },
  { href: '/ai', label: 'AI-подбор', icon: Sparkles, highlight: true },
  { href: '/account/favorites', label: 'Избранное', icon: Heart },
  { href: '/business', label: 'Для бизнеса', icon: Building2 },
];

interface HeaderProps {
  user: User | null;
  isAuthenticated: boolean;
  unreadCount: number;
}

export function Header({ user, isAuthenticated, unreadCount }: HeaderProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isTransparentPage = pathname === '/';
  const isAuthPage = pathname.startsWith('/auth');

  React.useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showInlineSearch = pathname !== '/' && !pathname.startsWith('/catalog') && !isAuthPage;
  const solid = isScrolled || !isTransparentPage;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        solid ? 'glass-strong border-b shadow-soft' : 'bg-transparent',
      )}
    >
      <div className="container flex h-16 items-center gap-3 sm:h-[72px] sm:gap-5">
        <Link href="/" className="shrink-0" aria-label="На главную">
          <Logo />
        </Link>

        {showInlineSearch ? (
          <div className="hidden min-w-0 flex-1 lg:block">
            <SearchBar variant="compact" placeholder="Куда пойдём?" />
          </div>
        ) : (
          <div className="hidden flex-1 lg:block" />
        )}

        {!isAuthPage ? (
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                    link.highlight && !isActive && 'text-primary hover:text-primary',
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {link.highlight ? <Sparkles className="size-3.5" /> : null}
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        ) : null}

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          {!showInlineSearch && !isAuthPage ? (
            <Button asChild variant="ghost" size="icon" className="hidden lg:inline-flex">
              <Link href="/catalog" aria-label="Поиск">
                <Search />
              </Link>
            </Button>
          ) : null}

          <ThemeToggle className="hidden sm:inline-flex" />

          {isAuthenticated && user ? (
            <>
              <Button asChild variant="ghost" size="icon" className="relative hidden sm:inline-flex">
                <Link href="/account/notifications" aria-label="Уведомления">
                  <Bell />
                  {unreadCount > 0 ? (
                    <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                      {unreadCount}
                    </span>
                  ) : null}
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="ml-1 hidden items-center gap-2 rounded-full border bg-background p-1 pr-3 transition-shadow hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
                    aria-label="Меню профиля"
                  >
                    <Avatar className="size-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="max-w-[7rem] truncate text-sm font-medium">
                      {user.name.split(' ')[0]}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="flex items-center gap-3 py-3">
                    <Avatar className="size-10">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {user.name}
                      </span>
                      <span className="block truncate text-xs">{user.email}</span>
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account">
                      <UserIcon /> Профиль
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/bookings">
                      <CalendarCheck /> Мои бронирования
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/favorites">
                      <Heart /> Избранное
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/settings">
                      <Settings /> Настройки
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/business">
                      <Building2 /> Кабинет бизнеса
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <SignOutMenuItem />
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">Войти</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/register">Регистрация</Link>
              </Button>
            </div>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Меню">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[86vw] max-w-xs">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  {isAuthenticated && user ? (
                    <>
                      <Avatar className="size-10">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{user.name}</span>
                        <span className="block truncate text-xs font-normal text-muted-foreground">
                          {user.email}
                        </span>
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-semibold">Market Fix</span>
                  )}
                </SheetTitle>
              </SheetHeader>
              <SheetBody className="space-y-1">
                <MobileLink href="/catalog" icon={LayoutGrid} label="Каталог" onNavigate={() => setMobileOpen(false)} />
                <MobileLink href="/ai" icon={Sparkles} label="AI-подбор" onNavigate={() => setMobileOpen(false)} highlight />

                {isAuthenticated ? (
                  <>
                    <MobileLink href="/account" icon={UserIcon} label="Профиль" onNavigate={() => setMobileOpen(false)} />
                    <MobileLink href="/account/bookings" icon={CalendarCheck} label="Бронирования" onNavigate={() => setMobileOpen(false)} />
                    <MobileLink href="/account/favorites" icon={Heart} label="Избранное" onNavigate={() => setMobileOpen(false)} />
                    <MobileLink
                      href="/account/notifications"
                      icon={Bell}
                      label="Уведомления"
                      badge={unreadCount || undefined}
                      onNavigate={() => setMobileOpen(false)}
                    />
                    <div className="!mt-4 border-t pt-4">
                      <MobileLink href="/business" icon={Building2} label="Кабинет бизнеса" onNavigate={() => setMobileOpen(false)} />
                    </div>
                    <div className="!mt-4">
                      <SignOutButton className="w-full justify-start" />
                    </div>
                  </>
                ) : (
                  <div className="!mt-4 space-y-2 border-t pt-4">
                    <Button asChild className="w-full" onClick={() => setMobileOpen(false)}>
                      <Link href="/auth/register">Создать аккаунт</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full" onClick={() => setMobileOpen(false)}>
                      <Link href="/auth/login">Войти</Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full" onClick={() => setMobileOpen(false)}>
                      <Link href="/auth/register?role=business">Подключить бизнес</Link>
                    </Button>
                  </div>
                )}

                <div className="!mt-4 flex items-center justify-between rounded-xl border p-3">
                  <span className="text-sm text-muted-foreground">Тема оформления</span>
                  <ThemeToggle />
                </div>
              </SheetBody>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function MobileLink({
  href,
  icon: LinkIcon,
  label,
  badge,
  highlight,
  onNavigate,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  highlight?: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-secondary',
        highlight && 'text-primary',
      )}
    >
      <LinkIcon className="size-[18px]" />
      <span className="flex-1">{label}</span>
      {badge ? <Badge variant="destructive">{badge}</Badge> : null}
    </Link>
  );
}
