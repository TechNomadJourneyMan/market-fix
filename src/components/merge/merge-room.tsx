'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Check,
  Copy,
  Loader2,
  Send,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Cuisine, MergePreferences, MergeRoom, VenueListItem, Vibe } from '@/types';
import { apiClient, ApiError } from '@/lib/api-client';
import { formatPriceI18n, formatRatingI18n } from '@/i18n/format';
import { useLocale, useT } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VoiceInputButton } from '@/components/ui/voice-input';
import { useBookingStore, venueToBookingTarget } from '@/store/use-booking-store';

const VIBES: Vibe[] = ['cozy', 'lively', 'quiet', 'premium', 'trendy', 'casual'];

const BUDGETS = [5000, 10000, 15000, 25000];

type RoomPayload = {
  room: MergeRoom;
  shortlist: VenueListItem[];
  shareUrl: string;
};

export function MergeRoomView({
  code,
  cuisines,
}: {
  code: string;
  cuisines: Cuisine[];
}) {
  const openBooking = useBookingStore((state) => state.open);
  const t = useT('merge');
  const locale = useLocale();
  const [data, setData] = React.useState<RoomPayload | null>(null);
  const [participantId, setParticipantId] = React.useState<string | null>(null);
  const [chat, setChat] = React.useState('');
  const [prefs, setPrefs] = React.useState<MergePreferences>({
    cuisineIds: [],
    vibes: [],
    budgetPerPerson: 10000,
    guests: 4,
  });
  const [busy, setBusy] = React.useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const load = React.useCallback(async () => {
    const next = await apiClient.get<RoomPayload>(`/api/merge/${code}`);
    setData(next);
  }, [code]);

  React.useEffect(() => {
    const saved = localStorage.getItem(`merge-${code}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { participantId: string };
        setParticipantId(parsed.participantId);
      } catch {
        /* ignore */
      }
    }
    load().catch(() => toast.error(t('room.notFound')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, load]);

  React.useEffect(() => {
    const timer = setInterval(() => {
      load().catch(() => undefined);
    }, 4000);
    return () => clearInterval(timer);
  }, [load]);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.room.messages.length]);

  const post = async (body: Record<string, unknown>) => {
    if (!participantId) {
      toast.error(t('room.joinFirst'));
      return;
    }
    setBusy(true);
    try {
      const next = await apiClient.post<RoomPayload>(`/api/merge/${code}`, {
        ...body,
        participantId,
      });
      setData(next);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('room.error'));
    } finally {
      setBusy(false);
    }
  };

  const applyPrefs = () => post({ action: 'preferences', preferences: prefs });

  const sendChat = () => {
    if (!chat.trim()) return;
    const text = chat.trim();
    setChat('');
    void post({ action: 'chat', text });
  };

  const voteCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    data?.room.votes.forEach((vote) => {
      map.set(vote.venueId, (map.get(vote.venueId) ?? 0) + 1);
    });
    return map;
  }, [data?.room.votes]);

  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const { room, shortlist, shareUrl } = data;
  const matched = shortlist.find((item) => item.id === room.matchedVenueId);

  return (
    <div className="container py-6 sm:py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Merge Menu · {room.code}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{room.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('room.participants', { count: room.participants.length })}
            {' · '}
            {t('room.statusLabel')}:{' '}
            {room.status === 'matched' ? t('room.statusMatched') : t('room.statusChoosing')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(shareUrl);
              toast.success(t('room.linkCopied'));
            }}
          >
            <Copy className="size-4 shrink-0" />
            {t('room.invite')}
          </Button>
          {matched ? (
            <Button
              size="sm"
              onClick={() => openBooking(venueToBookingTarget(matched))}
            >
              {t('room.bookMatch')}
            </Button>
          ) : null}
        </div>
      </header>

      {matched ? (
        <div className="mb-6 rounded-2xl border border-success/30 bg-success/5 p-4">
          <p className="text-sm font-semibold text-success">
            {t('room.matchTitle', { name: matched.name })}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{matched.tagline}</p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr_0.9fr]">
        {/* Preferences */}
        <section className="space-y-4 rounded-3xl border bg-card p-4 sm:p-5">
          <h2 className="text-sm font-semibold">{t('room.preferencesTitle')}</h2>
          <div>
            <p className="mb-2 text-xs text-muted-foreground">{t('room.cuisine')}</p>
            <div className="flex flex-wrap gap-1.5">
              {cuisines.slice(0, 10).map((cuisine) => {
                const active = prefs.cuisineIds.includes(cuisine.id);
                return (
                  <button
                    key={cuisine.id}
                    type="button"
                    onClick={() =>
                      setPrefs((current) => ({
                        ...current,
                        cuisineIds: active
                          ? current.cuisineIds.filter((id) => id !== cuisine.id)
                          : [...current.cuisineIds, cuisine.id],
                      }))
                    }
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs',
                      active ? 'border-primary bg-primary/10 text-primary' : '',
                    )}
                  >
                    {cuisine.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-muted-foreground">{t('room.vibe')}</p>
            <div className="flex flex-wrap gap-1.5">
              {VIBES.map((vibe) => {
                const active = prefs.vibes.includes(vibe);
                return (
                  <button
                    key={vibe}
                    type="button"
                    onClick={() =>
                      setPrefs((current) => ({
                        ...current,
                        vibes: active
                          ? current.vibes.filter((item) => item !== vibe)
                          : [...current.vibes, vibe],
                      }))
                    }
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs',
                      active ? 'border-primary bg-primary/10 text-primary' : '',
                    )}
                  >
                    {t(`vibes.${vibe}`)}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-muted-foreground">{t('room.budget')}</p>
            <div className="flex flex-wrap gap-1.5">
              {BUDGETS.map((budget) => (
                <button
                  key={budget}
                  type="button"
                  onClick={() => setPrefs((current) => ({ ...current, budgetPerPerson: budget }))}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs',
                    prefs.budgetPerPerson === budget
                      ? 'border-primary bg-primary/10 text-primary'
                      : '',
                  )}
                >
                  {t('room.budgetUpTo', { price: formatPriceI18n(budget, locale) })}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">{t('room.freeText')}</p>
            <div className="flex gap-2">
              <Input
                value={prefs.freeText ?? ''}
                onChange={(event) =>
                  setPrefs((current) => ({ ...current, freeText: event.target.value }))
                }
                placeholder={t('room.freeTextPlaceholder')}
              />
              <VoiceInputButton
                currentValue={prefs.freeText ?? ''}
                onInterimTranscript={(text) =>
                  setPrefs((current) => ({ ...current, freeText: text }))
                }
                onTranscript={(text) =>
                  setPrefs((current) => ({ ...current, freeText: text }))
                }
              />
            </div>
          </div>
          <Button className="w-full" onClick={applyPrefs} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
            <span className="min-w-0 whitespace-normal">{t('room.refresh')}</span>
          </Button>

          <div className="border-t pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t('room.inRoom')}</p>
            <ul className="space-y-2">
              {room.participants.map((person) => (
                <li key={person.id} className="flex items-center gap-2 text-sm">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: person.color }}
                  />
                  {person.name}
                  {person.isHost ? (
                    <span className="text-[10px] text-muted-foreground">{t('room.host')}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Chat */}
        <section className="flex min-h-[480px] flex-col rounded-3xl border bg-card">
          <div className="border-b px-4 py-3 text-sm font-semibold">{t('room.chatTitle')}</div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {room.messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'max-w-[92%] rounded-2xl px-3 py-2 text-sm',
                  message.kind === 'system' || message.kind === 'suggestion' || message.kind === 'match'
                    ? 'bg-secondary/70 text-muted-foreground'
                    : message.kind === 'vote'
                      ? 'bg-primary/10 text-foreground'
                      : 'bg-background border',
                )}
              >
                <p className="text-[11px] font-medium opacity-70">{message.authorName}</p>
                <p className="mt-0.5">{message.text}</p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2 border-t p-3">
            <Input
              value={chat}
              onChange={(event) => setChat(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') sendChat();
              }}
              placeholder={t('room.chatPlaceholder')}
            />
            <VoiceInputButton
              currentValue={chat}
              onInterimTranscript={setChat}
              onTranscript={setChat}
            />
            <Button size="icon" onClick={sendChat} disabled={busy} aria-label={t('room.sendAria')}>
              <Send className="size-4" />
            </Button>
          </div>
        </section>

        {/* Shortlist */}
        <section className="space-y-3 rounded-3xl border bg-card p-4 sm:p-5">
          <h2 className="text-sm font-semibold">{t('room.shortlistTitle')}</h2>
          {shortlist.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('room.shortlistEmpty')}</p>
          ) : (
            shortlist.map((venue) => {
              const votes = voteCounts.get(venue.id) ?? 0;
              const isMatch = room.matchedVenueId === venue.id;
              return (
                <article
                  key={venue.id}
                  className={cn(
                    'overflow-hidden rounded-2xl border',
                    isMatch && 'border-success ring-1 ring-success/30',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={venue.coverImage}
                    alt={venue.name}
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <div className="space-y-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/venue/${venue.slug}`}
                          className="text-sm font-semibold hover:text-primary"
                        >
                          {venue.name}
                        </Link>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {venue.tagline}
                        </p>
                      </div>
                      {isMatch ? <Check className="size-4 text-success" /> : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatRatingI18n(venue.rating.score, locale)} ·{' '}
                      {t('common:labels.from')} {formatPriceI18n(venue.averagePrice, locale)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => post({ action: 'vote', venueId: venue.id })}
                        disabled={busy}
                        aria-label={t('room.voteAria', { name: venue.name })}
                      >
                        <ThumbsUp className="size-3.5 shrink-0" />
                        {votes}
                      </Button>
                      <Button
                        size="sm"
                        className="min-w-0 flex-1"
                        onClick={() => openBooking(venueToBookingTarget(venue))}
                      >
                        <span className="truncate">{t('room.book')}</span>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
