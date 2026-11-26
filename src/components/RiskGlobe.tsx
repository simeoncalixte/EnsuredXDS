import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';
import { spacing, typography } from '../tokens.js';
import { land } from './riskGlobe/land.js';
import type { GlobeFrame, GlobeMarker, GlobeSeat, GlobeLabel } from './riskGlobe/types.js';
import type { createGlobeRenderer } from './riskGlobe/renderer.js';
export type { GlobeMarker, GlobeSeat } from './riskGlobe/types.js';
export type RiskGlobeProps = {
  /** Normalized native-scroll progress for the combined hero and film (0..1). */
  progress: number;
  seat?: GlobeSeat;
  markers?: readonly GlobeMarker[];
  paused?: boolean;
  reducedMotion?: boolean;
  quality?: 'auto' | 'high' | 'low';
  /** Force the readable static fallback (e.g. WebGL unavailable). */
  fallback?: boolean;
  caption?: string;
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
  height: clamp(300px, 62vh, 720px);
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
const ProjectedLabel = styled.span<{ $x: number; $y: number }>`
  position: absolute;
  left: ${({ $x }) => $x}px;
  top: ${({ $y }) => $y}px;
  padding: 3px 6px;
  max-width: calc(100% - 24px);
  background: ${colors.surface};
  color: ${colors.text.primary};
  border: 1px solid ${colors.outlineVariant};
  font: 400 0.875rem/1.3 ${typography.bodyFamily};
  pointer-events: none;
`;
const Legend = styled.figcaption`
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
const defaultMarkers: readonly GlobeMarker[] = [];
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
  paused = false,
  reducedMotion = false,
  quality = 'auto',
  fallback = false,
  caption = 'Example data. Dots are submission origins; diamonds are sample providers.',
  className,
}: RiskGlobeProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<ReturnType<typeof createGlobeRenderer> | null>(null);
  const requestDraw = useRef<(() => void) | null>(null);
  const latest = useRef<GlobeFrame>({ progress, seat, reducedMotion, markers });
  const [ready, setReady] = useState(false);
  const [labels, setLabels] = useState<GlobeLabel[]>([]);
  useEffect(() => {
    if (!paused) latest.current = { progress, seat, reducedMotion, markers };
    if (!paused) requestDraw.current?.();
  }, [progress, seat, reducedMotion, markers, paused]);
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
    const load = async () => {
      try {
        const { createGlobeRenderer } = await import('./riskGlobe/renderer.js');
        if (disposed) return;
        const style = getComputedStyle(node);
        const value = (name: string) => style.getPropertyValue(name).trim();
        controller.current = createGlobeRenderer(
          node,
          {
            surface: value('--xds-surface'),
            outline: value('--xds-outline-variant'),
            land: value('--xds-secondary'),
            origin: value('--xds-primary'),
            provider: value('--xds-secondary'),
            text: value('--xds-on-surface'),
          },
          quality === 'low' || (quality === 'auto' && navigator.hardwareConcurrency <= 4),
          setLabels,
        );
        draw();
        setReady(true);
      } catch {
        if (!disposed) setReady(false);
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
      observer.disconnect();
      node.removeEventListener('webglcontextlost', lost);
      document.removeEventListener('visibilitychange', schedule);
      media.removeEventListener('change', schedule);
      controller.current?.dispose();
      controller.current = null;
    };
  }, [quality, fallback]);
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
          <div aria-hidden="true">
            {labels.map((label) => (
              <ProjectedLabel key={label.id} $x={label.x} $y={label.y}>
                {label.text}
              </ProjectedLabel>
            ))}
          </div>
        )}
      </Stage>
      <Legend>
        <span>{caption}</span>
        <Steps aria-label="Illustrative workflow steps">
          <li>Intake</li>
          <li>Structure</li>
          <li>Readiness</li>
          <li>Match: broker chooses</li>
          <li>Bind by the carrier</li>
        </Steps>
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
      </Legend>
    </Figure>
  );
}
