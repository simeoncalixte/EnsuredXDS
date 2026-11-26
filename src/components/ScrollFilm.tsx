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
  posterSrc?: string;
  posterAlt?: string;
};
export type ScrollFilmFrame = {
  progress: number;
  paused: boolean;
  reducedMotion: boolean;
  shotIndex: number;
  beatIndex: number;
};
export type ScrollFilmProps = {
  hero: React.ReactNode;
  shots: ScrollFilmShot[];
  renderVisual: (frame: ScrollFilmFrame) => React.ReactNode;
  seatControl?: React.ReactNode;
  reducedMotion?: boolean;
  detailMode?: 'dialog' | 'responsive';
  staticFallback?: boolean;
  /** Share a desktop overlap strip between the copy and visual panels. */
  composition?: 'split' | 'connected';
  className?: string;
};
const Root = styled.div<{ $static: boolean; $connected: boolean }>`
  display: grid;
  grid-template-columns: ${({ $static }) => ($static ? 'minmax(0,1fr)' : 'minmax(0,.9fr) minmax(0,1.4fr)')};
  gap: ${spacing.lg}px;
  ${({ $connected, $static }) =>
    $connected && !$static
      ? `
    @media (min-width: 1100px) {
      grid-template-columns: minmax(0, .9fr) 72px minmax(0, 1.4fr);
      column-gap: 0;
      & > [data-film-copy] { grid-column: 1 / 3; position: relative; z-index: 1; padding-right: 24px; }
      & > [data-film-visual] { grid-column: 2 / 4; }
      & > [data-film-copy] > * { position: relative; }
      & > [data-film-copy]::before {
        content: ''; position: absolute; inset: 0; pointer-events: none;
        background: linear-gradient(to right, ${colors.surface} 84%, transparent);
      }
    }
  `
      : ''}
  background: ${colors.surface};
  color: ${colors.text.primary};
  min-width: 0;
  font-family: ${typography.bodyFamily};
  @media (max-width: 1099px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
const Controls = styled.div<{ $compact: boolean }>`
  grid-column: 1/-1;
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  flex-wrap: ${({ $compact }) => ($compact ? 'nowrap' : 'wrap')};
  gap: 4px;
  background: ${colors.surface};
  padding: 8px;
  border-bottom: 1px solid ${colors.outlineVariant};
`;
const Control = styled(Button)`
  min-height: 44px;
  min-width: 44px;
`;
const Hero = styled.header`
  grid-column: 1;
  grid-row: 2;
  min-width: 0;
  scroll-margin-top: 80px;
`;
const Visual = styled.div<{ $rows: number; $static: boolean }>`
  display: ${({ $static }) => ($static ? 'none' : 'block')};
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
  @media (max-height: 650px) {
    position: relative;
    top: auto;
  }
`;
const Shot = styled.section`
  grid-column: 1;
  min-width: 0;
  scroll-margin-top: 80px;
  padding-block: ${spacing.xl}px;
  border-top: 1px solid ${colors.outlineVariant};
`;
const Still = styled.img`
  display: block;
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: contain;
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
const Beat = styled.div<{ $past: boolean; $active: boolean; $static: boolean }>`
  min-height: ${({ $static }) => ($static ? 'auto' : '40vh')};
  padding-block: ${spacing.lg}px;
  scroll-margin-top: 80px;
  line-height: 1.6;
  font-size: 1.25rem;
  color: ${colors.text.primary};
  & > p {
    font-size: inherit;
    line-height: inherit;
    color: inherit;
  }
  @media (max-width: 1099px) {
    min-height: ${({ $static }) => ($static ? 'auto' : '50vh')};
    scroll-margin-top: var(--film-reading-top, 55vh);
    font-size: ${({ $past, $static }) => ($past && !$static ? '1.125rem' : '1.25rem')};
    line-height: 1.5;
    & > p {
      font-size: inherit;
      line-height: inherit;
    }
    ${({ $past, $static }) => ($past && !$static ? 'h3,p{display:inline;}h3{margin-right:8px;}' : '')}
  }
`;
const BeatTitle = styled.h3`
  scroll-margin-top: var(--film-reading-top, 80px);
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
const InlineDetail = styled.div`
  display: none;
  @media (min-width: 600px) and (max-width: 1099px) {
    display: block;
  }
`;
const MobileActions = styled.div`
  display: none;
  @media (max-width: 599px) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    background: ${colors.surface};
    padding: 8px;
  }
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
  detailMode = 'dialog',
  staticFallback = false,
  composition = 'split',
  className,
}: ScrollFilmProps) {
  const nodes = useRef<(HTMLElement | null)[]>([]);
  const rootNode = useRef<HTMLDivElement>(null);
  const visualNode = useRef<HTMLDivElement>(null);
  const controlsNode = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [detail, setDetail] = useState<ScrollFilmShot | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [returnTarget, setReturnTarget] = useState('');
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
      const readingTop =
        window.innerWidth < 1100
          ? Math.min(
              window.innerHeight - 100,
              (controlsNode.current?.getBoundingClientRect().height ?? 64) +
                (window.innerHeight > 650
                  ? (visualNode.current?.getBoundingClientRect().height ?? 0)
                  : 0) +
                16,
            )
          : 80;
      rootNode.current?.style.setProperty('--film-reading-top', `${readingTop}px`);
      const line =
        window.innerWidth < 1100
          ? Math.max(window.innerHeight * 0.7, readingTop + 24)
          : window.innerHeight * 0.4;
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
    const resizeObserver = new ResizeObserver(schedule);
    if (visualNode.current) resizeObserver.observe(visualNode.current);
    if (controlsNode.current) resizeObserver.observe(controlsNode.current);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
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
    setAnnouncement(
      `Step ${bounded + 1} of ${count}: ${heading?.getAttribute('aria-label') ?? heading?.textContent ?? 'Introduction'}`,
    );
  };
  const shotIndex = Math.min(shots.length - 1, Math.floor(progress * (shots.length + 1)) - 1);
  const currentShot = shots[shotIndex];
  const beatIndex = Math.min(2, Math.floor(((progress * (shots.length + 1)) % 1) * 3));
  const staticStory =
    (reducedMotion || staticFallback || !enhanced) && shots.every((shot) => shot.posterSrc);
  let offset = 1;
  return (
    <Root
      ref={rootNode}
      className={className}
      $static={staticStory}
      $connected={composition === 'connected'}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
          return;
        const anchor = (event.target as HTMLElement).closest('[data-film-detail] a[href^="#"]');
        const id = anchor?.getAttribute('href')?.slice(1);
        const target = id ? document.getElementById(id) : null;
        if (!target || !currentShot) return;
        event.preventDefault();
        setReturnTarget(id!);
        setReturnDetail(currentShot);
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        target.focus({ preventScroll: true });
      }}
    >
      <Controls
        $compact={detailMode === 'responsive'}
        role="group"
        aria-label="Scroll story controls"
      >
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
        <Hidden role="status" aria-live="polite">
          {announcement}
        </Hidden>
      </Controls>
      <Hero
        data-film-copy
        ref={(node) => {
          nodes.current[0] = node;
        }}
      >
        {hero}
      </Hero>
      <Visual data-film-visual ref={visualNode} $rows={shots.length + 1} $static={staticStory}>
        {renderVisual({
          progress,
          paused: paused || detail !== null,
          reducedMotion,
          shotIndex,
          beatIndex,
        })}
        {detailMode === 'responsive' && enhanced && (
          <MobileActions>
            {currentShot?.details && (
              <Control variant="secondary" onClick={() => setDetail(currentShot)}>
                {currentShot.detailLabel ?? 'Read the example details'}
              </Control>
            )}
            {shotIndex >= 2 && (
              <Control
                variant="text"
                onClick={() => {
                  const node = document.getElementById(shots[shots.length - 1].id);
                  node?.scrollIntoView({ behavior: 'auto' });
                  node?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
                }}
              >
                Skip to the end · Request pilot access
              </Control>
            )}
          </MobileActions>
        )}
      </Visual>
      {shots.map((shot) => {
        const start = offset;
        offset += shot.beats.length;
        return (
          <Shot data-film-copy key={shot.id} id={shot.id}>
            {shot.eyebrow && <Eyebrow>{shot.eyebrow}</Eyebrow>}
            <Title tabIndex={-1}>{shot.title}</Title>
            {staticStory && shot.posterSrc && (
              <Still
                src={shot.posterSrc}
                alt={shot.posterAlt ?? ''}
                loading="lazy"
                width="1440"
                height="900"
              />
            )}
            {shot.beats.map((beat, index) => (
              <Beat
                key={beat.label}
                $past={start + index < active}
                $active={start + index === active}
                $static={!enhanced || reducedMotion || staticFallback}
                ref={(node) => {
                  nodes.current[start + index] = node;
                }}
              >
                <BeatTitle
                  aria-label={beat.label}
                  id={`${shot.id}-beat-${index + 1}`}
                  tabIndex={-1}
                >
                  {enhanced && !reducedMotion && start + index < active
                    ? '✓ '
                    : enhanced && !reducedMotion && start + index === active + 1
                      ? 'Next · '
                      : ''}
                  {beat.label}
                </BeatTitle>
                {beat.content}
                {returnDetail && returnTarget === `${shot.id}-beat-${index + 1}` && (
                  <Control variant="text" onClick={() => setDetail(returnDetail)}>
                    Back to example record
                  </Control>
                )}
              </Beat>
            ))}
            {shot.details &&
              (enhanced && detailMode === 'responsive' ? (
                <InlineDetail data-film-detail>
                  <h3>{shot.detailLabel ?? 'Example details'}</h3>
                  {shot.details}
                </InlineDetail>
              ) : enhanced ? (
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
            if (
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            const anchor = (event.target as HTMLElement).closest('a[href^="#"]');
            const id = anchor?.getAttribute('href')?.slice(1);
            const target = id ? document.getElementById(id) : null;
            if (!target) return;
            event.preventDefault();
            setReturnTarget(id!);
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
