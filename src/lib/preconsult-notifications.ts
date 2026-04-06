import type { BookingRequest, ConsultationType } from '@/types/consultation';
import { getNowInKoreaIso } from '@/lib/format';

const STORAGE_KEY = 'bdx-preconsult-read-v2';
export const PRECONSULT_NOTIFICATIONS_UPDATED = 'bdx-preconsult-notifications-updated';

export interface PreConsultationNotification {
  key: string;
  bookingId: string;
  customerId?: string;
  customerName: string;
  reservationDate: string;
  reservationTime: string;
  serviceLabel?: string;
  language?: BookingRequest['language'];
  completedAt: string;
  preConsultationData?: ConsultationType;
  referenceImageUrls?: string[];
}

type ReadState = Record<string, string>;

function readState(): ReadState {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.entries(parsed).reduce<ReadState>((acc, [key, value]) => {
      if (typeof value === 'string') {
        acc[key] = value;
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

function writeState(state: ReadState): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(PRECONSULT_NOTIFICATIONS_UPDATED));
  } catch (e) {
    console.warn('[preconsult-notifications] localStorage write failed:', e);
  }
}

export function getPreConsultationNotificationKey(
  bookingId: string,
  completedAt?: string,
): string {
  return `${bookingId}:${completedAt ?? 'pending'}`;
}

export function getPreConsultationNotifications(
  reservations: BookingRequest[],
): PreConsultationNotification[] {
  return reservations
    .filter(
      (reservation) =>
        reservation.preConsultationCompletedAt &&
        reservation.status !== 'completed' &&
        reservation.status !== 'cancelled',
    )
    .map((reservation) => ({
      key: getPreConsultationNotificationKey(
        reservation.id,
        reservation.preConsultationCompletedAt,
      ),
      bookingId: reservation.id,
      customerId: reservation.customerId,
      customerName: reservation.customerName,
      reservationDate: reservation.reservationDate,
      reservationTime: reservation.reservationTime,
      serviceLabel: reservation.serviceLabel,
      language: reservation.language,
      completedAt: reservation.preConsultationCompletedAt!,
      preConsultationData: reservation.preConsultationData,
      referenceImageUrls:
        reservation.referenceImageUrls ??
        reservation.preConsultationData?.referenceImages,
    }))
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

export function isPreConsultationNotificationRead(
  notification: Pick<PreConsultationNotification, 'key'>,
): boolean {
  const state = readState();
  return Boolean(state[notification.key]);
}

export function markPreConsultationNotificationRead(
  notification: Pick<PreConsultationNotification, 'key'>,
): void {
  const state = readState();
  state[notification.key] = getNowInKoreaIso();
  writeState(state);
}

export function getUnreadPreConsultationCount(
  notifications: PreConsultationNotification[],
): number {
  const state = readState();
  return notifications.filter((notification) => !state[notification.key]).length;
}
