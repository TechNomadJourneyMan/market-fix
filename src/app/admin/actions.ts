'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type { BookingStatus, ModerationLevel, Venue } from '@/types';
import { requireAdminPermission, requireAdminUser } from '@/server/admin/auth';
import {
  adminUpdateBookingStatus,
  overrideModerationDecision,
  recalculateVenueRating,
  setEditorialOverride,
  setUserBlocked,
  updateVenue,
  updateVenueStatus,
} from '@/server/repositories/admin';

export async function changeVenueStatusAction(formData: FormData) {
  const user = await requireAdminPermission('venues.publish');
  const venueId = String(formData.get('venueId') ?? '');
  const status = String(formData.get('status') ?? '') as Venue['status'];
  const reason = String(formData.get('reason') ?? '') || undefined;
  updateVenueStatus(venueId, status, user, reason);
  revalidatePath('/admin/venues');
  revalidatePath(`/admin/venues/${venueId}`);
  revalidatePath('/admin');
}

export async function updateVenueAction(formData: FormData) {
  const user = await requireAdminPermission('venues.edit');
  const venueId = String(formData.get('venueId') ?? '');
  updateVenue(
    venueId,
    {
      name: String(formData.get('name') ?? ''),
      tagline: String(formData.get('tagline') ?? ''),
      description: String(formData.get('description') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      email: String(formData.get('email') ?? ''),
      averagePrice: Number(formData.get('averagePrice') ?? 0),
      capacity: Number(formData.get('capacity') ?? 0),
      isFeatured: formData.get('isFeatured') === 'on',
    },
    user,
  );
  revalidatePath('/admin/venues');
  revalidatePath(`/admin/venues/${venueId}`);
}

export async function changeBookingStatusAction(formData: FormData) {
  const user = await requireAdminPermission('bookings.edit');
  const bookingId = String(formData.get('bookingId') ?? '');
  const status = String(formData.get('status') ?? '') as BookingStatus;
  const reason = String(formData.get('reason') ?? '') || undefined;
  adminUpdateBookingStatus(bookingId, status, user, reason);
  revalidatePath('/admin/bookings');
  revalidatePath('/admin');
}

export async function overrideModerationAction(formData: FormData) {
  const user = await requireAdminPermission('reviews.override_ai');
  const caseId = String(formData.get('caseId') ?? '');
  const level = String(formData.get('level') ?? '') as ModerationLevel;
  const reason = String(formData.get('reason') ?? '').trim();
  if (!reason) {
    redirect('/admin/reviews?error=reason_required');
  }
  overrideModerationDecision({ caseId, level, reason, actor: user });
  revalidatePath('/admin/reviews');
  revalidatePath('/admin/ratings');
  revalidatePath('/admin');
}

export async function recalculateRatingAction(formData: FormData) {
  const user = await requireAdminPermission('ratings.recalculate');
  const venueId = String(formData.get('venueId') ?? '');
  recalculateVenueRating(venueId, user, 'Ручной пересчёт');
  revalidatePath('/admin/ratings');
  revalidatePath(`/admin/venues/${venueId}`);
}

export async function overrideRatingAction(formData: FormData) {
  const user = await requireAdminPermission('ratings.edit');
  const venueId = String(formData.get('venueId') ?? '');
  const delta = Number(formData.get('delta') ?? 0);
  const reason = String(formData.get('reason') ?? '').trim();
  if (!reason) redirect('/admin/ratings?error=reason_required');
  setEditorialOverride({ venueId, delta, reason, actor: user });
  revalidatePath('/admin/ratings');
}

export async function toggleUserBlockAction(formData: FormData) {
  const user = await requireAdminPermission('users.block');
  const userId = String(formData.get('userId') ?? '');
  const blocked = formData.get('blocked') === '1';
  const reason = String(formData.get('reason') ?? '') || undefined;
  setUserBlocked(userId, blocked, user, reason);
  revalidatePath('/admin/users');
}

export async function requireAdminSessionAction() {
  return requireAdminUser();
}
