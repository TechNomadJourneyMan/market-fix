'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VoiceInputButton } from '@/components/ui/voice-input';

export function MergeLobby() {
  const router = useRouter();
  const [mode, setMode] = React.useState<'create' | 'join'>('create');
  const [name, setName] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [code, setCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const submit = async () => {
    if (name.trim().length < 2) {
      toast.error('Укажите имя');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'create') {
        const data = await apiClient.post<{
          room: { code: string };
          participantId: string;
        }>('/api/merge', { action: 'create', hostName: name, title });
        localStorage.setItem(
          `merge-${data.room.code}`,
          JSON.stringify({ participantId: data.participantId, name }),
        );
        router.push(`/merge/${data.room.code}`);
      } else {
        const data = await apiClient.post<{
          room: { code: string };
          participantId: string;
        }>('/api/merge', {
          action: 'join',
          code: code.trim().toUpperCase(),
          name,
        });
        localStorage.setItem(
          `merge-${data.room.code}`,
          JSON.stringify({ participantId: data.participantId, name }),
        );
        router.push(`/merge/${data.room.code}`);
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium">
          <Users className="size-3.5 text-primary" />
          Merge Menu
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Выберите место вместе с друзьями
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Интерактивный чат: каждый пишет вайб и бюджет, AI собирает shortlist, вы голосуете —
          пока не найдёте матч.
        </p>
      </div>

      <div className="rounded-3xl border bg-card p-5 shadow-soft sm:p-7">
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-secondary/50 p-1">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${mode === 'create' ? 'bg-card shadow-soft' : 'text-muted-foreground'}`}
          >
            Создать комнату
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${mode === 'join' ? 'bg-card shadow-soft' : 'text-muted-foreground'}`}
          >
            Войти по коду
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Ваше имя</Label>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Алишер"
              />
              <VoiceInputButton onTranscript={setName} />
            </div>
          </div>

          {mode === 'create' ? (
            <div className="space-y-1.5">
              <Label>Тема встречи</Label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Пятничный ужин / День рождения"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Код комнаты</Label>
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="ABC123"
                className="tracking-[0.2em]"
              />
            </div>
          )}

          <Button className="w-full" size="lg" onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {mode === 'create' ? 'Создать и пригласить' : 'Присоединиться'}
          </Button>
        </div>
      </div>
    </div>
  );
}
