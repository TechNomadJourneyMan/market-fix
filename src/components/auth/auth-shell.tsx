import Link from 'next/link';
import { Logo } from '@/components/layout/logo';

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-noise opacity-40" />
        <div className="absolute left-1/2 top-0 size-[28rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex justify-center">
            <Logo />
          </Link>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="rounded-3xl border bg-card p-6 shadow-soft sm:p-8">{children}</div>
      </div>
    </div>
  );
}
