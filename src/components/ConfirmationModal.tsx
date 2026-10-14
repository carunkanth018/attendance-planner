import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X, RotateCcw } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  supportingNote?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title = 'Reset your planner?',
  message = 'This will clear your saved attendance numbers, weekly timetable, and planned leaves from this device.',
  supportingNote = 'Your planner data will be removed. This action cannot be undone.',
  confirmLabel = 'Reset planner',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Focus management and accessibility setup
  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;

      // Small delay to ensure DOM is rendered before focusing Cancel button (safe default)
      const timer = window.setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);

      // Disable background body scrolling while modal is open
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
      };
    } else {
      // Restore focus to the trigger button when dialog closes
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
        previousActiveElementRef.current = null;
      }
    }
  }, [isOpen]);

  // Keyboard navigation: Escape key closes, Tab key trapped inside modal
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      e.preventDefault();
      onCancel();
      return;
    }

    if (e.key === 'Tab') {
      if (!modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleConfirmAction = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="reset-modal-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-modal-title"
        aria-describedby="reset-modal-description"
        className="reset-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Small Warning Icon Badge + Title + Top-Right Close Button */}
        <div className="reset-modal-header">
          <div className="reset-modal-header-left">
            <div className="reset-modal-icon-badge" aria-hidden="true">
              <AlertTriangle size={20} strokeWidth={2.2} />
            </div>
            <h2 id="reset-modal-title" className="reset-modal-title">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="reset-modal-close-btn"
            aria-label="Close dialog"
            title="Close dialog (Escape)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Description Section */}
        <div className="reset-modal-desc-box">
          <p id="reset-modal-description" className="reset-modal-desc-text">
            {message}
          </p>
        </div>

        {/* Warning Note Section */}
        {supportingNote && (
          <div className="reset-modal-warning-box">
            <AlertTriangle className="reset-modal-warning-icon" aria-hidden="true" />
            <p className="reset-modal-warning-text">
              {supportingNote}
            </p>
          </div>
        )}

        {/* Footer Actions: Cancel and Destructive Reset Buttons */}
        <div className="reset-modal-footer">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="reset-modal-cancel-btn"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={handleConfirmAction}
            disabled={isSubmitting}
            className="reset-modal-confirm-btn"
          >
            <RotateCcw size={16} strokeWidth={2.4} aria-hidden="true" />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

