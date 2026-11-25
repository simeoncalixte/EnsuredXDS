import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import Badge, {
  type XdsBadgeVariant,
  SUBMISSION_SYSTEM_STATUSES,
  statusTone,
} from '../../components/Badge.js';
import { cssVariables, xdsThemes, type XdsThemeName } from '../../palette.js';
import { colors } from '../../colors.js';

const meta: Meta<typeof Badge> = {
  id: 'xds-badge',
  title: 'Feedback/Badge',
  component: Badge,
  args: {
    variant: 'surface',
    dot: false,
    children: 'Badge',
  },
};

export default meta;

type Story = StoryObj<typeof Badge>;

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>
);

// Original (backward-compatible) variants.
export const Variants: Story = {
  render: () => (
    <Row>
      <Badge variant="primary">Bound</Badge>
      <Badge variant="surface">Pending</Badge>
      <Badge variant="secondary">Claim</Badge>
      <Badge variant="tertiary">Historical</Badge>
    </Row>
  ),
};

// New additive semantic tones.
export const Tones: Story = {
  render: () => (
    <Row>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="neutral">Neutral</Badge>
    </Row>
  ),
};

// Leading dot variant.
export const WithDot: Story = {
  render: () => (
    <Row>
      <Badge variant="success" dot>
        Active
      </Badge>
      <Badge variant="danger" dot>
        Failed
      </Badge>
      <Badge variant="info" dot>
        Syncing
      </Badge>
    </Row>
  ),
};

// Interaction test: a controlled wrapper cycles tone + toggles the dot,
// and we assert the resulting DOM reflects the change.
const tones: XdsBadgeVariant[] = ['success', 'warning', 'danger', 'info', 'neutral'];

const InteractiveBadge: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [dot, setDot] = useState(false);
  const variant = tones[index];
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <span data-testid="badge-host">
        <Badge variant={variant} dot={dot}>
          {variant}
        </Badge>
      </span>
      <button type="button" onClick={() => setIndex((i) => (i + 1) % tones.length)}>
        Next tone
      </button>
      <button type="button" onClick={() => setDot((d) => !d)}>
        Toggle dot
      </button>
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveBadge />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const host = canvas.getByTestId('badge-host');
    expect(host).toHaveTextContent(/success/i);

    // Cycle the tone forward.
    await userEvent.click(canvas.getByRole('button', { name: 'Next tone' }));
    expect(host).toHaveTextContent(/warning/i);

    // Toggle the leading dot on; an aria-hidden dot span should appear.
    expect(host.querySelector('[aria-hidden="true"]')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle dot' }));
    expect(host.querySelector('[aria-hidden="true"]')).not.toBeNull();
  },
};

// ---------------------------------------------------------------------------
// AIN-281: statusTone() and the Archived variant (submission list and Kanban).
// ---------------------------------------------------------------------------

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

/** Illustrative labels as an org might show them. Board statuses are org-defined. */
const statusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  modeling: 'Modeling',
  priced: 'Priced',
  approved: 'Approved',
  rejected: 'Declined',
  quoted: 'Quoted',
  bound: 'Bound',
};
const boardStatuses = ['Awaiting loss runs', 'Broker follow-up'];

const SubmissionStatusRow: React.FC = () => (
  <div style={{ display: 'grid', gap: 16 }}>
    <Row>
      {SUBMISSION_SYSTEM_STATUSES.map((status) => (
        <span key={status} data-status={status}>
          <Badge variant={statusTone(status)}>{statusLabels[status]}</Badge>
        </span>
      ))}
    </Row>
    <Row>
      {boardStatuses.map((status) => (
        <span key={status} data-status={status}>
          <Badge variant={statusTone(status)}>{status}</Badge>
        </span>
      ))}
      <span data-status="archived-row">
        <Badge variant={statusTone('bound')}>Bound</Badge> <Badge variant="archived" />
      </span>
    </Row>
  </div>
);

const expectedTones: Record<string, XdsBadgeVariant> = {
  draft: 'neutral',
  submitted: 'info',
  modeling: 'info',
  priced: 'info',
  approved: 'primary',
  rejected: 'danger',
  quoted: 'primary',
  bound: 'success',
};

const submissionStatusesPlay: Story['play'] = async ({ canvasElement }) => {
  for (const status of SUBMISSION_SYSTEM_STATUSES) {
    const badge = canvasElement.querySelector(`[data-status="${status}"] [data-xds-variant]`);
    expect(badge).not.toBeNull();
    expect(badge?.getAttribute('data-xds-variant')).toBe(expectedTones[status]);
    // Text is always visible; tone is never the only signal.
    expect(badge).toHaveTextContent(statusLabels[status]);
  }
  for (const status of boardStatuses) {
    const badge = canvasElement.querySelector(`[data-status="${status}"] [data-xds-variant]`);
    expect(badge?.getAttribute('data-xds-variant')).toBe('surface');
  }
  const archived = canvasElement.querySelector(
    '[data-status="archived-row"] [data-xds-variant="archived"]',
  );
  expect(archived).toHaveTextContent('Archived');
  expect(archived?.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
};

export const SubmissionStatusesDark: Story = {
  name: 'Submission statuses (statusTone) · dark',
  render: () => (
    <ThemeFrame theme="dark">
      <SubmissionStatusRow />
    </ThemeFrame>
  ),
  play: submissionStatusesPlay,
};

export const SubmissionStatusesLight: Story = {
  name: 'Submission statuses (statusTone) · light',
  render: () => (
    <ThemeFrame theme="light">
      <SubmissionStatusRow />
    </ThemeFrame>
  ),
  play: submissionStatusesPlay,
};

export const Archived: Story = {
  render: () => (
    <Row>
      <Badge variant="archived" />
      <Badge variant="archived">Archived 20 Nov 2026</Badge>
    </Row>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText('Archived')).toBeInTheDocument();
    expect(canvas.getByText('Archived 20 Nov 2026')).toBeInTheDocument();
    const icons = canvasElement.querySelectorAll('[data-xds-variant="archived"] svg');
    expect(icons).toHaveLength(2);
    icons.forEach((icon) => expect(icon).toHaveAttribute('aria-hidden', 'true'));
  },
};
