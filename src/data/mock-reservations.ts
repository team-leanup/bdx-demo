import type { BookingRequest } from '@/types/consultation';

export const MOCK_RESERVATIONS: BookingRequest[] = [
  {
    id: 'booking-001',
    customerName: '한소희',
    phone: '010-1111-2222',
    reservationDate: '2026-02-26',
    reservationTime: '10:00',
    channel: 'kakao',
    requestNote: '봄 느낌 플라워 아트 원해요. 파스텔 핑크 계열로 부탁드려요!',
    referenceImageUrls: [],
    status: 'confirmed',
    designerId: 'designer-001',
    createdAt: '2026-02-25T20:30:00.000Z',
  },
  {
    id: 'booking-002',
    customerName: '이지은',
    phone: '010-3333-4444',
    reservationDate: '2026-02-26',
    reservationTime: '13:00',
    channel: 'naver',
    requestNote: '오발 쉐입, 단색으로 깔끔하게',
    referenceImageUrls: [],
    status: 'confirmed',
    designerId: 'designer-002',
    createdAt: '2026-02-24T15:00:00.000Z',
  },
  {
    id: 'booking-003',
    customerName: '강민지',
    phone: '010-5555-6666',
    reservationDate: '2026-02-26',
    reservationTime: '15:30',
    channel: 'phone',
    requestNote: '발 네일 처음이에요. 기본적인 거로 해주세요',
    referenceImageUrls: [],
    status: 'confirmed',
    designerId: 'designer-003',
    createdAt: '2026-02-26T09:00:00.000Z',
  },
  {
    id: 'booking-004',
    customerName: '오지영',
    phone: '010-7777-8888',
    reservationDate: '2026-02-26',
    reservationTime: '17:00',
    channel: 'walk_in',
    requestNote: undefined,
    referenceImageUrls: [],
    status: 'pending',
    designerId: 'designer-001',
    createdAt: '2026-02-26T11:00:00.000Z',
  },
  {
    id: 'booking-005',
    customerName: '박수아',
    phone: '010-9999-0000',
    reservationDate: '2026-02-27',
    reservationTime: '11:00',
    channel: 'kakao',
    requestNote: '이달의 아트로 예약했어요. 큐빅 파츠 추가 원합니다',
    referenceImageUrls: [],
    status: 'confirmed',
    designerId: 'designer-002',
    createdAt: '2026-02-25T18:00:00.000Z',
  },
];

export function getTodayReservations(): BookingRequest[] {
  const today = new Date().toISOString().split('T')[0];
  return MOCK_RESERVATIONS
    .filter((r) => r.reservationDate === today)
    .sort((a, b) => a.reservationTime.localeCompare(b.reservationTime));
}
