"use client";

interface MobileNavToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function MobileNavToggle({
  isOpen,
  onToggle,
  onClose,
}: MobileNavToggleProps) {
  return (
    <>
      <button
        type="button"
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-md bg-ink-950 text-paper-text shadow-md md:hidden"
        aria-expanded={isOpen}
        aria-controls="mobile-sidebar-panel"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        onClick={onToggle}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          {isOpen ? (
            <path d="M18 6 6 18M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>
      {isOpen && (
        <div
          data-testid="mobile-nav-backdrop"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
