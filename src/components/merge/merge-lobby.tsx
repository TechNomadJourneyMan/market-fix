'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient, ApiError } from '@/lib/api-client';
import { useT } from '@/i18n/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VoiceInputButton } from '@/components/ui/voice-input';

export function MergeLobby() {
  const router = useRouter();
  const t = useT('merge');
  const [mode, setMode] = React.useState<'create' | 'join'>('create');
  const [name, setName] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [code, setCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const submit = async () => {
    if (name.trim().length < 2) {
      toast.error(t('lobby.errors.name'));
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
      toast.error(error instanceof ApiError ? error.message : t('lobby.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium">
          <Users className="size-3.5 shrink-0 text-primary" />
          {t('lobby.badge')}
        </span>
        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight">
          {t('lobby.title')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('lobby.description')}</p>
      </div>

      <div className="rounded-3xl border bg-card p-5 shadow-soft sm:p-7">
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-secondary/50 p-1">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${mode === 'create' ? 'bg-card shadow-soft' : 'text-muted-foreground'}`}
          >
            {t('lobby.tabCreate')}
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${mode === 'join' ? 'bg-card shadow-soft' : 'text-muted-foreground'}`}
          >
            {t('lobby.tabJoin')}
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('lobby.nameLabel')}</Label>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('lobby.namePlaceholder')}
              />
              <VoiceInputButton onTranscript={setName} />
            </div>
          </div>

          {mode === 'create' ? (
            <div className="space-y-1.5">
              <Label>{t('lobby.topicLabel')}</Label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t('lobby.topicPlaceholder')}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>{t('lobby.codeLabel')}</Label>
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder={t('lobby.codePlaceholder')}
                className="tracking-[0.2em]"
              />
            </div>
          )}

          <Button className="w-full" size="lg" onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {mode === 'create' ? t('lobby.submitCreate') : t('lobby.submitJoin')}
          </Button>
        </div>
      </div>
    </div>
  );
}
