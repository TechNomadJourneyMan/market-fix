import Link from 'next/link';
import { Compass, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <Compass className="size-7" />
      </span>

      <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
        Такой страницы нет
      </h1>
      <p className="mt-2 text-pretty text-sm text-muted-foreground">
        Возможно, заведение сняли с публикации или ссылка устарела. Но в городе ещё три
        десятка мест, куда стоит сходить.
      </p>

      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/catalog">
            <Search />
            Открыть каталог
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">
            <Home />
            На главную
          </Link>
        </Button>
      </div>
    </div>
  );
}
