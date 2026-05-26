'use client';

import * as React from 'react';

import {
  useIsInView,
  type UseIsInViewOptions,
} from '@/hooks/use-is-in-view';

type TypingTextProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  as?: React.ElementType;
  text: string;
  /** ms per character */
  duration?: number;
  /** delay before typing starts (ms) */
  delay?: number;
  /** show a blinking cursor next to the text */
  cursor?: boolean;
  /** restart the animation from scratch every time the text enters the viewport */
  loop?: boolean;
  /** when looping, how long to hold the full string before clearing (ms) */
  holdDelay?: number;
} & UseIsInViewOptions;

function TypingText({
  ref,
  as: Component = 'span',
  text,
  duration = 60,
  delay = 0,
  cursor = false,
  loop = false,
  holdDelay = 1500,
  inView = false,
  inViewMargin = '0px',
  inViewOnce = true,
  ...props
}: TypingTextProps) {
  const { ref: localRef, isInView } = useIsInView(
    ref as React.Ref<HTMLElement>,
    { inView, inViewOnce, inViewMargin },
  );

  const [displayed, setDisplayed] = React.useState('');
  const characters = React.useMemo(() => Array.from(text), [text]);

  React.useEffect(() => {
    if (!isInView) return undefined;
    let cancelled = false;
    const timers: number[] = [];

    const run = () => {
      setDisplayed('');
      timers.push(
        window.setTimeout(() => {
          characters.forEach((_, index) => {
            timers.push(
              window.setTimeout(() => {
                if (cancelled) return;
                setDisplayed(characters.slice(0, index + 1).join(''));
                if (loop && index === characters.length - 1) {
                  timers.push(window.setTimeout(run, holdDelay));
                }
              }, index * duration),
            );
          });
        }, delay),
      );
    };

    run();

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [isInView, characters, duration, delay, loop, holdDelay]);

  return (
    <Component
      ref={localRef}
      data-slot="typing-text"
      aria-label={text}
      {...props}
    >
      <span aria-hidden="true">{displayed}</span>
      {cursor && (
        <span
          aria-hidden="true"
          data-slot="typing-text-cursor"
          className="typing-text-cursor"
        >
          |
        </span>
      )}
    </Component>
  );
}

export { TypingText, type TypingTextProps };
