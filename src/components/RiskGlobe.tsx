import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { LinkButton } from './Button.js';
import { colors } from '../colors.js';
import { spacing, typography } from '../tokens.js';
import { land } from './riskGlobe/land.js';
import type {
  GlobeFrame,
  GlobeMarker,
  GlobeSeat,
  GlobeLabel,
  GlobeRecord,
} from './riskGlobe/types.js';
import type { createGlobeRenderer } from './riskGlobe/renderer.js';
export type { GlobeMarker, GlobeSeat, GlobeRecord } from './riskGlobe/types.js';
export type RiskGlobeProps = {
  /** Normalized native-scroll progress for the combined hero and film (0..1). */
  progress: number;
  seat?: GlobeSeat;
  markers?: readonly GlobeMarker[];
  records?: readonly GlobeRecord[];
  paused?: boolean;
  reducedMotion?: boolean;
  quality?: 'auto' | 'high' | 'low';
  /** Force the readable static fallback (e.g. WebGL unavailable). */
  fallback?: boolean;
  onAvailability?: (available: boolean) => void;
  caption?: string;
  /** Keep semantic equivalents without the redundant visible footer legend. */
  showLegend?: boolean;
  detail?: { title: string; content: React.ReactNode };
  className?: string;
};
const Figure = styled.figure`
  margin: 0;
  min-width: 0;
`;
const Stage = styled.div`
  position: relative;
  isolation: isolate;
  margin: 0;
  min-width: 0;
  height: clamp(350px, calc(100vh - 180px), 900px);
  @media (min-width: 600px) and (max-width: 1099px) {
    height: var(--film-page-stage-height, 58vh);
  }
  @media (max-width: 599px) {
    height: var(--film-page-stage-height, clamp(240px, 46vh, 440px));
  }
  overflow: hidden;
  background: ${colors.surface};
  color: ${colors.text.primary};
  font-family: ${typography.bodyFamily};
`;
const Canvas = styled.canvas<{ $ready: boolean }>`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  visibility: ${({ $ready }) => ($ready ? 'visible' : 'hidden')};
`;
const Poster = styled.svg<{ $ready: boolean }>`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  visibility: ${({ $ready }) => ($ready ? 'hidden' : 'visible')};
`;
const ProjectedLabel = styled.span<{ $x: number; $y: number; $width?: number; $kind?: string }>`
  position: absolute;
  left: ${({ $x }) => $x}px;
  top: ${({ $y }) => $y}px;
  padding: 3px 6px;
  max-width: calc(100% - 24px);
  background: ${colors.surface};
  color: ${colors.text.primary};
  border: 1px ${({ $kind }) => ($kind === 'platform' ? 'dashed' : 'solid')} ${colors.outlineVariant};
  width: ${({ $width }) => ($width ? `${$width}px` : 'auto')};
  box-sizing: border-box;
  font: 400 0.875rem/1.3 ${typography.bodyFamily};
  pointer-events: none;
`;
const RecordLink = styled(LinkButton)<{ $x: number; $y: number }>`
  position: absolute;
  left: ${({ $x }) => $x}px;
  top: ${({ $y }) => $y}px;
  min-width: 44px;
  justify-content: center;
`;
const Legend = styled.figcaption<{ $hidden: boolean }>`
  ${({ $hidden }) => ($hidden ? 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;' : '')}
  background: ${colors.surface};
  padding: ${spacing.sm}px;
  display: grid;
  gap: ${spacing.xs}px;
  font-size: ${typography.sizes.sm}px;
  line-height: 1.5;
`;
const Steps = styled.ol`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing.sm}px ${spacing.lg}px;
  margin: 0;
  padding-inline-start: ${spacing.lg}px;
`;
const DetailLeader = styled.svg`
  display: none;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  @media (min-width: 1100px) {
    display: block;
  }
`;
const DetailCard = styled.aside<{ $left: number; $top: number }>`
  display: none;
  @media (min-width: 1100px) {
    display: block;
    position: absolute;
    left: ${({ $left }) => $left}px;
    top: ${({ $top }) => $top}px;
    width: min(360px, 48%);
    max-height: 65%;
    overflow: auto;
    &:focus-visible {
      outline: 2px solid ${colors.primary};
      outline-offset: 2px;
    }
    box-sizing: border-box;
    padding: 16px;
    background: ${colors.surface};
    border: 1px dashed ${colors.outlineVariant};
    color: ${colors.text.primary};
    font-family: ${typography.bodyFamily};
  }
`;
const defaultMarkers: readonly GlobeMarker[] = [];
const defaultRecords: readonly GlobeRecord[] = [];
const posterPath = land
  .flatMap(([lon, lat]) => {
    const a = (lat * Math.PI) / 180,
      b = ((lon + 30) * Math.PI) / 180;
    if (Math.cos(a) * Math.cos(b) < 0) return [];
    return [
      `M${(300 + 200 * Math.cos(a) * Math.sin(b)).toFixed(1)} ${(235 - 200 * Math.sin(a)).toFixed(1)}h.1`,
    ];
  })
  .join(' ');
/** One renderer, shared for the whole homepage. The renderer only draws on prop,
 * resize or visibility changes; it never advances progress by elapsed time. */
export default function RiskGlobe({
  progress,
  seat = 'everyone',
  markers = defaultMarkers,
  records = defaultRecords,
  paused = false,
  reducedMotion = false,
  quality = 'auto',
  fallback = false,
  onAvailability,
  detail,
  caption = 'Example data. Dots are submission origins; diamonds are sample providers.',
  showLegend = true,
  className,
}: RiskGlobeProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const availability = useRef(onAvailability);
  useEffect(() => {
    availability.current = onAvailability;
  }, [onAvailability]);
  const controller = useRef<ReturnType<typeof createGlobeRenderer> | null>(null);
  const requestDraw = useRef<(() => void) | null>(null);
  const hasDetail = Boolean(detail);
  const latest = useRef<GlobeFrame>({ progress, seat, reducedMotion, markers, hasDetail, records });
  const [ready, setReady] = useState(false);
  const [labels, setLabels] = useState<GlobeLabel[]>([]);
  useEffect(() => {
    if (!paused) latest.current = { progress, seat, reducedMotion, markers, hasDetail, records };
    if (!paused) requestDraw.current?.();
  }, [progress, seat, reducedMotion, markers, paused, hasDetail, records]);
  useEffect(() => {
    const node = canvas.current;
    if (!node || fallback) return;
    let disposed = false;
    let visible = true;
    let frame = 0;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const draw = () => {
      frame = 0;
      if (!disposed && visible && !document.hidden) {
        const value = latest.current;
        controller.current?.update({
          ...value,
          reducedMotion: value.reducedMotion || media.matches,
        });
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    requestDraw.current = schedule;
    const readPalette = () => {
      const style = getComputedStyle(node);
      const value = (name: string) => style.getPropertyValue(name).trim();
      return {
        surface: value('--xds-surface'),
        outline: value('--xds-outline-variant'),
        land: value('--xds-secondary'),
        origin: value('--xds-primary'),
        provider: value('--xds-secondary'),
        text: value('--xds-on-surface'),
      };
    };
    const themeObserver = new MutationObserver(() => {
      controller.current?.setPalette(readPalette());
      schedule();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style'],
    });
    const load = async () => {
      try {
        const { createGlobeRenderer } = await import('./riskGlobe/renderer.js');
        if (disposed) return;
        controller.current = createGlobeRenderer(
          node,
          readPalette(),
          quality === 'low' || (quality === 'auto' && navigator.hardwareConcurrency <= 4),
          setLabels,
        );
        draw();
        setReady(true);
        availability.current?.(true);
      } catch {
        if (!disposed) {
          setReady(false);
          availability.current?.(false);
        }
      }
    };
    // Delay only resource initialization until after paint. It does not advance motion.
    const idle = window.setTimeout(() => void load(), 0);
    const resize = new ResizeObserver(schedule);
    resize.observe(node);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
    });
    observer.observe(node);
    const lost = (event: Event) => {
      event.preventDefault();
      setReady(false);
      availability.current?.(false);
    };
    node.addEventListener('webglcontextlost', lost);
    document.addEventListener('visibilitychange', schedule);
    media.addEventListener('change', schedule);
    return () => {
      disposed = true;
      requestDraw.current = null;
      clearTimeout(idle);
      cancelAnimationFrame(frame);
      resize.disconnect();
      themeObserver.disconnect();
      observer.disconnect();
      node.removeEventListener('webglcontextlost', lost);
      document.removeEventListener('visibilitychange', schedule);
      media.removeEventListener('change', schedule);
      controller.current?.dispose();
      controller.current = null;
    };
  }, [quality, fallback]);
  const anchor = labels.find((label) => label.id === 'detail-anchor');
  const stageWidth = canvas.current?.clientWidth ?? 720;
  const stageHeight = canvas.current?.clientHeight ?? 720;
  const cardWidth = Math.min(360, stageWidth * 0.48);
  const cardLeft = Math.max(
    12,
    Math.min(
      stageWidth - cardWidth - 12,
      (anchor?.x ?? stageWidth / 2) > stageWidth / 2
        ? (anchor?.x ?? 0) - cardWidth - 32
        : (anchor?.x ?? 0) + 32,
    ),
  );
  const cardTop = Math.max(64, Math.min(stageHeight * 0.35 - 24, (anchor?.y ?? 100) - 40));
  return (
    <Figure className={className} aria-label="Illustrative risk globe">
      <Stage>
        <Poster viewBox="0 0 600 500" $ready={ready && !fallback} aria-hidden="true">
          <circle cx="300" cy="235" r="200" fill={colors.surface} stroke={colors.outlineVariant} />
          <path
            d={posterPath}
            fill="none"
            stroke={colors.secondary}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <ellipse
            cx="300"
            cy="235"
            rx="245"
            ry="78"
            fill="none"
            stroke={colors.outlineVariant}
            strokeDasharray="4 5"
            transform="rotate(-28 300 235)"
          />
        </Poster>
        <Canvas
          ref={canvas}
          $ready={ready && !fallback}
          data-renderer-ready={ready && !fallback}
          aria-hidden="true"
        />
        {ready && !fallback && (
          <div data-film-detail>
            <svg
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            >
              {labels
                .filter((label) => label.kind === 'record')
                .map((label) => (
                  <line
                    key={label.id}
                    x1={label.anchorX}
                    y1={label.anchorY}
                    x2={label.x + 22}
                    y2={label.y + 22}
                    stroke={colors.outlineVariant}
                    strokeDasharray="3 3"
                  />
                ))}
            </svg>
            {labels
              .filter((label) => label.id !== 'detail-anchor')
              .map((label) =>
                label.kind === 'record' && label.targetId ? (
                  <RecordLink
                    key={label.id}
                    href={`#${label.targetId}`}
                    aria-label={label.accessibleLabel}
                    $x={label.x}
                    $y={label.y}
                    variant="secondary"
                  >
                    {label.text}
                  </RecordLink>
                ) : (
                  <ProjectedLabel
                    key={label.id}
                    $x={label.x}
                    $y={label.y}
                    $width={label.width}
                    $kind={label.kind}
                    aria-hidden="true"
                  >
                    {label.text}
                  </ProjectedLabel>
                ),
              )}
          </div>
        )}
        {detail && anchor && (
          <DetailLeader aria-hidden="true">
            <line
              x1={anchor.x}
              y1={anchor.y}
              x2={cardLeft + (anchor.x > cardLeft ? cardWidth : 0)}
              y2={cardTop + 24}
              stroke={colors.outlineVariant}
              strokeDasharray="4 4"
            />
          </DetailLeader>
        )}
        {detail && (
          <DetailCard
            $left={cardLeft}
            $top={cardTop}
            aria-label={detail.title}
            tabIndex={0}
            data-film-detail
          >
            <h3>{detail.title}</h3>
            {detail.content}
          </DetailCard>
        )}
      </Stage>
      <Legend $hidden={!showLegend} data-globe-legend={showLegend ? 'visible' : 'semantic'}>
        <span>{caption}</span>
        <Steps aria-label="Illustrative workflow steps">
          <li>Intake</li>
          <li>Structure</li>
          <li>Readiness</li>
          <li>Match: broker chooses</li>
          <li>Bind by the carrier</li>
        </Steps>
        {showLegend ? (
          <details>
            <summary>Example origins and sample providers</summary>
            <ul aria-label="Example origins and providers">
              {markers.map((marker) => (
                <li key={marker.id}>
                  {marker.label}
                  {marker.kind === 'provider'
                    ? marker.matched
                      ? ' · example appetite fit'
                      : ' · no example appetite fit'
                    : ''}
                </li>
              ))}
            </ul>
          </details>
        ) : (
          <ul aria-label="Example origins and providers">
            {markers.map((marker) => (
              <li key={marker.id}>
                {marker.label}
                {marker.matched ? ' · example appetite fit' : ''}
              </li>
            ))}
          </ul>
        )}
      </Legend>
    </Figure>
  );
}
