import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within, waitFor } from '@storybook/test';
import ScrollFilm, { type ScrollFilmProps } from '../../components/ScrollFilm.js';
import Button from '../../components/Button.js';
import { PageSubtitle } from '../../components/Typography.js';
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

export const ResponsiveDetails: Story = {
  args: {
    detailMode: 'responsive',
    shots: [
      { ...shots[0], details: <a href="#mechanics-beat-2">Return to the draft</a> },
      shots[1],
    ],
  },
  render: (args) => (
    <ScrollFilm
      {...args}
      hero={<h1>Scroll-driven example</h1>}
      seatControl={<Button>Broker</Button>}
      renderVisual={(frame) => {
        const shot = args.shots[frame.shotIndex];
        return (
          <RiskGlobe
            {...frame}
            detail={
              shot?.details
                ? { title: shot.detailLabel ?? 'Example details', content: shot.details }
                : undefined
            }
          />
        );
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Next story beat' }));
    const controls = c.getByRole('group', { name: 'Scroll story controls' });
    await expect(controls.getBoundingClientRect().height).toBeLessThanOrEqual(64);
    if (window.innerWidth < 600) {
      const trigger = await c.findByRole('button', { name: 'View example source fields' });
      await userEvent.click(trigger);
      await expect(within(document.body).getByRole('dialog')).toBeVisible();
      await userEvent.keyboard('{Escape}');
      await expect(trigger).toHaveFocus();
    } else {
      await waitFor(() =>
        expect(c.getByRole('heading', { name: 'View example source fields' })).toBeVisible(),
      );
      if (window.innerWidth >= 1100)
        await waitFor(() => expect(c.getByText(/^(PLATFORM|PERSON) ·/)).toBeVisible());
      const link = c.getByRole('link', { name: 'Return to the draft' });
      await userEvent.click(link);
      await waitFor(() => expect(c.getByRole('heading', { name: 'Platform' })).toHaveFocus());
    }
  },
};

export const StaticFallback: Story = {
  args: {
    staticFallback: true,
    narrowVisualPlacement: 'inline',
    narrowPagination: true,
    shots: shots.map((shot) => ({
      ...shot,
      posterSrc:
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900"%3E%3Ccircle cx="720" cy="450" r="300" fill="%2397B8C3"/%3E%3C/svg%3E',
      posterAlt: `Still: ${shot.title}`,
    })),
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.getAllByRole('img')).toHaveLength(2);
    await expect(c.getByText('The client approves D v2.')).toBeVisible();
    await expect(c.getByRole('heading', { name: 'A person confirms the draft' })).toBeVisible();
  },
};

export const ConnectedPanels: Story = {
  args: {
    composition: 'connected',
    shots: [
      {
        ...shots[0],
        beats: [
          {
            ...shots[0].beats[0],
            content: <PageSubtitle>Example documents arrive with missing fields.</PageSubtitle>,
          },
          ...shots[0].beats.slice(1),
        ],
      },
      shots[1],
    ],
  },
  render: (args) => (
    <ScrollFilm {...args} renderVisual={(frame) => <RiskGlobe {...frame} showLegend={false} />} />
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const copy = canvasElement.querySelector('[data-film-copy]')!;
    const visual = canvasElement.querySelector('[data-film-visual]')!;
    if (innerWidth >= 1100) {
      const overlap = copy.getBoundingClientRect().right - visual.getBoundingClientRect().left;
      await expect(overlap).toBeGreaterThanOrEqual(48);
      await expect(overlap).toBeLessThanOrEqual(96);
    }
    await userEvent.click(c.getByRole('button', { name: 'Next story beat' }));
    await waitFor(() => expect(c.getByRole('heading', { name: 'Setup' })).toHaveFocus());
    const paragraph = c.getByText('Example documents arrive with missing fields.');
    await expect(parseFloat(getComputedStyle(paragraph).fontSize)).toBeGreaterThanOrEqual(20);
    await expect(parseFloat(getComputedStyle(paragraph).lineHeight)).toBeGreaterThanOrEqual(30);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(innerWidth);
    await expect(canvasElement.querySelectorAll('canvas')).toHaveLength(1);
  },
};

export const InlineNarrowJourney: Story = {
  args: { narrowVisualPlacement: 'inline', detailMode: 'responsive', composition: 'connected' },
  render: (args) => (
    <ScrollFilm {...args} renderVisual={(frame) => <RiskGlobe {...frame} showLegend={false} />} />
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const canvas = canvasElement.querySelector('canvas');
    const visual = canvasElement.querySelector<HTMLElement>('[data-film-visual]')!;
    await waitFor(() => expect(canvas).toHaveAttribute('data-renderer-ready', 'true'), {
      timeout: 15000,
    });
    const slot = canvasElement.querySelector<HTMLElement>('[data-film-visual-slot="mechanics"]')!;
    if (innerWidth >= 1100) {
      await expect(getComputedStyle(visual).position).toBe('sticky');
      await expect(slot.getBoundingClientRect().height).toBe(0);
    } else {
      slot.scrollIntoView({ block: 'center' });
      await waitFor(() => expect(visual.dataset.inlineSlot).toBe('mechanics'));
      await expect(getComputedStyle(visual).position).toBe('absolute');
      await waitFor(() =>
        expect(
          Math.abs(visual.getBoundingClientRect().top - slot.getBoundingClientRect().top),
        ).toBeLessThan(2),
      );
      await expect(
        c.getByText('Example documents arrive with missing fields.').getBoundingClientRect().bottom,
      ).toBeLessThanOrEqual(slot.getBoundingClientRect().top);
      await expect(
        c.getByText('AI structures a draft and flags the gaps.').getBoundingClientRect().top,
      ).toBeGreaterThanOrEqual(slot.getBoundingClientRect().bottom);
      const top = visual.getBoundingClientRect().top;
      window.scrollBy(0, 80);
      await waitFor(() =>
        expect(Math.abs(visual.getBoundingClientRect().top - (top - 80))).toBeLessThan(2),
      );
      if (innerWidth < 600) {
        await userEvent.click(c.getByRole('button', { name: 'View example source fields' }));
        await expect(within(document.body).getByRole('dialog')).toBeVisible();
        await userEvent.keyboard('{Escape}');
        await expect(c.getByRole('button', { name: 'View example source fields' })).toHaveFocus();
      }
    }
    await expect(canvasElement.querySelector('canvas')).toBe(canvas);
    await expect(canvasElement.querySelectorAll('canvas')).toHaveLength(1);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(innerWidth);
  },
};

export const PageScrollJourney: Story = {
  ...InlineNarrowJourney,
  args: { ...InlineNarrowJourney.args, narrowPagination: true },
  render: (args) => (
    <>
      <header style={{ minHeight: 180 }}>Synthetic host header</header>
      <ScrollFilm {...args} renderVisual={(frame) => <RiskGlobe {...frame} showLegend={false} />} />
      <footer style={{ minHeight: 300 }}>Synthetic host footer</footer>
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = canvasElement.querySelector('canvas');
    await waitFor(() => expect(canvas).toHaveAttribute('data-renderer-ready', 'true'), {
      timeout: 15000,
    });
    const first = document.getElementById('mechanics')!;
    const next = document.getElementById('reserves')!;
    if (innerWidth < 1100) {
      const root = canvasElement.querySelector<HTMLElement>('[data-film-pagination="pages"]')!;
      first.scrollIntoView({ block: 'start' });
      await waitFor(() =>
        expect(getComputedStyle(document.documentElement).scrollSnapType).toBe('y mandatory'),
      );
      const readingTop = parseFloat(root.style.getPropertyValue('--film-reading-top'));
      await expect(first.getBoundingClientRect().height).toBeGreaterThanOrEqual(
        innerHeight - readingTop - 1,
      );
      const slot = first.querySelector<HTMLElement>('[data-film-visual-slot]')!;
      await expect(slot.getBoundingClientRect().top).toBeGreaterThan(
        first.getBoundingClientRect().top,
      );
      await expect(slot.getBoundingClientRect().bottom).toBeLessThan(
        first.getBoundingClientRect().bottom,
      );
      window.scrollBy(0, first.getBoundingClientRect().height * 0.8);
      await waitFor(() =>
        expect(Math.abs(next.getBoundingClientRect().top - readingTop)).toBeLessThan(2),
      );
      window.scrollBy(0, -first.getBoundingClientRect().height * 0.8);
      await waitFor(() =>
        expect(Math.abs(first.getBoundingClientRect().top - readingTop)).toBeLessThan(2),
      );
      await waitFor(() =>
        expect(
          getComputedStyle(
            within(canvasElement).getByRole('button', { name: 'View example source fields' }),
          ).pointerEvents,
        ).not.toBe('none'),
      );
      await userEvent.click(
        within(canvasElement).getByRole('button', { name: 'View example source fields' }),
      );
      await expect(within(document.body).getByRole('dialog')).toBeVisible();
      await expect(getComputedStyle(document.documentElement).scrollSnapType).toBe('none');
      await userEvent.keyboard('{Escape}');
      await expect(
        within(canvasElement).getByRole('button', { name: 'View example source fields' }),
      ).toHaveFocus();
    } else {
      await expect(getComputedStyle(document.documentElement).scrollSnapType).toBe('none');
      await expect(
        getComputedStyle(canvasElement.querySelector('[data-film-visual]')!).position,
      ).toBe('sticky');
    }
    await expect(canvasElement.querySelector('canvas')).toBe(canvas);
    await expect(canvasElement.querySelectorAll('canvas')).toHaveLength(1);
    window.scrollTo(0, 0);
    await waitFor(() => expect(window.scrollY).toBe(0));
    const footer = within(canvasElement).getByText('Synthetic host footer');
    footer.scrollIntoView({ block: 'end' });
    await waitFor(() =>
      expect(footer.getBoundingClientRect().bottom).toBeLessThanOrEqual(innerHeight + 1),
    );
    await waitFor(() =>
      expect(getComputedStyle(document.documentElement).scrollSnapType).toBe('none'),
    );
  },
};

export const OverflowingPage: Story = {
  ...PageScrollJourney,
  args: {
    ...PageScrollJourney.args,
    shots: shots.map((shot) => ({
      ...shot,
      beats: shot.beats.map((beat) => ({
        ...beat,
        content: (
          <>
            <p>
              {Array(4)
                .fill(
                  'This synthetic example keeps the full explanation readable when text is enlarged or the viewport is short.',
                )
                .join(' ')}
            </p>
            {beat.content}
          </>
        ),
      })),
    })),
  },
  play: async ({ canvasElement }) => {
    const target = document.getElementById('mechanics-beat-3')!;
    target.scrollIntoView({ block: 'start' });
    target.focus({ preventScroll: true });
    await waitFor(() => expect(target.getBoundingClientRect().top).toBeGreaterThanOrEqual(0));
    await expect(target.getBoundingClientRect().bottom).toBeLessThanOrEqual(innerHeight);
    await expect(target).toHaveFocus();
    await expect(
      within(canvasElement).getByText('A broker confirms the values before sharing.'),
    ).toBeVisible();
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(innerWidth);
  },
};

export const PagedKeyboardTargets: Story = {
  ...PageScrollJourney,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    for (let index = 0; index < 4; index++) {
      await userEvent.click(c.getByRole('button', { name: 'Next story beat' }));
      await waitFor(() => expect(document.activeElement?.tagName).toBe('H3'));
      await waitFor(() => {
        const rect = document.activeElement!.getBoundingClientRect();
        expect(rect.top).toBeGreaterThanOrEqual(0);
        expect(rect.bottom).toBeLessThanOrEqual(innerHeight);
      });
    }
    if (innerWidth < 1100) {
      await expect(getComputedStyle(document.documentElement).scrollSnapType).toBe('none');
      // A native input resumes CSS snapping; it never drives JS scrolling.
      window.dispatchEvent(new WheelEvent('wheel'));
      await waitFor(() =>
        expect(canvasElement.querySelector('[data-film-pagination]')).not.toHaveAttribute(
          'data-film-target-navigation',
        ),
      );
    }
    await expect(canvasElement.querySelectorAll('canvas')).toHaveLength(1);
  },
};

export const SeamlessPageStage: Story = {
  ...PageScrollJourney,
  args: {
    ...PageScrollJourney.args,
    shots: shots.map((shot) => ({
      ...shot,
      posterSrc: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E',
    })),
  },
  play: async ({ canvasElement }) => {
    const canvas = canvasElement.querySelector('canvas');
    await waitFor(() => expect(canvas).toHaveAttribute('data-renderer-ready', 'true'), {
      timeout: 15000,
    });
    await expect(canvasElement.querySelectorAll('[data-film-slot-still]')).toHaveLength(0);
    if (innerWidth < 1100) {
      const root = canvasElement.querySelector<HTMLElement>('[data-film-pagination]')!;
      const visual = canvasElement.querySelector<HTMLElement>('[data-film-visual]')!;
      const hero = canvasElement.querySelector<HTMLElement>('[data-film-page="hero"]')!;
      const heroSlot = hero.querySelector<HTMLElement>('[data-film-inline-slot]')!;
      const heroCopy = heroSlot.previousElementSibling!;
      await expect(getComputedStyle(hero).justifyContent).toBe('center');
      await expect(
        heroSlot.getBoundingClientRect().top -
          heroCopy.getBoundingClientRect().bottom -
          parseFloat(getComputedStyle(heroCopy).marginBottom),
      ).toBeLessThanOrEqual(32);
      const first = document.getElementById('mechanics')!;
      const next = document.getElementById('reserves')!;
      // Sample native scroll positions independently of the browser's snap settling.
      const oldSnap = document.documentElement.style.scrollSnapType;
      document.documentElement.style.scrollSnapType = 'none';
      try {
        const readingTop = parseFloat(root.style.getPropertyValue('--film-reading-top'));
        const start = first.getBoundingClientRect().top + scrollY - readingTop;
        const end = next.getBoundingClientRect().top + scrollY - readingTop;
        const positions: number[] = [];
        for (const part of [0, 0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25, 0]) {
          scrollTo(0, start + (end - start) * part);
          await new Promise<void>((done) =>
            requestAnimationFrame(() => requestAnimationFrame(() => done())),
          );
          positions.push(visual.getBoundingClientRect().top + scrollY);
          if (part === 0.5)
            await expect(getComputedStyle(first.querySelector('h2')!).opacity).toBe('0');
          if (part === 0)
            await expect(getComputedStyle(first.querySelector('h2')!).opacity).toBe('1');
          await expect(canvasElement.querySelector('canvas')).toBe(canvas);
        }
        for (let index = 1; index < 4; index++) {
          await expect(
            Math.abs(
              positions[index] - (positions[0] + ((positions[4] - positions[0]) * index) / 4),
            ),
          ).toBeLessThan(3);
          await expect(Math.abs(positions[index] - positions[8 - index])).toBeLessThan(3);
        }
        await expect(canvasElement.querySelectorAll('canvas')).toHaveLength(1);
      } finally {
        document.documentElement.style.scrollSnapType = oldSnap;
      }
    }
  },
};
