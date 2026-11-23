import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, expect } from '@storybook/test';
import CalloutPanel from '../../components/CalloutPanel.js';
import { cssVariables, xdsThemes, type XdsThemeName } from '../../palette.js';
import { colors } from '../../colors.js';

const viewports = {
  xds390: { name: '390 px', styles: { width: '390px', height: '844px' }, type: 'mobile' },
  xds1440: { name: '1440 px', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
};

const meta: Meta<typeof CalloutPanel> = {
  id: 'xds-callout-panel',
  title: 'Data Display/CalloutPanel',
  component: CalloutPanel,
  parameters: { viewport: { viewports } },
  argTypes: {
    title: { control: 'text' },
    isLabel: { control: 'text' },
    isntLabel: { control: 'text' },
    headingLevel: { control: 'inline-radio', options: [2, 3, 4] },
    emptyLabel: { control: 'text' },
  },
  args: {
    title: "What the platform is and isn't",
    isLabel: 'What the platform is',
    isntLabel: "What the platform isn't",
    items: {
      is: [
        'A place for brokers to send submissions and have them structured and checked',
        'A way for carriers and reinsurers to set their appetite',
        'A shortlist of markets whose appetite fits, for a broker to approach',
        'A versioned record of who changed what, and when',
      ],
      isnt: [
        'An insurer, carrier or broker',
        'A place where cover is quoted or bound automatically: binding is by the carrier or an underwriter with authority',
        'Investment advice or an offer of returns',
        'Live market inventory: figures on this page are illustrative',
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof CalloutPanel>;

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

/** Named region, two real lists named by their column headings, decorative icons. */
const expectPanel = async (canvasElement: HTMLElement, isCount: number, isntCount: number) => {
  const canvas = within(canvasElement);
  const region = canvas.getByRole('region', { name: "What the platform is and isn't" });
  const isList = within(region).getByRole('list', { name: 'What the platform is' });
  const isntList = within(region).getByRole('list', { name: "What the platform isn't" });
  await expect(within(isList).getAllByRole('listitem')).toHaveLength(isCount);
  await expect(within(isntList).getAllByRole('listitem')).toHaveLength(isntCount);
  for (const svg of Array.from(region.querySelectorAll('svg')))
    await expect(svg).toHaveAttribute('aria-hidden', 'true');
  return region;
};

/** Default: the trust-section panel on the signed-out homepage (dark theme, as shipped). */
export const Default: Story = {
  decorators: themed('dark'),
  play: async ({ canvasElement }) => {
    const region = await expectPanel(canvasElement, 4, 4);
    await expect(within(region).getByRole('heading', { level: 2 })).toHaveTextContent(
      "What the platform is and isn't",
    );
    await expect(within(region).getAllByRole('heading', { level: 3 })).toHaveLength(2);
  },
};

export const LightTheme: Story = {
  decorators: themed('light'),
  play: async ({ canvasElement }) => {
    await expectPanel(canvasElement, 4, 4);
  },
};

export const DarkTheme: Story = {
  decorators: themed('dark'),
  play: async ({ canvasElement }) => {
    await expectPanel(canvasElement, 4, 4);
  },
};

/** Nested under an h2 section: the title is an h3 and the columns are h4. */
export const HeadingLevel3: Story = {
  decorators: themed('dark'),
  args: { headingLevel: 3 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 3 })).toHaveTextContent(
      "What the platform is and isn't",
    );
    await expect(canvas.getAllByRole('heading', { level: 4 })).toHaveLength(2);
  },
};

/** Default column headings when the caller passes none. */
export const DefaultLabels: Story = {
  decorators: themed('dark'),
  args: { title: 'Facultative placement', isLabel: undefined, isntLabel: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('list', { name: 'What it is' })).toBeInTheDocument();
    await expect(canvas.getByRole('list', { name: "What it isn't" })).toBeInTheDocument();
  },
};

/** Empty column: shows the empty label as text and renders no empty list. */
export const EmptyColumn: Story = {
  decorators: themed('dark'),
  args: {
    items: {
      is: ['A shortlist of markets whose appetite fits'],
      isnt: [],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('list')).toHaveLength(1);
    await expect(canvas.getByText('Nothing listed yet')).toBeInTheDocument();
  },
};

/** Long statements wrap without horizontal scroll. */
export const LongText: Story = {
  decorators: themed('light'),
  args: {
    items: {
      is: [
        'A structured submission record covering schedule of values, limits, deductibles, loss runs and subjectivities, versioned so every endorsement and renewal shows what changed',
      ],
      isnt: [
        'A treaty reinsurer accepting individual risks: per-risk matching here is facultative or delegated-authority placement, and treaty capacity is written on a portfolio basis',
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await expectPanel(canvasElement, 1, 1);
  },
};

/** 390 px, dark: columns stack, "is" first. */
export const Narrow390Dark: Story = {
  decorators: themed('dark'),
  parameters: { viewport: { defaultViewport: 'xds390' } },
  play: async ({ canvasElement }) => {
    const region = await expectPanel(canvasElement, 4, 4);
    const [isCol, isntCol] = Array.from(region.querySelectorAll('[data-column]'));
    await expect(isCol).toHaveAttribute('data-column', 'is');
    await expect(isntCol).toHaveAttribute('data-column', 'isnt');
  },
};

export const Narrow390Light: Story = {
  decorators: themed('light'),
  parameters: { viewport: { defaultViewport: 'xds390' } },
  play: async ({ canvasElement }) => {
    await expectPanel(canvasElement, 4, 4);
  },
};
