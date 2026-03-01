import type { Shop, Designer, BusinessHours } from '@/types/shop';

const businessHours: BusinessHours[] = [
  { dayOfWeek: 0, isOpen: false },
  { dayOfWeek: 1, isOpen: true, openTime: '10:00', closeTime: '20:00' },
  { dayOfWeek: 2, isOpen: true, openTime: '10:00', closeTime: '20:00' },
  { dayOfWeek: 3, isOpen: true, openTime: '10:00', closeTime: '20:00' },
  { dayOfWeek: 4, isOpen: true, openTime: '10:00', closeTime: '20:00' },
  { dayOfWeek: 5, isOpen: true, openTime: '10:00', closeTime: '20:00' },
  { dayOfWeek: 6, isOpen: true, openTime: '10:00', closeTime: '18:00' },
];

export const MOCK_SHOP: Shop = {
  id: 'shop-001',
  ownerId: 'owner-001',
  name: '네일숲',
  phone: '02-1234-5678',
  address: '서울시 강남구 청담동 123-4',
  themeId: 'rose-pink',
  businessHours,
  baseHandPrice: 60000,
  baseFootPrice: 70000,
  logoUrl: undefined,
  createdAt: '2025-03-01T09:00:00.000Z',
  updatedAt: '2026-02-26T09:00:00.000Z',
};

export const MOCK_DESIGNERS: Designer[] = [
  {
    id: 'designer-001',
    shopId: 'shop-001',
    name: '효주',
    role: 'owner',
    profileImageUrl: undefined,
    phone: '010-1111-2222',
    isActive: true,
    createdAt: '2025-03-01T09:00:00.000Z',
  },
  {
    id: 'designer-002',
    shopId: 'shop-001',
    name: '명훈',
    role: 'staff',
    profileImageUrl: undefined,
    phone: '010-3333-4444',
    isActive: true,
    createdAt: '2025-03-15T09:00:00.000Z',
  },
  {
    id: 'designer-003',
    shopId: 'shop-001',
    name: '자훈',
    role: 'staff',
    profileImageUrl: undefined,
    phone: '010-5555-6666',
    isActive: true,
    createdAt: '2025-04-01T09:00:00.000Z',
  },
];
