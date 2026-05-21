import { cn } from '@/lib/utils';
import { Fade } from '@/components/animate-ui/primitives/effects/fade';

/**
 * Editorial hero — eyebrow + headline + lede + actions.
 * Use inside <WorkspaceSection variant="canvas|parchment|dark">.
 *
 * Pass `orbs` to render ambient blur orbs (auto-hidden on reduced motion).
 */
export function WorkspaceHero({
  eyebrow,
  title,
  lede,
  actions,
  orbs = false,
  align = 'left',
  className,
}) {
  return (
    <div
      className={cn(
        'relative',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {orbs && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(41,151,255,0.55),transparent_70%)] blur-3xl motion-reduce:hidden"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-24 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(100,210,255,0.4),transparent_70%)] blur-3xl motion-reduce:hidden"
          />
        </>
      )}

      <div className="relative">
        <Fade>
          {eyebrow && (
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </span>
          )}
        </Fade>
        <Fade delay={0.05}>
          <h1 className="font-sans text-4xl font-semibold leading-[1.07] tracking-tight sm:text-5xl md:text-[64px]">
            {title}
          </h1>
        </Fade>
        {lede && (
          <Fade delay={0.1}>
            <p
              className={cn(
                'mt-5 max-w-2xl text-base leading-relaxed text-neutral-500 sm:text-lg',
                align === 'center' && 'mx-auto',
              )}
            >
              {lede}
            </p>
          </Fade>
        )}
        {actions && (
          <Fade delay={0.15}>
            <div
              className={cn(
                'mt-7 flex flex-wrap items-center gap-3',
                align === 'center' && 'justify-center',
              )}
            >
              {actions}
            </div>
          </Fade>
        )}
      </div>
    </div>
  );
}
