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
        className="fixed top-4 left-4 z-50 rounded-md bg-ink-950 px-3 py-2 text-sm font-medium text-paper-text shadow-md md:hidden"
        aria-expanded={isOpen}
        aria-controls="mobile-sidebar-panel"
        onClick={onToggle}
      >
        {isOpen ? "Close menu" : "Open menu"}
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
