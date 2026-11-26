import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import PlaybackControls from '../../components/PlaybackControls.js';

const meta = {
  title: 'Feedback/PlaybackControls',
  id: 'xds-playback-controls',
  component: PlaybackControls,
  args: { playing: true, onPlayPause: fn(), onReplay: fn(), onSkip: fn(), intro: true },
} satisfies Meta<typeof PlaybackControls>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playing: Story = {
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Pause motion' }));
    await expect(args.onPlayPause).toHaveBeenCalledTimes(1);
    await userEvent.click(c.getByRole('button', { name: 'Skip intro' }));
    await expect(args.onSkip).toHaveBeenCalledTimes(1);
    await userEvent.click(c.getByRole('button', { name: 'Replay' }));
    await expect(args.onReplay).toHaveBeenCalledTimes(1);
  },
};
export const Paused: Story = {
  args: { playing: false, intro: false },
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    await expect(c.queryByRole('button', { name: 'Skip intro' })).toBeNull();
    await userEvent.click(c.getByRole('button', { name: 'Play motion' }));
    await expect(args.onPlayPause).toHaveBeenCalledTimes(1);
  },
};
function SteppingFixture({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [intro, setIntro] = useState(true);
  return (
    <PlaybackControls
      playing={playing}
      onPlayPause={() => setPlaying(!playing)}
      onReplay={() => {
        setStep(0);
        setIntro(true);
        setPlaying(true);
      }}
      onSkip={() => setIntro(false)}
      intro={intro}
      step={step}
      total={3}
      stepLabel={['Documents', 'Person confirms', 'Carrier binds'][step]}
      onPrev={() => setStep(step - 1)}
      onNext={() => setStep(step + 1)}
      reducedMotion={reducedMotion}
    />
  );
}
export const Stepping: Story = {
  render: () => <SteppingFixture />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const next = c.getByRole('button', { name: 'Next step' });
    const prev = c.getByRole('button', { name: 'Previous step' });
    await expect(prev).toBeDisabled();
    next.focus();
    await userEvent.keyboard('{Enter}');
    await expect(c.getByText('Person confirms')).toBeVisible();
    await expect(c.getByRole('status')).toHaveTextContent('Step 2 of 3');
    await userEvent.click(next);
    await expect(next).toBeDisabled();
    await userEvent.click(prev);
    await expect(c.getByText('Person confirms')).toBeVisible();
    await userEvent.click(c.getByRole('button', { name: 'Skip intro' }));
    await expect(c.queryByRole('button', { name: 'Skip intro' })).toBeNull();
    await userEvent.click(c.getByRole('button', { name: 'Replay' }));
    await expect(c.getByRole('button', { name: 'Skip intro' })).toBeVisible();
    await expect(prev).toBeDisabled();
  },
};
export const ReducedMotion: Story = {
  render: () => <SteppingFixture reducedMotion />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.queryByRole('button', { name: 'Pause motion' })).toBeNull();
    await expect(c.queryByRole('button', { name: 'Replay' })).toBeNull();
    await userEvent.click(c.getByRole('button', { name: 'Next step' }));
    await expect(c.getByText('Person confirms')).toBeVisible();
  },
};
