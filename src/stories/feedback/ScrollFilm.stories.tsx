import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within, waitFor } from '@storybook/test';
import ScrollFilm, { type ScrollFilmProps } from '../../components/ScrollFilm.js';
import Button from '../../components/Button.js';
import RiskGlobe from '../../components/RiskGlobe.js';
const shots = [
  {
    id: 'mechanics',
    title: 'A person confirms the draft',
    eyebrow: 'Example · Tue 09:12 ET',
    beats: [
      { label: 'Setup', content: <p>Example documents arrive with missing fields.</p> },
      { label: 'Platform', content: <p>AI structures a draft and flags the gaps.</p> },
      { label: 'Person', content: <p>A broker confirms the values before sharing.</p> },
    ],
    detailLabel: 'View example source fields',
    details: <p>Example source: page 2. Confirmed by the broker.</p>,
  },
  {
    id: 'reserves',
    title: 'The carrier binds version 2',
    beats: [
      { label: 'Client', content: <p>The client approves D v2.</p> },
      { label: 'Carrier', content: <p>An authorized carrier underwriter binds D v2.</p> },
      { label: 'Record', content: <p>The record preserves who decided each step.</p> },
    ],
  },
];
function Fixture(args: ScrollFilmProps) {
  const [seat, setSeat] = useState('Broker');
  return (
    <ScrollFilm
      {...args}
      hero={<h1 tabIndex={-1}>Illustrative workflow</h1>}
      seatControl={
        <>
          <Button onClick={() => setSeat(seat === 'Broker' ? 'Underwriter' : 'Broker')}>
            Change seat
          </Button>
          <p role="status">Now following: {seat}</p>
        </>
      }
      renderVisual={(frame) => (
        <div style={{ height: 260, background: 'var(--xds-surface-container)' }}>
          <output aria-label="Visual progress">{frame.progress.toFixed(3)}</output>
          <output aria-label="Visual paused">{String(frame.paused)}</output>
          <span>One persistent visual</span>
        </div>
      )}
    />
  );
}
const meta = {
  title: 'Display/ScrollFilm',
  id: 'xds-scroll-film',
  component: ScrollFilm,
  args: { hero: <h1>Example</h1>, shots, renderVisual: () => null },
  render: (args) => <Fixture {...args} />,
} satisfies Meta<typeof ScrollFilm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(
      c.getByRole('heading', { name: 'A person confirms the draft' }),
    ).toBeInTheDocument();
    await expect(
      c.getByRole('heading', { name: 'The carrier binds version 2' }),
    ).toBeInTheDocument();
  },
};
export const KeyboardSteps: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const next = c.getByRole('button', { name: 'Next story beat' });
    next.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(c.getByRole('heading', { name: 'Setup' })).toHaveFocus());
    await expect(c.getByRole('group', { name: 'Scroll story controls' })).toHaveTextContent(
      'Step 2 of 7',
    );
    await userEvent.click(c.getByRole('button', { name: 'Return to story beginning' }));
    await expect(c.getByRole('heading', { name: 'Illustrative workflow' })).toHaveFocus();
  },
};
export const SheetFocusReturn: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const trigger = c.getByRole('button', { name: 'View example source fields' });
    await userEvent.click(trigger);
    const dialog = within(document.body).getByRole('dialog', {
      name: 'View example source fields',
    });
    await expect(dialog).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus();
    await expect(c.getByLabelText('Visual paused')).toHaveTextContent('true');
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveFocus();
    await expect(within(document.body).queryByRole('dialog')).toBeNull();
    await expect(c.getByLabelText('Visual paused')).toHaveTextContent('false');
  },
};
export const SeatKeepsPlace: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const control = c.getByRole('button', { name: 'Change seat' });
    await userEvent.click(control);
    const scroll = window.scrollY;
    await userEvent.keyboard('{Enter}');
    await expect(control).toHaveFocus();
    await expect(window.scrollY).toBe(scroll);
    await expect(c.getByText('Now following: Broker')).toBeVisible();
  },
};
export const PauseDoesNotBlockReading: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Pause' }));
    await expect(c.getByLabelText('Visual paused')).toHaveTextContent('true');
    await expect(c.getByText('The client approves D v2.')).toBeInTheDocument();
    await userEvent.click(c.getByRole('button', { name: 'Resume' }));
    await expect(c.getByLabelText('Visual paused')).toHaveTextContent('false');
  },
};

export const SharedGlobe: Story = {
  render: (args) => (
    <ScrollFilm
      {...args}
      hero={<h1 tabIndex={-1}>One globe from introduction to record</h1>}
      renderVisual={(frame) => (
        <RiskGlobe
          {...frame}
          markers={[
            {
              id: 'origin',
              label: 'Example US origin',
              longitude: -80,
              latitude: 26,
              kind: 'origin',
            },
          ]}
        />
      )}
    />
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const canvas = canvasElement.querySelector('canvas');
    await waitFor(() => expect(canvas).toHaveAttribute('data-renderer-ready', 'true'), {
      timeout: 15000,
    });
    await userEvent.click(c.getByRole('button', { name: 'Next story beat' }));
    await expect(canvasElement.querySelectorAll('canvas')).toHaveLength(1);
    await expect(canvasElement.querySelector('canvas')).toBe(canvas);
    await expect(c.getByRole('heading', { name: 'Setup' })).toHaveFocus();
  },
};

export const OpenSheet: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'View example source fields' }));
    const dialog = within(document.body).getByRole('dialog', {
      name: 'View example source fields',
    });
    await expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus();
    await expect(Math.round(dialog.getBoundingClientRect().bottom)).toBe(window.innerHeight);
    await userEvent.tab();
    await expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus();
  },
};

export const RecordNavigation: Story = {
  args: {
    shots: [
      { ...shots[0], details: <a href="#mechanics-beat-2">Return to the AI draft</a> },
      shots[1],
    ],
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'View example source fields' }));
    await userEvent.click(
      within(document.body).getByRole('link', { name: 'Return to the AI draft' }),
    );
    await waitFor(() => expect(c.getByRole('heading', { name: 'Platform' })).toHaveFocus());
    await expect(within(document.body).queryByRole('dialog')).toBeNull();
    await userEvent.click(c.getByRole('button', { name: 'Back to example record' }));
    await expect(within(document.body).getByRole('dialog')).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect(c.getByRole('button', { name: 'Back to example record' })).toHaveFocus();
  },
};
