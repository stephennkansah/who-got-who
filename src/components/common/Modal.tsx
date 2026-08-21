import React, { useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  /** When false, backdrop tap / Escape / ✕ are disabled (forced-choice dialogs). */
  dismissible?: boolean;
  ariaLabel?: string;
  labelledBy?: string;
  role?: 'dialog' | 'alertdialog';
  maxWidth?: number;
  showClose?: boolean;
  children: React.ReactNode;
}

/**
 * Shared modal scaffold: portal, backdrop tap, Escape, focus containment,
 * dialog semantics. All app modals should render through this.
 */
export default function Modal({
  isOpen,
  onClose,
  dismissible = true,
  ariaLabel,
  labelledBy,
  role = 'dialog',
  maxWidth = 360,
  showClose = false,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    if (dismissible) onClose?.();
  }, [dismissible, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    previousFocus.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        handleClose();
        return;
      }
      if (event.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (event.shiftKey && (active === first || active === panelRef.current)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      previousFocus.current?.focus?.();
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div
        ref={panelRef}
        className="modal"
        role={role}
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        tabIndex={-1}
        style={{ maxWidth, position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        {showClose && dismissible && (
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
