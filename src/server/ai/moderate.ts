import type {
  ModerationLevel,
  Review,
  ReviewAnalysis,
  ReviewAnalysisScores,
  ReviewTopic,
} from '@/types';
import { createId } from '@/lib/utils';

const MODERATION_VERSION = 'mf-mod-v1';

const SPAM_PATTERNS = [
  /https?:\/\//i,
  /whatsapp/i,
  /телеграм/i,
  /скидк[аи]/i,
  /промокод/i,
  /заработ[ао]к/i,
  /казино/i,
];

const COMPETITOR_PATTERNS = [
  /лучше (сходи|сходите|идите) в/i,
  /вместо этого/i,
  /рекомендую (другой|конкурент)/i,
];

const HEARSAY_PATTERNS = [
  /все вокруг говорят/i,
  /мне сказали что/i,
  /слыш[ау]л[аи]? что/i,
  /по слухам/i,
  /все говорят/i,
];

const TOXIC_PATTERNS = [
  /\b(урод|идиот|дебил|мразь|лох)\b/i,
  /ненавижу/i,
];

const EXPERIENCE_MARKERS = [
  /заказ/i,
  /официант/i,
  /блюд/i,
  /стол/i,
  /бронь/i,
  /ждал/i,
  /принесли/i,
  /вкус/i,
  /атмосфер/i,
  /цен[аыу]/i,
  /сервис/i,
  /персонал/i,
  /чист/i,
  /музык/i,
  /террас/i,
];

const TOPIC_RULES: { topic: ReviewTopic; patterns: RegExp[] }[] = [
  { topic: 'food', patterns: [/еда|блюд|кухн|вкус|стейк|суп|десерт|напит/i] },
  { topic: 'service', patterns: [/сервис|обслуживан|официант|персонал/i] },
  { topic: 'price', patterns: [/цен[аыу]|дорог|дешев|чек|стоимость/i] },
  { topic: 'atmosphere', patterns: [/атмосфер|уют|шум|тиш|романтик/i] },
  { topic: 'cleanliness', patterns: [/чист|гряз|гигиен|туалет/i] },
  { topic: 'speed', patterns: [/ждал|долго|быстро|скорост|ожидан/i] },
  { topic: 'interior', patterns: [/интерьер|дизайн|зал|декор/i] },
  { topic: 'music', patterns: [/музык|звук|dj|живой/i] },
  { topic: 'location', patterns: [/локац|район|парк|центр|адрес/i] },
  { topic: 'staff', patterns: [/персонал|менеджер|хостес|бармен/i] },
  { topic: 'booking', patterns: [/брон|резерв|стол|подтверд/i] },
  { topic: 'wait', patterns: [/очеред|ждал|ожидан/i] },
  { topic: 'expectations', patterns: [/ожидал|не соответств|разочаров/i] },
];

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function detectLanguage(text: string): string {
  if (/[әғқңөұүһі]/i.test(text)) return 'kk';
  if (/[a-z]/i.test(text) && !/[а-яё]/i.test(text)) return 'en';
  return 'ru';
}

function extractTopics(text: string): ReviewTopic[] {
  const topics = TOPIC_RULES.filter((rule) =>
    rule.patterns.some((pattern) => pattern.test(text)),
  ).map((rule) => rule.topic);
  return topics.length > 0 ? topics : ['other'];
}

function scoreSentiment(rating: number, text: string): ReviewAnalysis['sentiment'] {
  const negativeWords = (text.match(/ужас|плох|кошмар|разочаров|грязн|груб/gi) ?? []).length;
  const positiveWords = (text.match(/отлич|прекрас|вкусн|рекоменд|супер|лучш/gi) ?? []).length;
  if (rating <= 2 && positiveWords > negativeWords) return 'mixed';
  if (rating >= 4 && negativeWords > positiveWords) return 'mixed';
  if (rating <= 2 || negativeWords >= 2) return 'negative';
  if (rating >= 4 || positiveWords >= 2) return 'positive';
  return 'neutral';
}

function decideLevel(scores: ReviewAnalysisScores, riskScore: number): ModerationLevel {
  if (scores.spam >= 0.85 || riskScore >= 0.9) return 'spam';
  if (scores.manipulation >= 0.8 || scores.botProbability >= 0.85) return 'fraud_suspected';
  if (scores.toxicity >= 0.75) return 'temporarily_hidden';
  if (scores.relevance < 0.35 || scores.objectivity < 0.3) return 'needs_human_review';
  if (scores.duplicate >= 0.85) return 'needs_human_review';
  if (scores.aiGeneratedProbability >= 0.8) return 'needs_human_review';
  if (riskScore >= 0.55) return 'needs_human_review';
  if (scores.helpfulness < 0.35 || scores.authenticity < 0.45) return 'approve_with_warning';
  if (scores.spam >= 0.6) return 'reject';
  return 'auto_approve';
}

function buildReasoning(
  level: ModerationLevel,
  scores: ReviewAnalysisScores,
  topics: ReviewTopic[],
  flags: string[],
): string {
  const parts = [
    `Решение: ${level}.`,
    `Темы: ${topics.join(', ')}.`,
    `Authenticity ${(scores.authenticity * 100).toFixed(0)}%, relevance ${(scores.relevance * 100).toFixed(0)}%, objectivity ${(scores.objectivity * 100).toFixed(0)}%.`,
  ];
  if (flags.length) parts.push(`Флаги: ${flags.join('; ')}.`);
  parts.push('Негатив сам по себе не является причиной отклонения.');
  return parts.join(' ');
}

/** Deterministic AI moderation — no LLM required for P0. */
export function moderateReview(review: Review, existingTexts: string[] = []): ReviewAnalysis {
  const text = `${review.title} ${review.text}`.trim();
  const normalized = text.toLowerCase().replace(/\s+/g, ' ');
  const words = normalized.split(' ').filter(Boolean);
  const flags: string[] = [];

  const spamHits = SPAM_PATTERNS.filter((pattern) => pattern.test(text)).length;
  const competitorHits = COMPETITOR_PATTERNS.filter((pattern) => pattern.test(text)).length;
  const hearsayHits = HEARSAY_PATTERNS.filter((pattern) => pattern.test(text)).length;
  const toxicHits = TOXIC_PATTERNS.filter((pattern) => pattern.test(text)).length;
  const experienceHits = EXPERIENCE_MARKERS.filter((pattern) => pattern.test(text)).length;

  const duplicate =
    existingTexts.filter((item) => {
      const other = item.toLowerCase().replace(/\s+/g, ' ');
      return other === normalized || (other.length > 40 && normalized.includes(other.slice(0, 40)));
    }).length > 0
      ? 0.95
      : 0;

  if (spamHits) flags.push('spam_patterns');
  if (competitorHits) flags.push('competitor_promo');
  if (hearsayHits) flags.push('hearsay_no_direct_experience');
  if (toxicHits) flags.push('toxicity');
  if (duplicate > 0) flags.push('duplicate_text');

  const topics = extractTopics(text);
  const sentiment = scoreSentiment(review.rating, text);

  const relevance = clamp01(
    0.35 +
      experienceHits * 0.12 +
      (topics[0] !== 'other' ? 0.2 : 0) -
      hearsayHits * 0.35 -
      competitorHits * 0.3,
  );

  const objectivity = clamp01(
    0.25 +
      experienceHits * 0.14 +
      Math.min(words.length, 80) / 200 -
      hearsayHits * 0.4 -
      (words.length < 6 ? 0.25 : 0),
  );

  const authenticity = clamp01(
    0.4 +
      experienceHits * 0.1 +
      (review.author.isVerified ? 0.15 : 0) +
      (review.bookingId ? 0.15 : 0) -
      spamHits * 0.2 -
      duplicate * 0.3,
  );

  const helpfulness = clamp01(
    Math.min(words.length, 120) / 140 + experienceHits * 0.08 + objectivity * 0.2,
  );

  const scores: ReviewAnalysisScores = {
    authenticity,
    spam: clamp01(spamHits * 0.35 + competitorHits * 0.25 + (words.length < 3 ? 0.4 : 0)),
    botProbability: clamp01(
      (words.length < 4 ? 0.35 : 0) + duplicate * 0.4 + (/(.)\1{4,}/.test(normalized) ? 0.4 : 0),
    ),
    relevance,
    helpfulness,
    objectivity,
    toxicity: clamp01(toxicHits * 0.45),
    manipulation: clamp01(
      competitorHits * 0.4 +
        (review.rating === 1 && experienceHits === 0 ? 0.25 : 0) +
        (review.rating === 5 && words.length < 5 ? 0.2 : 0),
    ),
    duplicate,
    aiGeneratedProbability: clamp01(
      (/как (искусственный|языковой) интеллект/i.test(text) ? 0.9 : 0) +
        (words.length > 120 && experienceHits < 2 ? 0.35 : 0),
    ),
  };

  const riskScore = clamp01(
    scores.spam * 0.25 +
      scores.botProbability * 0.15 +
      scores.toxicity * 0.15 +
      scores.manipulation * 0.2 +
      (1 - scores.relevance) * 0.15 +
      scores.duplicate * 0.1,
  );

  const moderationLevel = decideLevel(scores, riskScore);
  const now = new Date().toISOString();

  return {
    id: createId('analysis'),
    reviewId: review.id,
    scores,
    sentiment,
    topics,
    riskScore,
    moderationLevel,
    aiReasoningSummary: buildReasoning(moderationLevel, scores, topics, flags),
    moderationVersion: MODERATION_VERSION,
    confidence: clamp01(0.55 + objectivity * 0.2 + authenticity * 0.15),
    language: detectLanguage(text),
    createdAt: now,
    updatedAt: now,
  };
}

export function isReviewPubliclyVisible(level: ModerationLevel | undefined): boolean {
  if (!level) return true;
  return level === 'auto_approve' || level === 'approve_with_warning';
}
