import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn, within, userEvent, expect, waitFor } from '@storybook/test';
import FormContents, {
  type FormContentsGroup,
  type FormContentsItem,
} from '../../components/FormContents.js';
import { cssVariables, xdsThemes, type XdsThemeName } from '../../palette.js';
import { colors } from '../../colors.js';
import { spacing, typography } from '../../tokens.js';

const viewports = {
  xds375: { name: '375 px', styles: { width: '375px', height: '812px' }, type: 'mobile' },
  xds768: { name: '768 px', styles: { width: '768px', height: '1024px' }, type: 'tablet' },
  xds1440: { name: '1440 px', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
};

/** Northwind Logistics, commercial property submission, form v2: 6 sections, 1 nested. */
const northwind: FormContentsItem[] = [
  { id: 'insured', label: 'Insured', href: '#insured', status: { kind: 'complete' } },
  {
    id: 'locations',
    label: 'Locations',
    href: '#locations',
    status: { kind: 'complete' },
    children: [
      {
        id: 'location-1',
        label: 'Warehouse, Newark NJ',
        href: '#location-1',
        status: { kind: 'complete' },
      },
      {
        id: 'location-2',
        label: 'Depot, Allentown PA',
        href: '#location-2',
        status: { kind: 'text', text: 'Optional' },
      },
    ],
  },
  { id: 'coverages', label: 'Coverages', href: '#coverages', status: { kind: 'complete' } },
  {
    id: 'limits',
    label: 'Limits and deductibles',
    href: '#limits',
    status: { kind: 'complete' },
  },
  { id: 'loss-history', label: 'Loss history', href: '#loss-history' },
  {
    id: 'attachments',
    label: 'Attachments',
    href: '#attachments',
    status: { kind: 'text', text: 'Optional' },
  },
];

const withIssues: FormContentsItem[] = northwind.map((item) =>
  item.id === 'coverages'
    ? { ...item, status: { kind: 'issues', count: 2 } }
    : item.id === 'loss-history'
      ? { ...item, status: { kind: 'issues', count: 1 } }
      : item,
);

const groups: FormContentsGroup[] = [
  {
    id: 'changes',
    title: 'Changes in this edit',
    summaryLabel: { one: 'change', other: 'changes' },
    items: [
      {
        id: 'chg-deductible',
        label: 'Deductible',
        detail: 'USD 25,000.00 → USD 50,000.00',
        href: '#limits',
      },
      {
        id: 'chg-tiv',
        label: 'Total insured value',
        detail: 'USD 18,400,000.00 → USD 19,150,000.00',
        href: '#locations',
      },
      { id: 'chg-sprinklers', label: 'Sprinklered', detail: 'No → Yes', href: '#location-1' },
    ],
  },
  {
    id: 'detached',
    title: 'Not in this form',
    summaryLabel: { one: 'detached value', other: 'detached values' },
    items: [
      {
        id: 'det-flood-zone',
        label: 'Flood zone',
        detail: 'Kept from form v1: AE',
        href: '#detached-flood-zone',
      },
      {
        id: 'det-cat-limit',
        label: 'Named-storm sublimit',
        detail: 'Kept from form v1: USD 5,000,000.00',
        href: '#detached-cat-limit',
      },
    ],
  },
  { id: 'empty', title: 'Referral notes', items: [] },
];

const meta: Meta<typeof FormContents> = {
  id: 'xds-form-contents',
  title: 'Navigation/FormContents',
  component: FormContents,
  parameters: { viewport: { viewports }, layout: 'fullscreen' },
  argTypes: {
    compact: { control: 'inline-radio', options: ['auto', true, false] },
    loading: { control: 'boolean' },
    currentId: { control: 'text' },
  },
  args: {
    label: 'Form contents',
    heading: 'Contents · form v2',
    items: northwind,
    currentId: 'coverages',
    onNavigate: fn(),
    compact: false,
    stickyTop: null,
  },
};

export default meta;
type Story = StoryObj<typeof FormContents>;

function ThemeFrame({
  theme,
  width = 280,
  children,
}: React.PropsWithChildren<{ theme: XdsThemeName; width?: number | string }>) {
  return (
    <div
      data-theme={theme}
      style={{
        ...(cssVariables(xdsThemes[theme]) as React.CSSProperties),
        background: colors.background,
        color: colors.text.primary,
        padding: spacing.lg,
        boxSizing: 'border-box',
        minHeight: '100vh',
      }}
    >
      <div style={{ width, maxWidth: '100%' }}>{children}</div>
    </div>
  );
}

const themed = (theme: XdsThemeName, width?: number | string) => [
  (StoryFn: React.ComponentType) => (
    <ThemeFrame theme={theme} width={width}>
      <StoryFn />
    </ThemeFrame>
  ),
];

/** Default: Northwind shape, 6 sections with one nested level, "Coverages" in view. */
export const Default: Story = {
  name: 'Default · Northwind shape',
  decorators: themed('dark'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation', { name: 'Form contents' });
    await expect(within(nav).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Contents · form v2',
    );
    const lists = nav.querySelectorAll('ol');
    await expect(lists.length).toBe(2);
    await expect(within(nav).getAllByRole('link')).toHaveLength(8);
    const current = within(nav).getByRole('link', { name: /Coverages/ });
    await expect(current).toHaveAttribute('aria-current', 'location');
    await expect(within(nav).getByRole('link', { name: /Insured/ })).not.toHaveAttribute(
      'aria-current',
    );
    await expect(within(nav).getByRole('link', { name: /Insured/ })).toHaveTextContent(
      'Insured✓ Complete',
    );
    // The compact toggle is not rendered as a control in full mode.
    await expect(within(nav).queryByRole('button')).toBeNull();
  },
};

export const LightTheme: Story = {
  name: 'Light theme',
  decorators: themed('light'),
};

/** Sections with issues: "● N issues" in danger text, singular and plural. */
export const WithIssues: Story = {
  name: 'With issues',
  decorators: themed('dark'),
  args: { items: withIssues },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('link', { name: /Coverages/ })).toHaveTextContent('2 issues');
    await expect(canvas.getByRole('link', { name: /Loss history/ })).toHaveTextContent('1 issue');
    await expect(canvas.getByRole('link', { name: /Loss history/ })).not.toHaveTextContent(
      '1 issues',
    );
  },
};

export const WithIssuesLight: Story = {
  name: 'With issues · light',
  decorators: themed('light'),
  args: { items: withIssues },
};

/** Change and detached-value groups with counts. The empty "Referral notes" group is hidden. */
export const WithGroups: Story = {
  name: 'Change and detached groups',
  decorators: themed('dark'),
  args: { items: withIssues, groups, currentId: 'limits' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('region', { name: 'Changes in this edit · 3' }),
    ).toBeInTheDocument();
    await expect(canvas.getByRole('region', { name: 'Not in this form · 2' })).toBeInTheDocument();
    await expect(canvas.queryByText(/Referral notes/)).toBeNull();
    await expect(canvas.getByRole('heading', { level: 3, name: /Changes in this edit/ })).toBe(
      canvas.getByText('Changes in this edit · 3'),
    );
  },
};

export const WithGroupsLight: Story = {
  name: 'Change and detached groups · light',
  decorators: themed('light'),
  args: { items: withIssues, groups, currentId: 'limits' },
};

/** Activating a link calls onNavigate and moves focus to the target section. */
export const NavigateAndFocus: Story = {
  name: 'Navigate · focuses target',
  decorators: themed('dark', '100%'),
  render: function Render(args) {
    const [current, setCurrent] = useState(args.currentId);
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.lg }}>
        <div style={{ flex: '1 1 260px', maxWidth: 360, minWidth: 0 }}>
          <FormContents
            {...args}
            stickyTop={spacing.md}
            currentId={current}
            onNavigate={(id) => {
              setCurrent(id);
              args.onNavigate?.(id);
            }}
          />
        </div>
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          {northwind.map((s) => (
            <section
              key={s.id}
              id={s.id}
              aria-labelledby={`${s.id}-h`}
              style={{ minHeight: 280, scrollMarginTop: spacing.md }}
            >
              <h2 id={`${s.id}-h`} style={{ fontSize: typography.sizes.lg, margin: 0 }}>
                {s.label}
              </h2>
            </section>
          ))}
        </div>
      </div>
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: /Loss history/ });
    await userEvent.click(link);
    await expect(args.onNavigate).toHaveBeenCalledWith('loss-history');
    const target = canvasElement.ownerDocument.getElementById('loss-history')!;
    await waitFor(() => expect(target).toHaveFocus());
    await expect(target).toHaveAttribute('tabindex', '-1');
    await expect(canvas.getByRole('link', { name: /Loss history/ })).toHaveAttribute(
      'aria-current',
      'location',
    );
  },
};

/** Compact, collapsed: one 44 px disclosure button with section, issue and change counts. */
export const CompactCollapsed: Story = {
  name: 'Compact · collapsed',
  decorators: themed('dark', '100%'),
  args: { items: withIssues, groups, compact: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', {
      name: 'Contents · 6 sections · 3 issues · 3 changes · 2 detached values',
    });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    await expect(canvas.queryByRole('link', { name: /Coverages/ })).toBeNull();
  },
};

/** Compact, expanded: links are 44 px; choosing one collapses the panel. */
export const CompactExpanded: Story = {
  name: 'Compact · expanded',
  decorators: themed('dark', '100%'),
  args: { items: withIssues, groups, compact: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: /^Contents · 6 sections/ });
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const panel = canvasElement.ownerDocument.getElementById(toggle.getAttribute('aria-controls')!);
    await expect(panel).toBeVisible();
    const link = canvas.getByRole('link', { name: /Coverages/ });
    await expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    await userEvent.keyboard('{Tab}');
    await expect(canvas.getByRole('link', { name: /^Insured/ })).toHaveFocus();
    await userEvent.click(link);
    await expect(args.onNavigate).toHaveBeenCalledWith('coverages');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  },
};

export const CompactExpandedLight: Story = {
  name: 'Compact · expanded · light',
  decorators: themed('light', '100%'),
  args: { items: withIssues, groups, compact: true },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /^Contents/ }));
  },
};

/** Auto mode at 375 px: the viewport is under 1024 px, so the rail is a disclosure. */
export const AutoNarrow: Story = {
  name: 'Auto · 375 px',
  decorators: themed('dark', '100%'),
  args: { items: withIssues, groups, compact: 'auto' },
  parameters: { viewport: { defaultViewport: 'xds375' } },
};

/** Loading: skeleton items, aria-busy on the list, screen-reader text. */
export const Loading: Story = {
  name: 'Loading',
  decorators: themed('dark'),
  args: { loading: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation', { name: 'Form contents' });
    await expect(nav.querySelector('ol')).toHaveAttribute('aria-busy', 'true');
    await expect(canvas.getByText('Loading contents')).toBeInTheDocument();
    await expect(canvas.queryAllByRole('link')).toHaveLength(0);
  },
};

/** Empty shape: no sections yet. The heading and landmark stay. */
export const Empty: Story = {
  name: 'Empty · no sections',
  decorators: themed('dark'),
  args: { items: [], currentId: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('navigation', { name: 'Form contents' })).toBeInTheDocument();
    await expect(canvas.queryAllByRole('link')).toHaveLength(0);
  },
};
