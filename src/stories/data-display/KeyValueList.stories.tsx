import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, expect } from '@storybook/test';
import KeyValueList, { type KeyValueListItem } from '../../components/KeyValueList.js';
import { cssVariables, xdsThemes, type XdsThemeName } from '../../palette.js';
import { colors } from '../../colors.js';
import { expectStoryViewport, storyViewport, storyViewports } from '../viewport.js';

/** Illustrative submission header fixture (AIN-280 detail screen). Not live data. */
const submission: KeyValueListItem[] = [
  { label: 'Reference', value: 'SUB-10482', type: 'mono' },
  { label: 'Line of business', value: 'Commercial property' },
  { label: 'Effective date', value: '2027-01-01', type: 'date-only' },
  { label: 'Form', value: 'Commercial property v3 (pinned)' },
  {
    label: 'Last updated',
    value: '23 Nov 2026, 10:42 EST by A. Okafor',
    dateTime: '2026-11-23T15:42:00Z',
  },
  { label: 'Underwriter', value: null },
];

const meta = {
  id: 'xds-key-value-list',
  title: 'Data Display/KeyValueList',
  component: KeyValueList,
  args: { items: submission, columns: 3 },
  parameters: { viewport: { viewports: storyViewports } },
} satisfies Meta<typeof KeyValueList>;
export default meta;
type Story = StoryObj<typeof meta>;

function ThemeFrame({ theme, children }: React.PropsWithChildren<{ theme: XdsThemeName }>) {
  return (
    <div
      data-theme={theme}
      style={{
        ...(cssVariables(xdsThemes[theme]) as React.CSSProperties),
        background: colors.background,
        color: colors.text.primary,
        padding: 24,
        boxSizing: 'border-box',
        maxWidth: '100%',
      }}
    >
      {children}
    </div>
  );
}

const themed = (theme: XdsThemeName) => [
  (StoryFn: React.ComponentType) => (
    <ThemeFrame theme={theme}>
      <StoryFn />
    </ThemeFrame>
  ),
];

const list = (canvasElement: HTMLElement) =>
  canvasElement.querySelector('[data-xds="key-value-list"]') as HTMLElement;

const columnCount = (element: HTMLElement) =>
  getComputedStyle(element)
    .gridTemplateColumns.split(' ')
    .filter((track) => track.trim() !== '').length;

export const SubmissionDetail: Story = {
  name: 'Submission detail (3 columns)',
  play: async ({ canvasElement }) => {
    const root = list(canvasElement);
    await expect(root.tagName).toBe('DL');
    // Every term has exactly one value, grouped in a div (valid dl content).
    await expect(root.querySelectorAll('dt')).toHaveLength(submission.length);
    await expect(root.querySelectorAll('dd')).toHaveLength(submission.length);
    for (const group of Array.from(root.children)) {
      await expect(group.tagName).toBe('DIV');
    }
    // Date-only value: formatted from the string, with the ISO day kept for machines.
    const effective = within(root).getByText('01 Jan 2027');
    await expect(effective.tagName).toBe('TIME');
    await expect(effective).toHaveAttribute('datetime', '2027-01-01');
    // Supplied datetime wraps the value in <time>.
    await expect(within(root).getByText(/by A\. Okafor/)).toHaveAttribute(
      'datetime',
      '2026-11-23T15:42:00Z',
    );
  },
};

export const EmptyValues: Story = {
  name: 'Empty values show —',
  args: {
    columns: 2,
    items: [
      { label: 'Insured', value: null },
      { label: 'Effective date', value: '', type: 'date-only' },
      { label: 'Broker', value: undefined },
      { label: 'Reference', value: 'SUB-10490', type: 'mono' },
    ],
  },
  play: async ({ canvasElement }) => {
    const empties = canvasElement.querySelectorAll('[data-empty="true"]');
    await expect(empties).toHaveLength(3);
    for (const empty of Array.from(empties)) {
      // Visible dash is hidden from assistive tech; "Not set" is read instead.
      await expect(empty.querySelector('[aria-hidden="true"]')?.textContent).toBe('—');
      await expect(empty.textContent).toContain('Not set');
    }
  },
};

export const InvalidDateStaysVisible: Story = {
  name: 'Invalid date-only value stays visible',
  args: {
    columns: 1,
    items: [
      { label: 'Effective date', value: '2027-02-30', type: 'date-only' },
      { label: 'Expiry date', value: '2028-01-01', type: 'date-only' },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Not a real day: shown as given, not hidden or shifted, and not wrapped in <time>.
    const invalid = canvas.getByText('2027-02-30');
    await expect(invalid.tagName).toBe('DD');
    await expect(canvas.getByText('01 Jan 2028').tagName).toBe('TIME');
  },
};

export const Loading: Story = {
  args: { loading: true, skeletonCount: 6 },
  play: async ({ canvasElement }) => {
    const root = list(canvasElement);
    await expect(root).toHaveAttribute('aria-busy', 'true');
    await expect(root).toHaveAttribute('data-state', 'loading');
    await expect(root.textContent).toContain('Loading details');
    // No values leak while loading, and the skeleton is hidden from assistive tech.
    await expect(root.querySelector('dd')).toBeNull();
    await expect(root.querySelector('[aria-hidden="true"]')?.children).toHaveLength(6);
  },
};

export const NoItems: Story = {
  name: 'Empty list',
  args: { items: [], emptyMessage: 'No captured answers in this section.' },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('No captured answers in this section.'),
    ).toBeVisible();
  },
};

type Width = 375 | 768 | 1440;
const themes: XdsThemeName[] = ['dark', 'light'];
const expectedColumns: Record<Width, number> = { 375: 1, 768: 2, 1440: 3 };

const responsive = (theme: XdsThemeName, width: Width): Story => ({
  name: `Submission detail · ${theme} · ${width} px`,
  decorators: themed(theme),
  parameters: storyViewport(width),
  play: async ({ canvasElement }) => {
    expectStoryViewport(width);
    const root = list(canvasElement);
    // 3 columns at 1024 px and up, 2 from 600 px, 1 below 600 px.
    await expect(columnCount(root)).toBe(expectedColumns[width]);
    await expect(within(root).getByText('01 Jan 2027')).toBeVisible();
  },
});

export const Dark375 = responsive(themes[0], 375);
export const Dark768 = responsive(themes[0], 768);
export const Dark1440 = responsive(themes[0], 1440);
export const Light375 = responsive(themes[1], 375);
export const Light768 = responsive(themes[1], 768);
export const Light1440 = responsive(themes[1], 1440);
