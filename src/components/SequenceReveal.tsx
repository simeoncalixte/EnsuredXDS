import React, { Children, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { spacing } from '../tokens.js';

export type SequenceRevealProps = React.PropsWithChildren<{
  /** Distance between items' scroll positions, as a fraction of viewport height. */
  stagger?: number;
  /** Scroll distance over which an item settles, as a fraction of viewport height. */
  distance?: number;
  onDone?: () => void;
  reducedMotion?: boolean;
  label?: string;
  className?: string;
}>;
const List = styled.ol`
  display: grid;
  gap: ${spacing.md}px;
  margin: 0;
  padding-inline-start: ${spacing.lg}px;
  min-width: 0;
`;
/** Scroll-driven progressive enhancement. No timeline, autoplay, entrance trigger,
 * or hidden text: the user's native scroll determines each item's transform. */
export default function SequenceReveal({
  children,
  stagger = 0.09,
  distance = 0.4,
  onDone,
  reducedMotion = false,
  label,
  className,
}: SequenceRevealProps) {
  const root = useRef<HTMLOListElement>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const items = Array.from(node.children) as HTMLElement[];
    let frame = 0;
    let completed = false;
    const update = () => {
      frame = 0;
      let allSettled = true;
      const height = Math.max(1, window.innerHeight);
      const top = node.getBoundingClientRect().top;
      items.forEach((item, index) => {
        const progress =
          reducedMotion || media.matches
            ? 1
            : Math.max(
                0,
                Math.min(
                  1,
                  (height * 0.85 - top - index * Math.max(0, stagger) * height) /
                    (height * Math.max(0.01, distance)),
                ),
              );
        // Transform only: body copy remains at full contrast and visible throughout.
        item.style.transform = progress === 1 ? '' : `translateY(${(1 - progress) * 12}px)`;
        if (progress < 1) allSettled = false;
      });
      if (allSettled && !completed) {
        completed = true;
        done.current?.();
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    media.addEventListener('change', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      media.removeEventListener('change', schedule);
      items.forEach((item) => {
        item.style.transform = '';
      });
    };
  }, [distance, stagger, reducedMotion]);
  return (
    <List ref={root} aria-label={label} className={className}>
      {Children.map(children, (child) => (
        <li>{child}</li>
      ))}
    </List>
  );
}
