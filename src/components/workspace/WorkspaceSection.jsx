import { cn } from '@/lib/utils';

/**
 * Editorial workspace section.
 * Variants: 'canvas' (white), 'parchment' (very-light gray), 'dark' (#1d1d1f).
 * Always full-bleed with a centered inner.
 */
export function WorkspaceSection({
  variant = 'canvas',
  className,
  innerClassName,
  children,
  ...rest
}) {
  const bg =
    variant === 'dark'
      ? 'bg-neutral-900 text-white'
      : variant === 'parchment'
      ? 'bg-neutral-50 text-neutral-900'
      : 'bg-white text-neutral-900';

  return (
    <section
      className={cn('relative w-full overflow-hidden', bg, className)}
      {...rest}
    >
      <div
        className={cn(
          'mx-auto w-full max-w-[1180px] px-6 py-12 sm:py-16 md:py-20',
          innerClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
