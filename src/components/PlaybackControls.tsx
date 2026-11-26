import React, { useState } from 'react';
import styled from 'styled-components';
import Button from './Button.js';
import { spacing } from '../tokens.js';

export type PlaybackControlsProps = {
  playing: boolean;
  onPlayPause: () => void;
  onReplay: () => void;
  onSkip?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  step?: number;
  total?: number;
  stepLabel?: string;
  reducedMotion?: boolean;
  intro?: boolean;
  labels?: {
    play?: string;
    pause?: string;
    replay?: string;
    skip?: string;
    previous?: string;
    next?: string;
  };
  className?: string;
};
const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${spacing.sm}px;
  min-width: 0;
`;
const Control = styled(Button)`
  min-width: 36px;
  min-height: 36px;
  @media (max-width: 899px) {
    min-width: 44px;
    min-height: 44px;
  }
`;
const AnimatedControl = styled(Control)`
  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;
const Announcement = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;
/** Controlled playback. Announcements are emitted only for user-initiated stepping. */
export default function PlaybackControls({
  playing,
  onPlayPause,
  onReplay,
  onSkip,
  onPrev,
  onNext,
  step = 0,
  total = 1,
  stepLabel,
  reducedMotion = false,
  intro = false,
  labels = {},
  className,
}: PlaybackControlsProps) {
  const [announcement, setAnnouncement] = useState('');
  const move = (delta: number, callback?: () => void) => {
    callback?.();
    setAnnouncement(`Step ${Math.max(1, Math.min(total, step + delta + 1))} of ${total}`);
  };
  return (
    <Row role="group" aria-label="Playback controls" className={className}>
      {!reducedMotion && (
        <>
          <AnimatedControl type="button" variant="secondary" onClick={onPlayPause}>
            {playing ? (labels.pause ?? 'Pause motion') : (labels.play ?? 'Play motion')}
          </AnimatedControl>
          {intro && onSkip && (
            <AnimatedControl type="button" variant="secondary" onClick={onSkip}>
              {labels.skip ?? 'Skip intro'}
            </AnimatedControl>
          )}
          <AnimatedControl type="button" variant="secondary" onClick={onReplay}>
            {labels.replay ?? 'Replay'}
          </AnimatedControl>
        </>
      )}
      {onPrev && (
        <Control
          type="button"
          variant="secondary"
          disabled={step <= 0}
          onClick={() => move(-1, onPrev)}
        >
          {labels.previous ?? 'Previous step'}
        </Control>
      )}
      {onNext && (
        <Control
          type="button"
          variant="secondary"
          disabled={step >= total - 1}
          onClick={() => move(1, onNext)}
        >
          {labels.next ?? 'Next step'}
        </Control>
      )}
      {stepLabel && <span>{stepLabel}</span>}
      <Announcement role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </Announcement>
    </Row>
  );
}
