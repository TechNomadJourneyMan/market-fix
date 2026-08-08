'use client';

import { LogOut } from 'lucide-react';
import { signOutAction } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SignOutMenuItem() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className={cn(
          'relative flex w-full cursor-pointer select-none items-center gap-2.5 rounded-xl px-3 py-2 text-sm outline-none transition-colors',
          'text-destructive hover:bg-destructive/10 [&_svg]:size-4 [&_svg]:shrink-0',
        )}
      >
        <LogOut /> Выйти
      </button>
    </form>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="ghost" className={className}>
        <LogOut />
        Выйти
      </Button>
    </form>
  );
}
