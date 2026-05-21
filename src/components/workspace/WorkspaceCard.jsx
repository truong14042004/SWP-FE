import { cn } from '@/lib/utils';

/**
 * A surface card. Use as a base for any tile — magnet hover by default.
 * Wraps children, no internal padding (caller controls).
 */
export function WorkspaceCard({
  as = 'article',
  className,
  hover = true,
  children,
  ...rest
}) {
  const Tag = as;
  return (
    <Tag
      className={cn(
        'group relative rounded-2xl border border-neutral-200 bg-white transition will-change-transform',
        hover &&
          'hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_22px_50px_-28px_rgba(15,23,42,0.18)]',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
