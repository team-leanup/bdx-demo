"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useReservationStore } from "@/store/reservation-store";
import { getNowInKoreaIso } from "@/lib/format";
import type { BookingRequest } from "@/types/consultation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingRequest | null;
  shopName?: string;
}

interface ConsultationLinkContentProps {
  booking: BookingRequest | null;
  shopName?: string;
  onClose: () => void;
  closeLabel?: string;
}

export function ConsultationLinkContent({
  booking,
  shopName,
  onClose,
  closeLabel = "닫기",
}: ConsultationLinkContentProps) {
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    if (!booking) return "";
    if (typeof window === "undefined") return "";
    // 미리 정하기 링크: /pre-consult/[shopId]
    const shopId = booking.shopId;
    if (shopId) {
      const base = `${window.location.origin}/pre-consult/${shopId}`;
      return booking.id ? `${base}?bookingId=${booking.id}` : base;
    }
    // shopId 없으면 기존 상담 경로 폴백
    const params = new URLSearchParams();
    params.set("entry", "customer-link");
    params.set("name", booking.customerName);
    params.set("phone", booking.phone);
    if (shopName) params.set("shopName", shopName);
    return `${window.location.origin}/consultation?${params.toString()}`;
  }, [booking, shopName]);

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      // 링크 복사 시 consultationLinkSentAt 기록
      if (booking && !booking.consultationLinkSentAt) {
        useReservationStore.getState().updateReservation(booking.id, {
          consultationLinkSentAt: getNowInKoreaIso(),
        });
      }
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleOpen = () => {
    if (!url) return;
    window.open(url, "_blank");
    if (booking && !booking.consultationLinkSentAt) {
      useReservationStore.getState().updateReservation(booking.id, {
        consultationLinkSentAt: getNowInKoreaIso(),
      });
    }
  };

  return (
    <div className="p-5">
      <label className="text-xs text-text-muted">생성된 링크</label>
      <div className="mt-2 mb-3 flex gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white"
        >
          {copied ? "복사됨" : "복사"}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleOpen}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-alt"
        >
          새 탭에서 열기
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-3 py-2 text-sm font-medium text-text-muted hover:underline"
        >
          {closeLabel}
        </button>
      </div>
    </div>
  );
}

export function ConsultationLinkModal({ isOpen, onClose, booking, shopName }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={"미리 정하기 링크"}>
      <ConsultationLinkContent booking={booking} shopName={shopName} onClose={onClose} />
    </Modal>
  );
}

export default ConsultationLinkModal;
