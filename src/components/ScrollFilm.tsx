import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import styled from 'styled-components';
import Button from './Button.js';
import Modal from './Modal.js';
import { colors } from '../colors.js';
import { spacing, typography } from '../tokens.js';
export type ScrollFilmBeat = { label: string; content: React.ReactNode };
export type ScrollFilmShot = {
  id: string;
  title: string;
  eyebrow?: string;
  beats: ScrollFilmBeat[];
  details?: React.ReactNode;
  detailLabel?: string;
};
export type ScrollFilmFrame = { progress: number; paused: boolean; reducedMotion: boolean };
export type ScrollFilmProps = {
  hero: React.ReactNode;
  shots: ScrollFilmShot[];
  renderVisual: (frame: ScrollFilmFrame) => React.ReactNode;
  seatControl?: React.ReactNode;
  reducedMotion?: boolean;
  className?: string;
};
const Root = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.4fr);
  gap: ${spacing.lg}px;
  background: ${colors.surface};
  color: ${colors.text.primary};
  min-width: 0;
  font-family: ${typography.bodyFamily};
  @media (max-width: 1099px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
const Controls = styled.div`
  grid-column: 1/-1;
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${spacing.xs}px;
  background: ${colors.surface};
  padding: ${spacing.sm}px;
  border-bottom: 1px solid ${colors.outlineVariant};
`;
const Control = styled(Button)`
  min-height: 44px;
`;
const Hero = styled.header`
  grid-column: 1;
  grid-row: 2;
  min-width: 0;
  scroll-margin-top: 80px;
`;
const Visual = styled.div<{ $rows: number }>`
  grid-column: 2;
  grid-row: 2 / span ${({ $rows }) => $rows};
  align-self: start;
  position: sticky;
  top: 64px;
  min-width: 0;
  @media (max-width: 1099px) {
    grid-column: 1;
    grid-row: 3;
    z-index: 2;
  }
`;
const Shot = styled.section`
  grid-column: 1;
  min-width: 0;
  scroll-margin-top: 80px;
  padding-block: ${spacing.xl}px;
  border-top: 1px solid ${colors.outlineVariant};
`;
const Title = styled.h2`
  font: 400 clamp(1.8rem, 3vw, 3rem)/1.1 ${typography.headlineFamily};
  margin: 0 0 ${spacing.lg}px;
`;
const Eyebrow = styled.p`
  font-size: 0.875rem;
  line-height: 1.5;
  color: ${colors.onSurfaceVariant};
  margin: 0 0 ${spacing.sm}px;
`;
const Beat = styled.div`
  min-height: 40vh;
  padding-block: ${spacing.lg}px;
  scroll-margin-top: 80px;
  line-height: 1.6;
  font-size: 1.125rem;
  @media (max-width: 1099px) {
    min-height: 50vh;
    scroll-margin-top: 55vh;
  }
`;
const BeatTitle = styled.h3`
  font: 600 0.875rem/1.5 ${typography.labelFamily};
  text-transform: uppercase;
  color: ${colors.onSurfaceVariant};
`;
const Hidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;
const subscribe = () => () => {};
/** Semantic, native-scroll film. All scene text is rendered in reading order;
 * scroll only updates the shared visual. No wheel interception or playback clock. */
export default function ScrollFilm({
  hero,
  shots,
  renderVisual,
  seatControl,
  reducedMotion = false,
  className,
}: ScrollFilmProps) {
  const nodes = useRef<(HTMLElement | null)[]>([]);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [detail, setDetail] = useState<ScrollFilmShot | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [returnDetail, setReturnDetail] = useState<ScrollFilmShot | null>(null);
  const enhanced = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const count = 1 + shots.reduce((sum, s) => sum + s.beats.length, 0);
  const beatCounts = shots.map((s) => s.beats.length).join(',');
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * (window.innerWidth < 1100 ? 0.7 : 0.4);
      let index = 0;
      for (let i = 0; i < nodes.current.length; i++)
        if (nodes.current[i] && nodes.current[i]!.getBoundingClientRect().top <= line) index = i;
      if (window.scrollY === 0) index = 0;
      const node = nodes.current[index];
      const rect = node?.getBoundingClientRect();
      const local = rect
        ? Math.max(0, Math.min(1, (line - rect.top) / Math.max(1, rect.height)))
        : 0;
      setActive(index);
      const counts = beatCounts.split(',').map(Number);
      let segment = local;
      if (index > 0) {
        let start = 1;
        for (let shot = 0; shot < counts.length; shot++) {
          if (index < start + counts[shot]) {
            segment = shot + 1 + (index - start + local) / counts[shot];
            break;
          }
          start += counts[shot];
        }
      }
      setProgress(
        window.scrollY === 0 ? 0 : Math.max(0, Math.min(1, segment / (counts.length + 1))),
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [count, beatCounts]);
  const go = (index: number) => {
    const bounded = Math.max(0, Math.min(count - 1, index));
    const node = nodes.current[bounded];
    if (!node) return;
    node.scrollIntoView({ behavior: 'auto', block: 'start' });
    setActive(bounded);
    const heading = node.querySelector<HTMLElement>('h1,h2,h3');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
    setAnnouncement(`Step ${bounded + 1} of ${count}: ${heading?.textContent ?? 'Introduction'}`);
  };
  let offset = 1;
  return (
    <Root className={className}>
      <Controls role="group" aria-label="Scroll story controls">
        <Control
          variant="secondary"
          disabled={active === 0}
          onClick={() => go(active - 1)}
          aria-label="Previous story beat"
        >
          ‹
        </Control>
        <Control variant="secondary" onClick={() => setPaused(!paused)} aria-pressed={paused}>
          {paused ? 'Resume' : 'Pause'}
        </Control>
        <Control
          variant="secondary"
          disabled={active >= count - 1}
          onClick={() => go(active + 1)}
          aria-label="Next story beat"
        >
          ›
        </Control>
        <Control variant="text" onClick={() => go(0)} aria-label="Return to story beginning">
          ↺
        </Control>
        {seatControl}
        {returnDetail && (
          <Control variant="text" onClick={() => setDetail(returnDetail)}>
            Back to example record
          </Control>
        )}
        <Hidden role="status" aria-live="polite">
          {announcement}
        </Hidden>
      </Controls>
      <Hero
        ref={(node) => {
          nodes.current[0] = node;
        }}
      >
        {hero}
      </Hero>
      <Visual $rows={shots.length + 1}>
        {renderVisual({ progress, paused: paused || detail !== null, reducedMotion })}
      </Visual>
      {shots.map((shot) => {
        const start = offset;
        offset += shot.beats.length;
        return (
          <Shot key={shot.id} id={shot.id}>
            {shot.eyebrow && <Eyebrow>{shot.eyebrow}</Eyebrow>}
            <Title tabIndex={-1}>{shot.title}</Title>
            {shot.beats.map((beat, index) => (
              <Beat
                key={beat.label}
                ref={(node) => {
                  nodes.current[start + index] = node;
                }}
              >
                <BeatTitle id={`${shot.id}-beat-${index + 1}`} tabIndex={-1}>
                  {beat.label}
                </BeatTitle>
                {beat.content}
              </Beat>
            ))}
            {shot.details &&
              (enhanced ? (
                <Control variant="secondary" onClick={() => setDetail(shot)}>
                  {shot.detailLabel ?? 'Read the example details'}
                </Control>
              ) : (
                <details>
                  <summary>{shot.detailLabel ?? 'Read the example details'}</summary>
                  {shot.details}
                </details>
              ))}
          </Shot>
        );
      })}
      <Modal
        open={detail !== null}
        title={detail?.detailLabel ?? 'Example details'}
        onClose={() => setDetail(null)}
        placement="bottom"
        footer={<></>}
        width="min(720px, 100%)"
      >
        <div
          onClick={(event) => {
            const anchor = (event.target as HTMLElement).closest('a[href^="#"]');
            const id = anchor?.getAttribute('href')?.slice(1);
            const target = id ? document.getElementById(id) : null;
            if (!target) return;
            event.preventDefault();
            setReturnDetail(detail);
            setDetail(null);
            requestAnimationFrame(() => {
              target.scrollIntoView({ behavior: 'auto', block: 'start' });
              target.setAttribute('tabindex', '-1');
              target.focus({ preventScroll: true });
            });
          }}
        >
          {detail?.details}
        </div>
      </Modal>
    </Root>
  );
}
