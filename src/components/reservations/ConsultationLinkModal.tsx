"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { BookingRequest } from "@/types/consultation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingRequest | null;
}

export function ConsultationLinkModal({ isOpen, onClose, booking }: Props) {
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    if (!booking) return "";
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams();
    params.set("name", booking.customerName);
    params.set("phone", booking.phone);
    if (booking.requestNote) params.set("note", booking.requestNote);
    params.set("lang", booking.language ?? "ko");
    params.set("bookingId", booking.id);
    params.set("entry", "customer-link");
    return `${window.location.origin}/consultation/customer?${params.toString()}`;
  }, [booking]);

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleOpen = () => {
    if (!url) return;
    window.open(url, "_blank");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={"상담 링크 생성"}>
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
            닫기
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConsultationLinkModal;
