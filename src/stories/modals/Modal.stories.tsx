import React, { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import Modal, { type ModalProps } from '../../components/Modal.js';
import { Button } from '../../components/Button.js';
import { colors } from '../../colors.js';
import { cssVariables, xdsThemes, type XdsThemeName } from '../../palette.js';
import { spacing, typography } from '../../tokens.js';

const viewports = {
  xds320: { name: '320 px', styles: { width: '320px', height: '640px' }, type: 'mobile' },
  xds1440: { name: '1440 px', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
};

const meta: Meta<typeof Modal> = {
  id: 'xds-modal',
  title: 'Modals/Modal',
  component: Modal,
  parameters: { viewport: { viewports } },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default = () => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Review Capital Deployment">
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Asset Class</span>
            <span style={{ fontWeight: 700 }}>Catastrophe Bond Series A</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Allocated Principal</span>
            <span
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
                fontWeight: 700,
              }}
            >
              $2,500,000.00
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Gas Limit (Projected)</span>
            <span
              style={{
                color: 'var(--text-secondary)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
              }}
            >
              0.0014 ETH
            </span>
          </div>
          <div
            style={{
              background: 'rgba(11,18,32,0.6)',
              padding: 12,
              borderRadius: 8,
              borderLeft: `2px solid ${colors.brand[500]}`,
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}
          >
            By confirming, you agree to the Sovereign Re Master Participation Agreement and
            acknowledge the risk coefficients defined in the smart contract.
          </div>
        </div>
      </Modal>
    </>
  );
};

function ThemeFrame({ theme, children }: React.PropsWithChildren<{ theme: XdsThemeName }>) {
  return (
    <div
      data-theme={theme}
      style={{
        ...(cssVariables(xdsThemes[theme]) as React.CSSProperties),
        background: colors.background,
        color: colors.text.primary,
        padding: spacing.lg,
        minHeight: 480,
        boxSizing: 'border-box',
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

type SupersedeProps = Pick<ModalProps, 'submitting' | 'error'> & { startOpen?: boolean };

/**
 * AIN-287: confirm before superseding a sent quote. Illustrative fixture, not live
 * data. Focus starts on the safe action ("Back to quote"); the destructive action
 * is never the default.
 */
function SupersedeConfirm({ submitting, error, startOpen = false }: SupersedeProps) {
  const [open, setOpen] = useState(startOpen);
  const backRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Revise quote
      </Button>
      <Modal
        open={open}
        role="alertdialog"
        title="Supersede quote Q-1042 v2?"
        describedBy="supersede-consequence"
        initialFocusRef={backRef}
        onClose={() => setOpen(false)}
        submitting={submitting}
        error={error}
        footer={
          <>
            <Button
              ref={backRef}
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Back to quote
            </Button>
            <Button tone="danger" disabled={submitting}>
              {submitting ? 'Superseding…' : 'Supersede and create v3'}
            </Button>
          </>
        }
      >
        <p
          id="supersede-consequence"
          style={{ margin: 0, fontSize: typography.sizes.md, lineHeight: 1.5 }}
        >
          v2 was sent to the broker on 21 Nov 2026. Superseding it withdraws v2: the broker&apos;s
          link stops working and v3 must be sent again before it can be accepted or bound.
        </p>
      </Modal>
    </>
  );
}

/** Alert dialog: initial focus on the safe action, Esc cancels, focus returns to the trigger. */
export const AlertDialogConfirm: Story = {
  name: 'Alert dialog · supersede quote',
  decorators: themed('dark'),
  render: () => <SupersedeConfirm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Revise quote' });
    await userEvent.click(trigger);
    const dialog = await canvas.findByRole('alertdialog', { name: 'Supersede quote Q-1042 v2?' });
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAccessibleDescription(/withdraws v2/);
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Back to quote' })).toHaveFocus(),
    );
    // Tab stays inside the dialog.
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await expect(dialog.contains(document.activeElement)).toBe(true);
    // The scrim does not dismiss an alert dialog.
    const scrim = canvasElement.querySelector('[data-xds-modal-scrim]') as HTMLElement;
    await userEvent.click(scrim);
    await expect(canvas.getByRole('alertdialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('alertdialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** Light theme, opened. */
export const AlertDialogLight: Story = {
  name: 'Alert dialog · light',
  decorators: themed('light'),
  render: () => <SupersedeConfirm startOpen />,
  play: async ({ canvasElement }) => {
    const dialog = await within(canvasElement).findByRole('alertdialog');
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Back to quote' })).toHaveFocus(),
    );
  },
};

/** Submitting: both actions disabled, in-progress label, Esc ignored, `aria-busy`. */
export const Submitting: Story = {
  name: 'Alert dialog · submitting',
  decorators: themed('dark'),
  render: () => <SupersedeConfirm startOpen submitting />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = await canvas.findByRole('alertdialog');
    await expect(dialog).toHaveAttribute('aria-busy', 'true');
    await expect(within(dialog).getByRole('button', { name: 'Superseding…' })).toBeDisabled();
    await expect(within(dialog).getByRole('button', { name: 'Back to quote' })).toBeDisabled();
    await expect(within(dialog).getByRole('button', { name: 'Close' })).toBeDisabled();
    dialog.focus();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByRole('alertdialog')).toBeInTheDocument();
  },
};

/** Error: inline `role="alert"` at the top of the body takes focus. */
export const ErrorState: Story = {
  name: 'Alert dialog · error',
  decorators: themed('dark'),
  render: () => (
    <SupersedeConfirm
      startOpen
      error="We couldn't supersede Q-1042 v2. It is unchanged and still with the broker. Try again, or go back to the quote."
    />
  ),
  play: async ({ canvasElement }) => {
    const dialog = await within(canvasElement).findByRole('alertdialog');
    const alert = within(dialog).getByRole('alert');
    await expect(alert).toHaveTextContent(/unchanged/);
    await waitFor(() => expect(alert).toHaveFocus());
  },
};

/** 320 px: footer actions stack full width with 44 px targets. */
export const Narrow320: Story = {
  name: 'Alert dialog · 320 px',
  decorators: themed('dark'),
  parameters: { viewport: { defaultViewport: 'xds320' } },
  render: () => <SupersedeConfirm startOpen />,
  play: async ({ canvasElement }) => {
    const dialog = await within(canvasElement).findByRole('alertdialog');
    const back = within(dialog).getByRole('button', { name: 'Back to quote' });
    const action = within(dialog).getByRole('button', { name: 'Supersede and create v3' });
    if (window.innerWidth < 480) {
      await expect(back.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
      await expect(action.getBoundingClientRect().top).toBeGreaterThan(
        back.getBoundingClientRect().top,
      );
    }
  },
};
