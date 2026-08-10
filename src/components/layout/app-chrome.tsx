'use client';

import { usePathname } from 'next/navigation';

/** Hides consumer chrome on admin / auth-focused ops surfaces. */
export function AppChrome({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');

  if (isAdmin) {
    return <div className="flex min-h-dvh flex-col">{children}</div>;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {header}
      <main id="main" className="flex-1 pb-20 lg:pb-0">
        {children}
      </main>
      {footer}
    </div>
  );
}
