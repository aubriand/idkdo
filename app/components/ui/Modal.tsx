"use client";

import * as React from "react";
import Button from "./Button";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
};

export default function Modal({ open, onClose, title, children, footer }: ModalProps) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: 'var(--overlay)' }} onClick={onClose} />
      <div className="relative w-full max-w-5xl rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-lg">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)]">✕</button>
        </div>
        <div className="space-y-3">{children}</div>
        <div className="mt-4 flex justify-end gap-2">
          {footer ?? <Button onClick={onClose} variant="secondary">Fermer</Button>}
        </div>
      </div>
    </div>,
    document.body
  );
}
