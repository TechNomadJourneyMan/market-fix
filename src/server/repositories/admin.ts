import type {
  Booking,
  CreateReviewInput,
  EditorialRatingOverride,
  ModerationCase,
  ModerationLevel,
  RatingSnapshot,
  Review,
  User,
  Venue,
} from '@/types';
import { db } from '@/data/db';
import { createId } from '@/lib/utils';
import { moderateReview, isReviewPubliclyVisible } from '@/server/ai/moderate';
import { computeVenueRating, tenToStars } from '@/server/ai/rating';
import { getAdminStore } from '@/server/admin/store';
import { searchAuditLogs, writeAuditLog } from '@/server/admin/audit';
import { DEMO_TODAY } from '@/data/builders/bookings';
import { toDateKey } from '@/lib/format';

const globalForBootstrap = globalThis as unknown as {
  __marketFixAdminBootstrapped?: boolean;
};

function ensureReviewEngineFields(review: Review) {
  if (!review.source) review.source = 'market_fix';
  if (!review.language) review.language = 'ru';
  if (!review.provenance) {
    review.provenance = {
      source: 'market_fix',
      fetchMethod: 'platform',
      fetchedAt: review.createdAt,
      canDisplay: true,
      canScore: true,
      originalText: review.text,
    };
  }
  if (review.isPublished === undefined) review.isPublished = true;
}

/** Run once per process: moderate seed reviews + compute rating snapshots. */
export function bootstrapAdminEngine() {
  if (globalForBootstrap.__marketFixAdminBootstrapped) return;
  globalForBootstrap.__marketFixAdminBootstrapped = true;

  const store = getAdminStore();
  const textsByVenue = new Map<string, string[]>();

  for (const review of db.reviews) {
    ensureReviewEngineFields(review);
    const existing = textsByVenue.get(review.venueId) ?? [];
    const analysis = moderateReview(review, existing);
    existing.push(`${review.title} ${review.text}`);
    textsByVenue.set(review.venueId, existing);

    review.analysis = analysis;
    review.moderationStatus = analysis.moderationLevel;
    review.isPublished = isReviewPubliclyVisible(analysis.moderationLevel);
    store.analyses.set(review.id, analysis);

    if (
      analysis.moderationLevel === 'needs_human_review' ||
      analysis.moderationLevel === 'fraud_suspected' ||
      analysis.moderationLevel === 'temporarily_hidden'
    ) {
      store.moderationCases.push({
        id: createId('modcase'),
        reviewId: review.id,
        venueId: review.venueId,
        status: 'open',
        aiLevel: analysis.moderationLevel,
        finalLevel: analysis.moderationLevel,
        decisionSource: 'ai',
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
      });
    }
  }

  // Inject a few deterministic edge-case reviews for moderation demos.
  injectDemoModerationSamples();

  for (const venue of db.venues) {
    recalculateVenueRating(venue.id);
    // Align public rating.count with actual review objects used for scoring.
    const publishedCount = db.reviews.filter(
      (review) => review.venueId === venue.id && review.isPublished !== false,
    ).length;
    venue.rating.count = publishedCount;
  }
}

function injectDemoModerationSamples() {
  const venue = db.venues[0];
  if (!venue) return;
  if (db.reviews.some((review) => review.id.startsWith('review-mod-demo'))) return;

  const now = new Date().toISOString();
  const samples: Review[] = [
    {
      id: 'review-mod-demo-water',
      venueId: venue.id,
      author: {
        id: 'user-mod-1',
        name: 'Данияр О.',
        avatar: '/api/avatar/daniyar/80',
        reviewsCount: 3,
        isVerified: true,
      },
      rating: 1,
      ratings: { food: 3, service: 1, atmosphere: 3, price: 3 },
      title: 'Не принесли воду',
      text: 'Не принесли воду, поэтому 1 звезда. Еда была нормальной, но сервис подвёл.',
      photos: [],
      likes: 2,
      occasion: 'friends',
      source: 'market_fix',
      language: 'ru',
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'review-mod-demo-hearsay',
      venueId: venue.id,
      author: {
        id: 'user-mod-2',
        name: 'Аноним',
        avatar: '/api/avatar/anon/80',
        reviewsCount: 1,
        isVerified: false,
      },
      rating: 1,
      ratings: { food: 1, service: 1, atmosphere: 1, price: 1 },
      title: 'Ужасное место',
      text: 'Ужасное место, потому что все вокруг говорят, что это плохой ресторан.',
      photos: [],
      likes: 0,
      source: 'market_fix',
      language: 'ru',
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'review-mod-demo-spam',
      venueId: venue.id,
      author: {
        id: 'user-mod-3',
        name: 'Promo Bot',
        avatar: '/api/avatar/promo/80',
        reviewsCount: 0,
        isVerified: false,
      },
      rating: 5,
      ratings: { food: 5, service: 5, atmosphere: 5, price: 5 },
      title: 'Скидка',
      text: 'Заработок онлайн https://spam.example промокод WHATSAPP',
      photos: [],
      likes: 0,
      source: 'import',
      language: 'ru',
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const sample of samples) {
    ensureReviewEngineFields(sample);
    const analysis = moderateReview(sample);
    sample.analysis = analysis;
    sample.moderationStatus = analysis.moderationLevel;
    sample.isPublished = isReviewPubliclyVisible(analysis.moderationLevel);
    db.reviews.unshift(sample);
    getAdminStore().analyses.set(sample.id, analysis);
    getAdminStore().moderationCases.unshift({
      id: createId('modcase'),
      reviewId: sample.id,
      venueId: sample.venueId,
      status: 'open',
      aiLevel: analysis.moderationLevel,
      finalLevel: analysis.moderationLevel,
      decisionSource: 'ai',
      createdAt: now,
      updatedAt: now,
    });
  }
}

export function recalculateVenueRating(venueId: string, actor?: User, reason?: string) {
  bootstrapAdminEngine();
  const venue = db.venues.find((item) => item.id === venueId);
  if (!venue) return null;
  const store = getAdminStore();
  const override = store.editorialOverrides.get(venueId) ?? null;
  const venueBookings = db.bookings.filter((booking) => booking.venueId === venueId);
  const snapshot = computeVenueRating({
    venue,
    reviews: db.reviews.filter((review) => review.venueId === venueId),
    allVenues: db.venues,
    bookingStats: {
      completed: venueBookings.filter((item) => item.status === 'completed' || item.status === 'confirmed').length,
      cancelled: venueBookings.filter((item) => item.status === 'cancelled').length,
      noShow: venueBookings.filter((item) => item.status === 'no_show').length,
    },
    override,
  });

  store.ratingSnapshots.set(venueId, snapshot);
  store.ratingHistory.unshift(snapshot);

  venue.rating.score = tenToStars(snapshot.layers.finalScore);
  venue.rating.count = snapshot.reviewCountUsed;
  venue.rating.breakdown = {
    food: tenToStars(snapshot.factors.find((f) => f.key === 'food')?.score ?? 0),
    service: tenToStars(snapshot.factors.find((f) => f.key === 'service')?.score ?? 0),
    atmosphere: tenToStars(snapshot.factors.find((f) => f.key === 'atmosphere')?.score ?? 0),
    price: tenToStars(snapshot.factors.find((f) => f.key === 'value')?.score ?? 0),
  };

  if (actor) {
    writeAuditLog({
      actor,
      action: 'rating.recalculate',
      objectType: 'venue',
      objectId: venue.id,
      objectLabel: venue.name,
      after: snapshot.layers,
      reason,
      source: 'system',
    });
  }

  return snapshot;
}

export function getAdminDashboard() {
  bootstrapAdminEngine();
  const store = getAdminStore();
  const today = toDateKey(DEMO_TODAY);
  const bookingsToday = db.bookings.filter((booking) => booking.date === today);
  const cancelledToday = bookingsToday.filter((booking) => booking.status === 'cancelled');
  const openCases = store.moderationCases.filter((item) => item.status === 'open');
  const pendingVenues = db.venues.filter(
    (venue) => venue.status === 'pending_review' || venue.status === 'draft',
  );

  const ratingDrops = db.venues
    .map((venue) => {
      const snap = store.ratingSnapshots.get(venue.id);
      return {
        venue,
        final: snap?.layers.finalScore ?? tenToStars(venue.rating.score) * 2,
        previous: store.ratingHistory.find(
          (item) => item.venueId === venue.id && item.id !== snap?.id,
        )?.layers.finalScore,
      };
    })
    .filter((item) => item.previous !== undefined && (item.previous as number) - item.final >= 0.5)
    .slice(0, 8);

  return {
    needsAttention: [
      {
        id: 'moderation',
        label: `${openCases.length} отзывов ожидают ручной модерации`,
        count: openCases.length,
        href: '/admin/reviews?status=open',
        severity: openCases.length > 0 ? 'high' : 'low',
      },
      {
        id: 'venues-pending',
        label: `${pendingVenues.length} заведений ждут проверки`,
        count: pendingVenues.length,
        href: '/admin/venues?status=pending_review',
        severity: pendingVenues.length > 0 ? 'medium' : 'low',
      },
      {
        id: 'cancels',
        label: `${cancelledToday.length} отмен бронирований сегодня`,
        count: cancelledToday.length,
        href: '/admin/bookings?status=cancelled',
        severity: cancelledToday.length > 3 ? 'high' : 'medium',
      },
      {
        id: 'rating-drops',
        label: `${ratingDrops.length} заведений со снижением рейтинга`,
        count: ratingDrops.length,
        href: '/admin/ratings',
        severity: ratingDrops.length > 0 ? 'medium' : 'low',
      },
    ],
    now: {
      bookingsToday: bookingsToday.length,
      users: db.users.length,
      reviewsTotal: db.reviews.length,
      openModeration: openCases.length,
      publishedVenues: db.venues.filter((venue) => venue.status === 'published').length,
      cancelRate:
        bookingsToday.length > 0
          ? Number(((cancelledToday.length / bookingsToday.length) * 100).toFixed(1))
          : 0,
    },
    funnel: [
      { stage: 'Search', value: 1000 },
      { stage: 'Venue View', value: 620 },
      { stage: 'Compare', value: 180 },
      { stage: 'Booking Start', value: 240 },
      { stage: 'Booking Completed', value: 150 },
      { stage: 'Visit', value: 120 },
      { stage: 'Review', value: 48 },
    ],
    recentAudit: searchAuditLogs({ limit: 8 }),
  };
}

export function listAdminVenues(filters?: { status?: Venue['status']; q?: string }) {
  bootstrapAdminEngine();
  let items = [...db.venues];
  if (filters?.status) items = items.filter((venue) => venue.status === filters.status);
  if (filters?.q) {
    const needle = filters.q.toLowerCase();
    items = items.filter(
      (venue) =>
        venue.name.toLowerCase().includes(needle) ||
        venue.slug.toLowerCase().includes(needle) ||
        venue.location.address.toLowerCase().includes(needle),
    );
  }
  return items.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

export function updateVenueStatus(
  venueId: string,
  status: Venue['status'],
  actor: User,
  reason?: string,
) {
  bootstrapAdminEngine();
  const venue = db.venues.find((item) => item.id === venueId);
  if (!venue) return null;
  const before = venue.status;
  venue.status = status;
  venue.updatedAt = new Date().toISOString();
  if (status === 'verified' || status === 'published') venue.isVerified = true;
  writeAuditLog({
    actor,
    action: status === 'published' ? 'venue.publish' : status === 'suspended' ? 'venue.suspend' : 'venue.status_change',
    objectType: 'venue',
    objectId: venue.id,
    objectLabel: venue.name,
    before: { status: before },
    after: { status },
    reason,
  });
  return venue;
}

export function updateVenue(
  venueId: string,
  patch: Partial<Pick<Venue, 'name' | 'tagline' | 'description' | 'phone' | 'email' | 'averagePrice' | 'capacity' | 'isFeatured'>>,
  actor: User,
) {
  bootstrapAdminEngine();
  const venue = db.venues.find((item) => item.id === venueId);
  if (!venue) return null;
  const before = { ...patch };
  Object.assign(venue, patch, { updatedAt: new Date().toISOString() });
  writeAuditLog({
    actor,
    action: 'venue.update',
    objectType: 'venue',
    objectId: venue.id,
    objectLabel: venue.name,
    before,
    after: patch,
  });
  return venue;
}

export function listAdminBookings(filters?: { status?: Booking['status']; q?: string }) {
  bootstrapAdminEngine();
  let items = [...db.bookings];
  if (filters?.status) items = items.filter((booking) => booking.status === filters.status);
  if (filters?.q) {
    const needle = filters.q.toLowerCase();
    items = items.filter(
      (booking) =>
        booking.reference.toLowerCase().includes(needle) ||
        booking.venueName.toLowerCase().includes(needle) ||
        booking.guest.name.toLowerCase().includes(needle) ||
        booking.guest.phone.includes(needle),
    );
  }
  return items.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function adminUpdateBookingStatus(
  bookingId: string,
  status: Booking['status'],
  actor: User,
  reason?: string,
) {
  bootstrapAdminEngine();
  const booking = db.bookings.find((item) => item.id === bookingId);
  if (!booking) return null;
  const before = booking.status;
  booking.status = status;
  booking.updatedAt = new Date().toISOString();
  if (status === 'cancelled') {
    booking.cancelledAt = booking.updatedAt;
    booking.cancellationReason = reason ?? 'Отменено администратором';
  }
  writeAuditLog({
    actor,
    action: status === 'cancelled' ? 'booking.cancel' : 'booking.status_change',
    objectType: 'booking',
    objectId: booking.id,
    objectLabel: booking.reference,
    before: { status: before },
    after: { status },
    reason,
  });
  recalculateVenueRating(booking.venueId);
  return booking;
}

export function listModerationQueue(filters?: { status?: ModerationCase['status']; level?: ModerationLevel }) {
  bootstrapAdminEngine();
  const store = getAdminStore();
  let cases = [...store.moderationCases];
  if (filters?.status) cases = cases.filter((item) => item.status === filters.status);
  if (filters?.level) cases = cases.filter((item) => item.finalLevel === filters.level);

  return cases.map((item) => {
    const review = db.reviews.find((entry) => entry.id === item.reviewId);
    const venue = db.venues.find((entry) => entry.id === item.venueId);
    return { case: item, review, venue };
  });
}

export function overrideModerationDecision(input: {
  caseId: string;
  level: ModerationLevel;
  reason: string;
  actor: User;
}) {
  bootstrapAdminEngine();
  const store = getAdminStore();
  const modCase = store.moderationCases.find((item) => item.id === input.caseId);
  if (!modCase) return null;
  const review = db.reviews.find((item) => item.id === modCase.reviewId);
  if (!review) return null;

  const before = modCase.finalLevel;
  modCase.finalLevel = input.level;
  modCase.decisionSource = 'human';
  modCase.overrideReason = input.reason;
  modCase.resolvedBy = input.actor.id;
  modCase.resolvedAt = new Date().toISOString();
  modCase.status = 'resolved';
  modCase.updatedAt = modCase.resolvedAt;

  review.moderationStatus = input.level;
  review.isPublished = isReviewPubliclyVisible(input.level);
  review.updatedAt = modCase.resolvedAt;

  writeAuditLog({
    actor: input.actor,
    action: 'review.override_ai',
    objectType: 'review',
    objectId: review.id,
    objectLabel: review.title,
    before: { level: before },
    after: { level: input.level },
    reason: input.reason,
    source: 'manual',
  });

  recalculateVenueRating(review.venueId, input.actor, 'После override модерации');
  return { case: modCase, review };
}

export function listAdminRatings() {
  bootstrapAdminEngine();
  return db.venues
    .map((venue) => ({
      venue,
      snapshot: getAdminStore().ratingSnapshots.get(venue.id) ?? recalculateVenueRating(venue.id),
    }))
    .sort(
      (a, b) =>
        (b.snapshot?.layers.finalScore ?? 0) - (a.snapshot?.layers.finalScore ?? 0),
    );
}

export function getVenueRatingSnapshot(venueId: string): RatingSnapshot | null {
  bootstrapAdminEngine();
  return getAdminStore().ratingSnapshots.get(venueId) ?? recalculateVenueRating(venueId);
}

export function setEditorialOverride(input: {
  venueId: string;
  delta: number;
  reason: string;
  actor: User;
}) {
  bootstrapAdminEngine();
  const override: EditorialRatingOverride = {
    venueId: input.venueId,
    delta: input.delta,
    reason: input.reason,
    createdBy: input.actor.id,
    createdAt: new Date().toISOString(),
  };
  getAdminStore().editorialOverrides.set(input.venueId, override);
  writeAuditLog({
    actor: input.actor,
    action: 'rating.override',
    objectType: 'venue',
    objectId: input.venueId,
    after: override,
    reason: input.reason,
  });
  return recalculateVenueRating(input.venueId, input.actor, input.reason);
}

export function listAdminUsers() {
  bootstrapAdminEngine();
  const store = getAdminStore();
  return db.users.map((user) => ({
    user,
    trustScore: store.userTrustScores.get(user.id) ?? 50,
    isBlocked: store.blockedUserIds.has(user.id),
    bookings: db.bookings.filter((booking) => booking.userId === user.id).length,
    reviews: db.reviews.filter((review) => review.author.id === user.id).length,
  }));
}

export function setUserBlocked(userId: string, blocked: boolean, actor: User, reason?: string) {
  bootstrapAdminEngine();
  const store = getAdminStore();
  const user = db.users.find((item) => item.id === userId);
  if (!user) return null;
  if (blocked) store.blockedUserIds.add(userId);
  else store.blockedUserIds.delete(userId);
  writeAuditLog({
    actor,
    action: blocked ? 'user.block' : 'user.unblock',
    objectType: 'user',
    objectId: userId,
    objectLabel: user.name,
    reason,
  });
  return { user, isBlocked: blocked };
}

export function createGuestReview(input: CreateReviewInput, author: User) {
  bootstrapAdminEngine();
  const venue = db.venues.find((item) => item.id === input.venueId);
  if (!venue) throw new Error('VENUE_NOT_FOUND');

  const now = new Date().toISOString();
  const rating = input.rating;
  const review: Review = {
    id: createId('review'),
    venueId: input.venueId,
    author: {
      id: author.id,
      name: author.name,
      avatar: author.avatar,
      reviewsCount: db.reviews.filter((item) => item.author.id === author.id).length + 1,
      isVerified: Boolean(input.bookingId),
    },
    rating,
    ratings: {
      food: input.ratings?.food ?? rating,
      service: input.ratings?.service ?? rating,
      atmosphere: input.ratings?.atmosphere ?? rating,
      price: input.ratings?.price ?? rating,
    },
    title: input.title.trim(),
    text: input.text.trim(),
    photos: input.photos ?? [],
    likes: 0,
    occasion: input.occasion,
    bookingId: input.bookingId,
    source: 'market_fix',
    language: 'ru',
    provenance: {
      source: 'market_fix',
      fetchMethod: 'platform',
      fetchedAt: now,
      canDisplay: true,
      canScore: true,
      originalText: input.text.trim(),
    },
    createdAt: now,
    updatedAt: now,
  };

  const existingTexts = db.reviews
    .filter((item) => item.venueId === venue.id)
    .map((item) => `${item.title} ${item.text}`);
  const analysis = moderateReview(review, existingTexts);
  review.analysis = analysis;
  review.moderationStatus = analysis.moderationLevel;
  review.isPublished = isReviewPubliclyVisible(analysis.moderationLevel);

  db.reviews.unshift(review);
  getAdminStore().analyses.set(review.id, analysis);

  if (!isReviewPubliclyVisible(analysis.moderationLevel) || analysis.moderationLevel === 'approve_with_warning') {
    getAdminStore().moderationCases.unshift({
      id: createId('modcase'),
      reviewId: review.id,
      venueId: venue.id,
      status: analysis.moderationLevel === 'auto_approve' ? 'resolved' : 'open',
      aiLevel: analysis.moderationLevel,
      finalLevel: analysis.moderationLevel,
      decisionSource: 'ai',
      createdAt: now,
      updatedAt: now,
    });
  }

  if (input.bookingId) {
    const booking = db.bookings.find((item) => item.id === input.bookingId);
    if (booking) booking.hasReview = true;
  }

  recalculateVenueRating(venue.id);
  return review;
}

export function getAdminVenueDetail(slugOrId: string) {
  bootstrapAdminEngine();
  const venue =
    db.venues.find((item) => item.slug === slugOrId || item.id === slugOrId) ?? null;
  if (!venue) return null;
  const reviews = db.reviews.filter((review) => review.venueId === venue.id);
  const bookings = db.bookings.filter((booking) => booking.venueId === venue.id);
  const snapshot = getVenueRatingSnapshot(venue.id);
  const activity = searchAuditLogs({ objectType: 'venue', limit: 20 }).filter(
    (item) => item.objectId === venue.id,
  );
  return { venue, reviews, bookings, snapshot, activity };
}

export { searchAuditLogs };
