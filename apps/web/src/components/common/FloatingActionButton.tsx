interface FloatingActionButtonProps {
  onClick: () => void;
  'aria-label': string;
  title?: string;
  className?: string;
}

export function FloatingActionButton({
  onClick,
  className = '',
  ...rest
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ backgroundColor: 'var(--club-primary, #2563eb)' }}
      className={`fixed bottom-8 right-8 w-14 h-14 text-white rounded-full shadow-lg transition hover:brightness-110 flex items-center justify-center group ${className}`}
      {...rest}
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M12 4v16m8-8H4"
        />
      </svg>
    </button>
  );
}
