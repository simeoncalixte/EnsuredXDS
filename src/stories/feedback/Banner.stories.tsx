import React, { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn, within, userEvent, expect } from '@storybook/test';
import Banner from '../../components/Banner.js';
import Button from '../../components/Button.js';
import { cssVariables, xdsThemes, type XdsThemeName } from '../../palette.js';
import { colors } from '../../colors.js';

const viewports = {
  xds390: { name: '390 px', styles: { width: '390px', height: '844px' }, type: 'mobile' },
  xds1440: { name: '1440 px', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
};

const meta: Meta<typeof Banner> = {
  id: 'xds-banner',
  title: 'Feedback/Banner',
  component: Banner,
  parameters: { viewport: { viewports } },
  argTypes: {
    tone: { control: 'inline-radio', options: ['info', 'warning', 'neutral'] },
    title: { control: 'text' },
    dismissible: { control: 'boolean' },
    dismissLabel: { control: 'text' },
    toneLabel: { control: 'text' },
  },
  args: {
    tone: 'info',
    title: 'Figures on this page are illustrative',
    children: 'Premiums, limits and loss ratios shown here are examples, not quotes or offers.',
  },
};

export default meta;
type Story = StoryObj<typeof Banner>;

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

/** Polite status (never `alert`), named by its title, with the tone in hidden text. */
const expectStatus = async (canvasElement: HTMLElement, name: string | RegExp) => {
  const status = within(canvasElement).getByRole('status', { name });
  await expect(status).not.toHaveAttribute('aria-live', 'assertive');
  await expect(within(canvasElement).queryByRole('alert')).toBeNull();
  const labelledBy = status.getAttribute('aria-labelledby');
  if (labelledBy)
    await expect(canvasElement.ownerDocument.getElementById(labelledBy)).not.toBeNull();
  return status;
};

/** Info: the homepage "illustrative figures" notice. */
export const Info: Story = {
  decorators: themed('dark'),
  play: async ({ canvasElement }) => {
    const status = await expectStatus(canvasElement, /Figures on this page are illustrative/);
    await expect(within(status).getByText(/Information:/)).toBeInTheDocument();
    await expect(status.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  },
};

export const Warning: Story = {
  decorators: themed('dark'),
  args: {
    tone: 'warning',
    title: 'This quote expires on 2 December 2026',
    children: 'After that date the insured needs a new quote before the policy can be bound.',
  },
  play: async ({ canvasElement }) => {
    const status = await expectStatus(canvasElement, /This quote expires/);
    await expect(within(status).getByText(/Warning:/)).toBeInTheDocument();
  },
};

export const Neutral: Story = {
  decorators: themed('dark'),
  args: {
    tone: 'neutral',
    title: 'Read-only view',
    children: 'This submission was bound on 14 November 2026. Endorse the policy to make changes.',
  },
  play: async ({ canvasElement }) => {
    const status = await expectStatus(canvasElement, /Read-only view/);
    await expect(within(status).getByText(/Notice:/)).toBeInTheDocument();
  },
};

/** Body text only: the hidden tone prefix still leads, and the banner has no title id. */
export const BodyOnly: Story = {
  decorators: themed('dark'),
  args: { title: undefined },
  play: async ({ canvasElement }) => {
    const status = within(canvasElement).getByRole('status');
    await expect(status).not.toHaveAttribute('aria-labelledby');
    await expect(status).toHaveTextContent(/^Information: Premiums/);
  },
};

/** An action slot (link or tertiary button). It wraps below the text on narrow screens. */
export const WithAction: Story = {
  decorators: themed('dark'),
  args: {
    tone: 'warning',
    title: 'Two locations are missing a construction class',
    children: 'The quote can still be saved, but it cannot be sent for referral yet.',
    action: (
      <Button variant="outline" size="sm" onClick={fn()}>
        Review locations
      </Button>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const action = canvas.getByRole('button', { name: 'Review locations' });
    action.focus();
    await expect(action).toHaveFocus();
  },
};

/** Dismissible, uncontrolled: the banner hides itself and calls `onDismiss`. */
export const Dismissible: Story = {
  decorators: themed('dark'),
  args: { dismissible: true, onDismiss: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const dismiss = canvas.getByRole('button', {
      name: 'Dismiss notice: Figures on this page are illustrative',
    });
    await userEvent.tab();
    await expect(dismiss).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole('status')).toBeNull();
  },
};

/** Controlled with `open`; the caller moves focus to the page heading after dismissal. */
export const ControlledWithFocusReturn: Story = {
  decorators: themed('dark'),
  render: (args) => {
    const Demo = () => {
      const [open, setOpen] = useState(true);
      const heading = useRef<HTMLHeadingElement>(null);
      return (
        <div>
          <h2 ref={heading} tabIndex={-1} style={{ margin: '0 0 16px' }}>
            Submissions
          </h2>
          <Banner
            {...args}
            dismissible
            open={open}
            onDismiss={() => {
              setOpen(false);
              heading.current?.focus();
            }}
          />
          {!open && (
            <Button variant="text" size="sm" onClick={() => setOpen(true)}>
              Show notice again
            </Button>
          )}
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /Dismiss notice/ }));
    await expect(canvas.queryByRole('status')).toBeNull();
    await expect(canvas.getByRole('heading', { name: 'Submissions' })).toHaveFocus();
    await userEvent.click(canvas.getByRole('button', { name: 'Show notice again' }));
    await expect(canvas.getByRole('status')).toBeVisible();
  },
};

/** All tones, light theme. */
export const LightTheme: Story = {
  decorators: themed('light'),
  render: (args) => (
    <div style={{ display: 'grid', gap: 12 }}>
      <Banner {...args} tone="info" />
      <Banner {...args} tone="warning" title="This quote expires on 2 December 2026" />
      <Banner {...args} tone="neutral" title="Read-only view" dismissible />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('status')).toHaveLength(3);
  },
};

/** All tones, dark theme. */
export const DarkTheme: Story = {
  ...LightTheme,
  decorators: themed('dark'),
};

/** 390 px: the action and dismiss button wrap below the text. */
export const Narrow390: Story = {
  name: 'Narrow · 390 px',
  decorators: themed('dark'),
  parameters: { viewport: { defaultViewport: 'xds390' } },
  args: {
    ...WithAction.args,
    dismissible: true,
  },
  play: async ({ canvasElement }) => {
    const status = within(canvasElement).getByRole('status');
    await expect(status.scrollWidth).toBeLessThanOrEqual(status.clientWidth + 1);
  },
};

/** 390 px, light theme. */
export const Narrow390Light: Story = {
  ...Narrow390,
  name: 'Narrow · 390 px · light',
  decorators: themed('light'),
};
