'use client';

import * as React from 'react';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Building2, Loader2, UserRound } from 'lucide-react';
import type { AuthActionState } from '@/app/auth/actions';
import { signInAction, signUpAction } from '@/app/auth/actions';
import type { AccountRole } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialState: AuthActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : null}
      {label}
    </Button>
  );
}

export function AuthForm({
  mode,
  initialRole = 'user',
  next,
}: {
  mode: 'login' | 'register';
  initialRole?: AccountRole;
  next?: string;
}) {
  const action = mode === 'login' ? signInAction : signUpAction;
  const [state, formAction] = useActionState(action, initialState);
  const [role, setRole] = React.useState<AccountRole>(initialRole);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="role" value={role} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div className="grid grid-cols-2 gap-2 rounded-2xl border bg-secondary/40 p-1">
        <RoleButton
          active={role === 'user'}
          onClick={() => setRole('user')}
          icon={UserRound}
          title="Я ищу место"
          hint="B2C"
        />
        <RoleButton
          active={role === 'business'}
          onClick={() => setRole('business')}
          icon={Building2}
          title="Я бизнес"
          hint="B2B"
        />
      </div>

      {mode === 'register' ? (
        <Field label="Имя" htmlFor="name">
          <Input
            id="name"
            name="name"
            required
            autoComplete="name"
            placeholder={role === 'business' ? 'Алишер Ким' : 'Айгерим Смагулова'}
          />
        </Field>
      ) : null}

      {mode === 'register' && role === 'business' ? (
        <Field label="Название бизнеса" htmlFor="businessName">
          <Input
            id="businessName"
            name="businessName"
            required
            placeholder="Ресторан Nuala / Chechil Pub"
          />
        </Field>
      ) : null}

      {mode === 'register' ? (
        <Field label="Телефон" htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+7 700 000 00 00"
          />
        </Field>
      ) : null}

      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@email.kz"
        />
      </Field>

      <Field label="Пароль" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          placeholder="Не меньше 6 символов"
        />
      </Field>

      {state.error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-xl border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
          {state.success}
        </p>
      ) : null}

      <SubmitButton label={mode === 'login' ? 'Войти' : 'Создать аккаунт'} />

      <p className="text-center text-sm text-muted-foreground">
        {mode === 'login' ? (
          <>
            Нет аккаунта?{' '}
            <Link
              href={`/auth/register?role=${role}${next ? `&next=${encodeURIComponent(next)}` : ''}`}
              className="font-medium text-primary hover:underline"
            >
              Зарегистрироваться
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{' '}
            <Link
              href={`/auth/login?role=${role}${next ? `&next=${encodeURIComponent(next)}` : ''}`}
              className="font-medium text-primary hover:underline"
            >
              Войти
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function RoleButton({
  active,
  onClick,
  icon: Icon,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-1 rounded-xl px-3 py-3 text-left transition-all',
        active
          ? 'bg-card text-foreground shadow-soft ring-1 ring-primary/20'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <span className="flex items-center gap-1.5 text-sm font-medium">
        <Icon className="size-4" />
        {title}
      </span>
      <span className="text-[11px] uppercase tracking-wide opacity-70">{hint}</span>
    </button>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
