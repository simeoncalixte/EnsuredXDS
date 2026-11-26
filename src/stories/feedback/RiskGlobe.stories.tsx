import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within, waitFor, fn } from '@storybook/test';
import RiskGlobe, { type GlobeMarker } from '../../components/RiskGlobe.js';
import ThemeToggle from '../../components/ThemeToggle.js';
import Button from '../../components/Button.js';
const markers: GlobeMarker[] = [
  { id: 'risk', label: 'Example US origin', longitude: -80, latitude: 26, kind: 'origin' },
  {
    id: 'c',
    label: 'Sample provider C · London market',
    longitude: 0,
    latitude: 51,
    kind: 'provider',
    matched: true,
  },
  {
    id: 'd',
    label: 'Sample provider D · Zurich market',
    longitude: 8,
    latitude: 47,
    kind: 'provider',
    matched: true,
  },
];
const meta = {
  title: 'Display/RiskGlobe',
  id: 'xds-risk-globe',
  component: RiskGlobe,
  args: { progress: 0, markers, onAvailability: fn() },
} satisfies Meta<typeof RiskGlobe>;
export default meta;
type Story = StoryObj<typeof meta>;
const assertMeaning = async (canvasElement: HTMLElement) => {
  const c = within(canvasElement);
  await expect(c.getByRole('figure', { name: 'Illustrative risk globe' })).toBeVisible();
  await expect(c.getByText('Bind by the carrier')).toBeVisible();
  await expect(
    within(c.getByRole('list', { name: 'Illustrative workflow steps' })).getAllByRole('listitem'),
  ).toHaveLength(5);
};
export const Hero: Story = { play: async ({ canvasElement }) => assertMeaning(canvasElement) };
export const Matched: Story = {
  args: { progress: 0.62 },
  play: async ({ canvasElement }) => assertMeaning(canvasElement),
};
export const NoFit: Story = {
  args: {
    markers: markers.map((m) => ({ ...m, matched: false })),
    caption: 'Example: no sample provider appetite fits yet. Nothing is quoted or bound here.',
  },
  play: async ({ canvasElement }) => {
    await assertMeaning(canvasElement);
    await expect(
      within(canvasElement).getByText(/no sample provider appetite fits yet/),
    ).toBeVisible();
  },
};
export const ReducedMotion: Story = {
  args: { reducedMotion: true, progress: 0.75 },
  play: async ({ canvasElement }) => assertMeaning(canvasElement),
};
export const PosterFallback: Story = {
  args: { fallback: true },
  play: async ({ canvasElement }) => {
    await assertMeaning(canvasElement);
    const canvas = canvasElement.querySelector('canvas');
    await expect(canvas).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas).not.toBeVisible();
  },
};
function Fixture() {
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  return (
    <>
      <Button onClick={() => setProgress(0.6)}>Show match scene</Button>
      <Button onClick={() => setPaused(!paused)}>
        {paused ? 'Resume scroll response' : 'Pause scroll response'}
      </Button>
      <RiskGlobe progress={progress} markers={markers} paused={paused} />
    </>
  );
}
export const OneCanvas: Story = {
  render: () => <Fixture />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const canvas = canvasElement.querySelector('canvas');
    await expect(canvas).not.toBeNull();
    await userEvent.click(c.getByRole('button', { name: 'Pause scroll response' }));
    await userEvent.click(c.getByRole('button', { name: 'Show match scene' }));
    await userEvent.click(c.getByRole('button', { name: 'Resume scroll response' }));
    await expect(canvasElement.querySelectorAll('canvas')).toHaveLength(1);
    await expect(canvasElement.querySelector('canvas')).toBe(canvas);
    await assertMeaning(canvasElement);
  },
};
export const Renderer: Story = {
  play: async ({ canvasElement }) => {
    await assertMeaning(canvasElement);
    // Canvas is intentionally decorative; inspect its readiness to distinguish a
    // successful WebGL run from the separately tested fallback.
    const canvas = canvasElement.querySelector('canvas');
    await waitFor(() => expect(canvas).toHaveAttribute('data-renderer-ready', 'true'), {
      timeout: 15000,
    });
    await expect(canvas).toBeVisible();
  },
};

function ScrollFixture() {
  const [progress, setProgress] = useState(0);
  React.useEffect(() => {
    const update = () => setProgress(Math.min(1, window.scrollY / Math.max(1, window.innerHeight)));
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);
  return (
    <div style={{ minHeight: '220vh' }}>
      <div style={{ position: 'sticky', top: 0 }}>
        <RiskGlobe progress={progress} markers={markers} />
        <output aria-label="Scroll progress">{progress.toFixed(2)}</output>
      </div>
    </div>
  );
}
export const ScrollDriven: Story = {
  render: () => <ScrollFixture />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    window.scrollTo(0, 0);
    await waitFor(() => expect(c.getByLabelText('Scroll progress')).toHaveTextContent('0.00'));
    await new Promise((resolve) => setTimeout(resolve, 160));
    await expect(c.getByLabelText('Scroll progress')).toHaveTextContent('0.00');
    window.scrollTo(0, window.innerHeight / 2);
    await waitFor(() => expect(c.getByLabelText('Scroll progress')).toHaveTextContent('0.50'));
    await expect(canvasElement.querySelectorAll('canvas')).toHaveLength(1);
    window.scrollTo(0, 0);
    await waitFor(() => expect(c.getByLabelText('Scroll progress')).toHaveTextContent('0.00'));
  },
};

export const ReadableMarkers: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByText('Example origins and sample providers'));
    await expect(
      c.getByText('Sample provider C · London market · example appetite fit'),
    ).toBeVisible();
    await expect(
      within(c.getByRole('list', { name: 'Example origins and providers' })).getByText(
        'Example US origin',
      ),
    ).toBeVisible();
  },
};

export const ThemeSwitch: Story = {
  render: (args) => (
    <>
      <ThemeToggle />
      <RiskGlobe {...args} />
    </>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const canvas = canvasElement.querySelector('canvas');
    await waitFor(() => expect(canvas).toHaveAttribute('data-renderer-ready', 'true'), {
      timeout: 15000,
    });
    await userEvent.click(c.getByRole('button', { name: 'Switch to light theme' }));
    await expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    await expect(canvasElement.querySelector('canvas')).toBe(canvas);
    await userEvent.click(c.getByRole('button', { name: 'Switch to dark theme' }));
    await expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  },
};

export const ProjectedRecord: Story = {
  args: {
    progress: 0.85,
    records: Array.from({ length: 10 }, (_, i) => ({
      label: `Synthetic decision ${i + 1}`,
      targetId: 'example-record-destination',
    })),
  },
  render: (args) => (
    <>
      <RiskGlobe {...args} />
      <h2 id="example-record-destination" tabIndex={-1}>
        Example record destination
      </h2>
    </>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await waitFor(
      () => expect(c.getAllByRole('link', { name: /Example record/ }).length).toBeGreaterThan(0),
      { timeout: 15000 },
    );
    await userEvent.click(c.getAllByRole('link', { name: /Example record/ })[0]);
    await expect(c.getByRole('heading', { name: 'Example record destination' })).toHaveFocus();
  },
};
