import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, fn } from '@storybook/test';
import Pagination from '../../components/Pagination.js';
import { cssVariables, xdsThemes, type XdsThemeName } from '../../palette.js';
import { colors } from '../../colors.js';
import { expectStoryViewport, storyViewport, storyViewports } from '../viewport.js';

const meta = {
  id: 'xds-pagination',
  title: 'Navigation/Pagination',
  component: Pagination,
  args: {
    mode: 'keyset',
    hasPrevious: true,
    hasNext: true,
    onPrevious: fn(),
    onNext: fn(),
    pageSizeLabel: '25 per page',
  },
  parameters: { viewport: { viewports: storyViewports } },
} satisfies Meta<typeof Pagination>;
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

const buttons = (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  return {
    previous: canvas.getByRole('button', { name: /Previous/ }),
    next: canvas.getByRole('button', { name: /Next/ }),
  };
};

/** The describedby id must point to a real element carrying the reason. */
const expectReason = async (button: HTMLElement, reason: RegExp) => {
  await expect(button).toHaveAttribute('aria-disabled', 'true');
  const id = button.getAttribute('aria-describedby');
  await expect(id).toBeTruthy();
  const node = button.ownerDocument.getElementById(id as string);
  await expect(node?.textContent).toMatch(reason);
};

export const FirstPage: Story = {
  args: { hasPrevious: false, hasNext: true },
  play: async ({ canvasElement, args }) => {
    const { previous, next } = buttons(canvasElement);
    await expectReason(previous, /first page/);
    await expect(next).not.toHaveAttribute('aria-disabled');
    await expect(next).not.toHaveAttribute('aria-describedby');
    // Disabled Previous stays focusable so its reason is read.
    await userEvent.tab();
    await expect(previous).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onPrevious).not.toHaveBeenCalled();
    await userEvent.tab();
    await expect(next).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onNext).toHaveBeenCalledTimes(1);
  },
};

export const MiddlePage: Story = {
  args: { hasPrevious: true, hasNext: true },
  play: async ({ canvasElement, args }) => {
    const { previous, next } = buttons(canvasElement);
    await expect(previous).not.toHaveAttribute('aria-disabled');
    await expect(next).not.toHaveAttribute('aria-disabled');
    await userEvent.click(previous);
    await expect(args.onPrevious).toHaveBeenCalledTimes(1);
    await userEvent.click(next);
    await expect(args.onNext).toHaveBeenCalledTimes(1);
    // Keyset mode never shows page numbers or a total.
    await expect(canvasElement.textContent ?? '').not.toMatch(/\bof\b|Page \d/);
  },
};

export const LastPage: Story = {
  args: { hasPrevious: true, hasNext: false },
  play: async ({ canvasElement, args }) => {
    const { next } = buttons(canvasElement);
    await expectReason(next, /last page/);
    await userEvent.click(next);
    await expect(args.onNext).not.toHaveBeenCalled();
  },
};

export const SinglePage: Story = {
  args: { hasPrevious: false, hasNext: false },
  play: async ({ canvasElement }) => {
    expectStoryViewport(width);
    const { previous, next } = buttons(canvasElement);
    await expectReason(previous, /first page/);
    await expectReason(next, /last page/);
  },
};

export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvasElement, args }) => {
    const nav = canvasElement.querySelector('[data-xds="pagination"]') as HTMLElement;
    await expect(nav).toHaveAttribute('aria-busy', 'true');
    const { previous, next } = buttons(canvasElement);
    await expectReason(previous, /Loading/);
    await expectReason(next, /Loading/);
    await userEvent.click(next);
    await expect(args.onNext).not.toHaveBeenCalled();
  },
};

export const CustomReasons: Story = {
  name: 'Custom labels and reasons',
  args: {
    hasPrevious: false,
    hasNext: false,
    label: 'Submissions pages',
    previousDisabledReason: 'You are viewing the newest submissions',
    nextDisabledReason: 'There are no older submissions',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('navigation', { name: 'Submissions pages' })).toBeVisible();
    const { previous, next } = buttons(canvasElement);
    await expectReason(previous, /newest submissions/);
    await expectReason(next, /no older submissions/);
  },
};

type Width = 375 | 768 | 1440;
const themes: XdsThemeName[] = ['dark', 'light'];

const responsive = (theme: XdsThemeName, width: Width): Story => ({
  name: `First page · ${theme} · ${width} px`,
  args: { hasPrevious: false, hasNext: true },
  decorators: themed(theme),
  parameters: storyViewport(width),
  play: async ({ canvasElement }) => {
    expectStoryViewport(width);
    const { previous, next } = buttons(canvasElement);
    await expectReason(previous, /first page/);
    // 44 px touch targets below 1024 px; at least 24 px everywhere (WCAG 2.5.8).
    const min = width < 1024 ? 44 : 24;
    for (const button of [previous, next]) {
      const rect = button.getBoundingClientRect();
      await expect(rect.height).toBeGreaterThanOrEqual(min);
      await expect(rect.width).toBeGreaterThanOrEqual(min);
    }
  },
});

export const Dark375 = responsive(themes[0], 375);
export const Dark768 = responsive(themes[0], 768);
export const Dark1440 = responsive(themes[0], 1440);
export const Light375 = responsive(themes[1], 375);
export const Light768 = responsive(themes[1], 768);
export const Light1440 = responsive(themes[1], 1440);
