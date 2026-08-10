import { Badge } from '@/components/ui/badge';
import type { BookingStatus, ModerationLevel, Venue } from '@/types';

const VENUE_STATUS: Record<Venue['status'], { label: string; variant: 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  pending_review: { label: 'Pending Review', variant: 'warning' },
  verified: { label: 'Verified', variant: 'outline' },
  published: { label: 'Published', variant: 'success' },
  suspended: { label: 'Suspended', variant: 'destructive' },
  archived: { label: 'Archived', variant: 'secondary' },
};

const BOOKING_STATUS: Record<BookingStatus, { label: string; variant: 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  awaiting_payment: { label: 'Awaiting payment', variant: 'outline' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  completed: { label: 'Completed', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  no_show: { label: 'No-show', variant: 'destructive' },
};

const MOD_STATUS: Record<ModerationLevel, { label: string; variant: 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' }> = {
  auto_approve: { label: 'Auto Approve', variant: 'success' },
  approve_with_warning: { label: 'Warn', variant: 'warning' },
  needs_human_review: { label: 'Human Review', variant: 'warning' },
  temporarily_hidden: { label: 'Hidden', variant: 'outline' },
  reject: { label: 'Reject', variant: 'destructive' },
  spam: { label: 'Spam', variant: 'destructive' },
  fraud_suspected: { label: 'Fraud', variant: 'destructive' },
};

export function VenueStatusBadge({ status }: { status: Venue['status'] }) {
  const meta = VENUE_STATUS[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const meta = BOOKING_STATUS[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function ModerationStatusBadge({ status }: { status: ModerationLevel }) {
  const meta = MOD_STATUS[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
