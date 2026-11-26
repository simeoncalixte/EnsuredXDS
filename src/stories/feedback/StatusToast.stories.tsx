import React, { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn, within, userEvent, expect, waitFor } from '@storybook/test';
import StatusToast, { type StatusToastProps } from '../../components/StatusToast.js';
import { Button } from '../../components/Button.js';
import { cssVariables, xdsThemes, type XdsThemeName } from '../../palette.js';
import { colors } from '../../colors.js';

const viewports = {
  xds390: { name: '390 px', styles: { width: '390px', height: '844px' }, type: 'mobile' },
  xds768: { name: '768 px', styles: { width: '768px', height: '1024px' }, type: 'tablet' },
  xds1440: { name: '1440 px', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
};

const meta: Meta<typeof StatusToast> = {
  id: 'xds-status-toast',
  title: 'Feedback/StatusToast',
  component: StatusToast,
  parameters: { viewport: { viewports } },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'error'] },
    position: { control: 'inline-radio', options: ['inline', 'fixed'] },
    duration: { control: 'number' },
    message: { control: 'text' },
  },
  args: {
    message: 'SUB-8401 moved from New to Triage.',
    position: 'inline',
    duration: 0,
    onDismiss: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof StatusToast>;

function ThemeFrame({ theme, children }: React.PropsWithChildren<{ theme: XdsThemeName }>) {
  return (
    <div
      data-theme={theme}
      style={{
        ...(cssVariables(xdsThemes[theme]) as React.CSSProperties),
        background: colors.background,
        color: colors.text.primary,
        padding: 24,
        minHeight: 200,
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

const status = (el: HTMLElement) => within(el).getByRole('status');
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Neutral with Undo. Duration is 0 here so the frame stays for review; the default is 10 s. */
export const NeutralWithAction: Story = {
  name: 'Neutral · with Undo',
  decorators: themed('dark'),
  args: { action: { label: 'Undo', onAction: fn() } },
  play: async ({ canvasElement, args }) => {
    const region = status(canvasElement);
    await expect(region).toHaveAttribute('aria-live', 'polite');
    await expect(region).toHaveTextContent('SUB-8401 moved from New to Triage.');
    const undo = within(canvasElement).getByRole('button', { name: 'Undo' });
    await expect(undo).not.toHaveFocus();
    await userEvent.click(undo);
    await expect(args.action?.onAction).toHaveBeenCalledTimes(1);
    await expect(args.onDismiss).toHaveBeenCalledWith('action');
    // The live region stays mounted (empty) for the next message.
    await expect(status(canvasElement)).toHaveTextContent('');
  },
};

/** Neutral without an action: text only, no buttons. */
export const NeutralWithoutAction: Story = {
  name: 'Neutral · no action',
  decorators: themed('dark'),
  args: { message: 'Referral sent to the senior underwriter.' },
  play: async ({ canvasElement }) => {
    await expect(status(canvasElement)).toHaveTextContent(
      'Referral sent to the senior underwriter.',
    );
    await expect(within(canvasElement).queryByRole('button')).toBeNull();
  },
};

/** Error with Try again: stays until dismissed, with a hidden "Error:" prefix and a close button. */
export const ErrorWithAction: Story = {
  name: 'Error · with action',
  decorators: themed('dark'),
  args: {
    tone: 'error',
    duration: 10000,
    message: "SUB-8401 couldn't be moved to Approved. It's still in Triage.",
    action: { label: 'Try again', onAction: fn() },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(status(canvasElement)).toHaveTextContent(
      "Error: SUB-8401 couldn't be moved to Approved. It's still in Triage.",
    );
    await expect(canvas.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Dismiss message' })).toBeInTheDocument();
  },
};

/** Error without an action: only the close button dismisses it. */
export const ErrorWithoutAction: Story = {
  name: 'Error · no action',
  decorators: themed('dark'),
  args: {
    tone: 'error',
    message: 'Undo failed. SUB-8401 is still in Triage.',
  },
  play: async ({ canvasElement, args }) => {
    const close = within(canvasElement).getByRole('button', { name: 'Dismiss message' });
    await userEvent.click(close);
    await expect(args.onDismiss).toHaveBeenCalledWith('close');
    await expect(status(canvasElement)).toHaveTextContent('');
  },
};

/** The timer pauses while hovered or focused (WCAG 2.2.1), then resumes with the time left. */
export const PausesOnHoverAndFocus: Story = {
  name: 'Timer pauses on hover and focus',
  decorators: themed('dark'),
  args: { duration: 800, action: { label: 'Undo', onAction: fn() } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const undo = canvas.getByRole('button', { name: 'Undo' });
    await userEvent.hover(undo);
    await wait(1200);
    await expect(status(canvasElement)).toHaveTextContent('SUB-8401 moved');
    await userEvent.unhover(undo);
    undo.focus();
    await wait(1200);
    await expect(status(canvasElement)).toHaveTextContent('SUB-8401 moved');
    undo.blur();
    await waitFor(() => expect(args.onDismiss).toHaveBeenCalledWith('timeout'), {
      timeout: 2000,
    });
    await expect(status(canvasElement)).toHaveTextContent('');
  },
};

function MoveAndUndoDemo(props: Partial<StatusToastProps>) {
  const [stage, setStage] = useState('New');
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const moveRef = useRef<HTMLButtonElement>(null);
  const count = useRef(0);
  const move = (from: string, to: string) => {
    setStage(to);
    count.current += 1;
    setToast({ id: count.current, message: `SUB-8401 moved from ${from} to ${to}.` });
  };
  return (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
      <p style={{ margin: 0 }} data-testid="stage">
        SUB-8401 stage: {stage}
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button ref={moveRef} variant="outline" onClick={() => move(stage, 'Triage')}>
          Move SUB-8401 to Triage
        </Button>
        <Button variant="outline" onClick={() => move(stage, 'In review')}>
          Move SUB-8401 to In review
        </Button>
      </div>
      <StatusToast
        position="inline"
        {...props}
        message={toast?.message}
        messageId={toast?.id}
        returnFocusRef={moveRef}
        action={{
          label: 'Undo',
          onAction: () => {
            setStage('New');
            setToast(null);
          },
        }}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}

/**
 * Keyboard only: move, Tab to Undo, press Enter; focus returns to the move button (via
 * `returnFocusRef`). A second move replaces the first message instead of stacking.
 */
export const KeyboardMoveAndUndo: Story = {
  name: 'Keyboard · move, replace, Undo',
  decorators: themed('dark'),
  render: () => <MoveAndUndoDemo duration={10000} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(status(canvasElement)).toHaveTextContent('');
    const moveTriage = canvas.getByRole('button', { name: 'Move SUB-8401 to Triage' });
    moveTriage.focus();
    await userEvent.keyboard('{Enter}');
    await expect(status(canvasElement)).toHaveTextContent('SUB-8401 moved from New to Triage.');
    await expect(moveTriage).toHaveFocus();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await expect(status(canvasElement)).toHaveTextContent(
      'SUB-8401 moved from Triage to In review.',
    );
    await expect(canvas.getAllByRole('status')).toHaveLength(1);
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Undo' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByTestId('stage')).toHaveTextContent('SUB-8401 stage: New');
    await expect(status(canvasElement)).toHaveTextContent('');
    await waitFor(() => expect(moveTriage).toHaveFocus());
  },
};

/** Light theme, neutral and error side by side. */
export const LightTheme: Story = {
  decorators: themed('light'),
  render: (args) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <StatusToast {...args} action={{ label: 'Undo', onAction: fn() }} />
      <StatusToast
        {...args}
        tone="error"
        message="SUB-8401 couldn't be moved to Approved. It's still in Triage."
        action={{ label: 'Try again', onAction: fn() }}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('status')).toHaveLength(2);
  },
};

/** Fixed position at 768 px: spans the content width with 16 px gutters. */
export const Fixed768: Story = {
  name: 'Fixed · 768 px',
  decorators: themed('dark'),
  parameters: { viewport: { defaultViewport: 'xds768' } },
  args: { position: 'fixed', action: { label: 'Undo', onAction: fn() } },
  play: async ({ canvasElement }) => {
    await expect(status(canvasElement)).toHaveTextContent('SUB-8401 moved');
  },
};

/** 390 px: the action wraps under a long message. */
export const Narrow390: Story = {
  name: 'Narrow · 390 px',
  decorators: themed('dark'),
  parameters: { viewport: { defaultViewport: 'xds390' } },
  args: {
    message: 'SUB-8401 (Harbourview Logistics, marine cargo) moved from Triage to In review.',
    action: { label: 'Undo', onAction: fn() },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Undo' })).toBeVisible();
  },
};
