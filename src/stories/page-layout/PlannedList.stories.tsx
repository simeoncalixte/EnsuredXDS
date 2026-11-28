import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import PlannedList, { type PlannedListItem } from '../../components/PlannedList.js';
import ResultMetricCard from '../../components/ResultMetricCard.js';
import ResultsPanel from '../../components/ResultsPanel.js';
import { cssVariables, xdsThemes, type XdsThemeName } from '../../palette.js';
import { colors } from '../../colors.js';
import { expectStoryViewport, storyViewport, storyViewports } from '../viewport.js';

/** Illustrative insurer-dashboard roadmap (AIN-297 Revision 2.1). Not live data. */
const planned: PlannedListItem[] = [
  {
    title: 'Bound premium',
    summary: 'Written premium bound this period, by line of business.',
    when: 'Binding is enabled for your organization.',
  },
  {
    title: 'Loss ratio',
    summary: 'Incurred losses over earned premium, by underwriting year.',
    when: 'Claims data is connected.',
  },
  {
    title: 'Treaty cessions',
    summary: 'Premium and losses ceded under quota share and XoL treaties.',
    when: 'A reinsurance programme is set up.',
  },
  {
    title: 'Referral queue',
    summary: 'Submissions referred above your authority level, oldest first.',
    when: 'Underwriting authority levels are configured.',
  },
  {
    title: 'Renewals due',
    summary: 'Policies expiring in the next 90 days.',
    when: 'Policies are issued on the platform.',
  },
  {
    title: 'Endorsements',
    summary: 'Mid-term changes requested and their premium effect.',
    when: 'Policies are issued on the platform.',
  },
  {
    title: 'Cancellations',
    summary: 'Cancelled policies and return premium.',
    when: 'Policies are issued on the platform.',
  },
];

const meta = {
  id: 'xds-planned-list',
  title: 'Page Layout/PlannedList',
  component: PlannedList,
  args: {
    heading: 'Planned panels',
    headingLevel: 2,
    intro: 'These panels are on the roadmap. Nothing is wrong; there is no data for them yet.',
    items: planned,
  },
  parameters: { viewport: { viewports: storyViewports } },
} satisfies Meta<typeof PlannedList>;
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

const assertCalm = async (canvasElement: HTMLElement) => {
  // Planned is not an error or a loading state: no live regions, no buttons.
  await expect(canvasElement.querySelectorAll('[role="alert"], [role="status"]')).toHaveLength(0);
  await expect(canvasElement.querySelectorAll('[aria-live]')).toHaveLength(0);
  await expect(canvasElement.querySelectorAll('button')).toHaveLength(0);
};

const responsive = (theme: XdsThemeName, width: 1440 | 768): Story => ({
  name: `Planned list · ${theme} · ${width} px`,
  decorators: themed(theme),
  parameters: storyViewport(width),
  play: async ({ canvasElement }) => {
    expectStoryViewport(width);
    const canvas = within(canvasElement);
    const list = canvas.getByRole('list', { name: 'Planned panels (7)' });
    await expect(within(list).getAllByRole('listitem')).toHaveLength(7);
    await assertCalm(canvasElement);
    const label = within(list).getAllByText('Appears once:')[0];
    const visible = label.getBoundingClientRect().width > 1;
    // Rows stack at 768 px and the label becomes visible; at 1440 px it is a column.
    await expect(visible).toBe(width <= 768);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
  },
});

export const Dark1440 = responsive('dark', 1440);
export const Light1440 = responsive('light', 1440);
export const Dark768 = responsive('dark', 768);
export const Light768 = responsive('light', 768);

export const HeadingLevel3: Story = {
  name: 'Heading level 3',
  args: { headingLevel: 3, intro: undefined, items: planned.slice(0, 2) },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('heading', { level: 3, name: 'Planned panels (2)' }),
    ).toBeInTheDocument();
  },
};

export const Empty: Story = {
  name: 'Empty (with emptyMessage)',
  args: { items: [], emptyMessage: 'Every panel on this dashboard is live.' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('list')).toBeNull();
    await expect(canvasElement.textContent).toContain('Every panel on this dashboard is live.');
    await assertCalm(canvasElement);
  },
};

export const EmptyRendersNothing: Story = {
  name: 'Empty (no emptyMessage) renders nothing',
  args: { items: [], emptyMessage: undefined },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('heading')).toBeNull();
  },
};

const healthy = (theme: XdsThemeName): Story => ({
  name: `Healthy dashboard load · ${theme} · 0 announcements`,
  decorators: themed(theme),
  parameters: storyViewport(1440),
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <ResultMetricCard label="Submissions received" value="128" basis="Last 30 days" />
        <ResultMetricCard label="Open referrals" value={0} basis="Above your authority level" />
        <ResultMetricCard
          label="Loss ratio"
          value={null}
          message="Unavailable — not measured yet."
          basis="Appears once claims data is connected."
        />
      </div>
      <ResultsPanel
        title="Earned premium"
        state="unavailable"
        message="Unavailable — not measured yet."
        basis="Appears once policies are issued on the platform."
      />
      <PlannedList {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    expectStoryViewport(1440);
    // WCAG 4.1.3: a healthy load with planned and unavailable panels announces nothing.
    await expect(canvasElement.querySelectorAll('[role="alert"]')).toHaveLength(0);
    await expect(canvasElement.querySelectorAll('[role="status"]')).toHaveLength(0);
    await expect(canvasElement.querySelectorAll('[aria-live]')).toHaveLength(0);
    await expect(canvasElement.textContent).toContain('Open referrals0');
  },
});
export const HealthyLoadDark = healthy('dark');
export const HealthyLoadLight = healthy('light');
