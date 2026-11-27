import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, fn } from '@storybook/test';
import OnboardingChecklist, { type OnboardingStep } from '../../components/OnboardingChecklist.js';
import { cssVariables, xdsThemes, type XdsThemeName } from '../../palette.js';
import { colors } from '../../colors.js';
import { storyViewport, expectStoryViewport } from '../viewport.js';

const meta: Meta<typeof OnboardingChecklist> = {
  id: 'xds-onboardingchecklist',
  title: 'Workflow/OnboardingChecklist',
  component: OnboardingChecklist,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ background: '#071129', padding: 24, maxWidth: 720 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof OnboardingChecklist>;

const freshSteps: OnboardingStep[] = [
  {
    id: 'appetite',
    title: 'Define your appetite',
    description: 'Set capital, lines of business, and preferred perils.',
    status: 'current',
    actionLabel: 'Define appetite',
  },
  {
    id: 'channels',
    title: 'Connect an ingestion channel',
    description: 'Wire up a feed so submissions flow in automatically.',
    status: 'todo',
    actionLabel: 'Connect channel',
  },
  {
    id: 'submissions',
    title: 'See your first priced submission',
    description: 'Review a submission once your pipeline produces one.',
    status: 'todo',
    actionLabel: 'Open pipeline',
  },
];

const partialSteps: OnboardingStep[] = [
  { ...freshSteps[0], status: 'complete' },
  { ...freshSteps[1], status: 'current' },
  { ...freshSteps[2], status: 'todo' },
];

const completeSteps: OnboardingStep[] = freshSteps.map((s) => ({
  ...s,
  status: 'complete' as const,
}));

export const Fresh: Story = {
  args: { steps: freshSteps, subtitle: 'Three quick steps to start underwriting.' },
};

export const Partial: Story = {
  args: { steps: partialSteps, subtitle: 'You are partway there.' },
};

export const Complete: Story = {
  args: { steps: completeSteps, subtitle: 'All set!' },
};

export const Interactive: Story = {
  args: {
    // Attach a spy to the current step's action and a dismiss spy so the play
    // test can assert callbacks fired.
    steps: partialSteps.map((s) => (s.status === 'current' ? { ...s, onAction: fn() } : s)),
    subtitle: 'Interactive: drives the spies below.',
    onDismiss: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Progress reflects completed steps: 1 of 3 complete.
    const bar = canvas.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', String(Math.round((1 / 3) * 100)));
    expect(canvas.getByText('1 of 3 complete')).toBeInTheDocument();

    // Clicking the current step's action fires its onAction spy.
    const actionSpy = (args.steps[1] as OnboardingStep).onAction as ReturnType<typeof fn>;
    await userEvent.click(canvas.getByRole('button', { name: /connect channel/i }));
    expect(actionSpy).toHaveBeenCalled();

    // Clicking dismiss fires onDismiss.
    await userEvent.click(canvas.getByRole('button', { name: /dismiss onboarding checklist/i }));
    expect(args.onDismiss).toHaveBeenCalled();
  },
};

/* ------------------------------------------------------------------------- */
/* Readiness variant (AIN-295): conditions that must all hold before binding. */
/* ------------------------------------------------------------------------- */

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

// Replaces the meta decorator (fixed dark backdrop) with a real theme frame.
const themed = (theme: XdsThemeName) => [
  (StoryFn: React.ComponentType) => (
    <ThemeFrame theme={theme}>
      <div style={{ maxWidth: 720 }}>
        <StoryFn />
      </div>
    </ThemeFrame>
  ),
];

const bindConditions: OnboardingStep[] = [
  {
    id: 'subjectivities',
    title: 'Pre-bind subjectivities cleared',
    status: 'met',
    detail: 'Cleared by A. Okafor · 27 Nov 2026, 14:05 ET',
  },
  {
    id: 'application',
    title: 'Signed application received',
    status: 'not-met',
    detail: 'Requested from the broker on 26 Nov 2026, 09:12 ET',
    href: '#documents',
    linkLabel: 'Go to documents',
  },
  {
    id: 'premium',
    title: 'Premium matches the accepted quote',
    status: 'met',
    detail: 'Quote Q-2041 v3 accepted by the broker · 27 Nov 2026, 11:40 ET',
  },
  {
    id: 'authority',
    title: 'Within your binding authority',
    status: 'bypassed',
    detail: 'Referral approved by J. Mensah (Chief Underwriter) · 27 Nov 2026, 13:22 ET',
    href: '#referral',
    linkLabel: 'View referral',
  },
  {
    id: 'sanctions',
    title: 'Sanctions screening clear',
    status: 'not-met',
    detail: 'Screening has not run for the named insured',
    actionLabel: 'Run screening',
  },
];

const readinessArgs = {
  variant: 'readiness' as const,
  title: 'Ready to bind',
  ariaLabel: 'Ready to bind checklist',
  summary: '2 of 5 conditions not met. Binding is unavailable until they are met.',
  summaryId: 'bind-readiness-summary',
};

/** Shows the summary line pointed at by a disabled Bind button, as AIN-292 does. */
const WithBindButton: React.FC<React.ComponentProps<typeof OnboardingChecklist>> = (props) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <OnboardingChecklist {...props} />
    <div>
      <button type="button" aria-disabled="true" aria-describedby={props.summaryId}>
        Bind contract
      </button>
    </div>
  </div>
);

const expectReadiness = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  const list = canvas.getByRole('list', { name: 'Ready to bind checklist' });
  const rows = within(list).getAllByRole('listitem');
  await expect(rows).toHaveLength(5);
  // Status is carried by text as well as the icon (never colour only).
  await expect(rows[0]).toHaveTextContent(/Met: Pre-bind subjectivities cleared/);
  await expect(rows[1]).toHaveTextContent(/Not met · Signed application received/);
  await expect(rows[3]).toHaveTextContent(/Bypassed · Within your binding authority/);
  // Readiness has no progress bar, no dismiss and no current highlight.
  await expect(canvas.queryByRole('progressbar')).toBeNull();
  await expect(canvas.queryByRole('button', { name: /dismiss/i })).toBeNull();
  // Icons are decorative.
  for (const row of rows) await expect(row.querySelector('[aria-hidden="true"]')).not.toBeNull();
  return { canvas, list, rows };
};

export const ReadinessBlocked: Story = {
  name: 'Readiness / Blocked (dark)',
  decorators: themed('dark'),
  args: {
    ...readinessArgs,
    steps: bindConditions.map((s) => (s.actionLabel ? { ...s, onAction: fn() } : s)),
  },
  render: (args) => <WithBindButton {...args} />,
  play: async ({ canvasElement, args }) => {
    const { canvas } = await expectReadiness(canvasElement);
    // aria-describedby on the disabled Bind button resolves to the real summary line.
    const bind = canvas.getByRole('button', { name: 'Bind contract' });
    const describedBy = bind.getAttribute('aria-describedby') ?? '';
    const summary = canvasElement.ownerDocument.getElementById(describedBy);
    await expect(summary).not.toBeNull();
    await expect(summary).toHaveTextContent(/2 of 5 conditions not met/);
    await expect(bind).toHaveAccessibleDescription(/2 of 5 conditions not met/);
    // Links and actions are reachable in reading order with the keyboard.
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Go to documents' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'View referral' })).toHaveFocus();
    await userEvent.tab();
    const run = canvas.getByRole('button', { name: 'Run screening' });
    await expect(run).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    const step = args.steps.find((s) => s.id === 'sanctions') as OnboardingStep;
    await expect(step.onAction).toHaveBeenCalledTimes(1);
  },
};

export const ReadinessBlockedLight: Story = {
  name: 'Readiness / Blocked (light)',
  decorators: themed('light'),
  args: { ...readinessArgs, steps: bindConditions },
  render: (args) => <WithBindButton {...args} />,
  play: async ({ canvasElement }) => {
    await expectReadiness(canvasElement);
  },
};

const allMet: OnboardingStep[] = bindConditions.map((s) => ({
  id: s.id,
  title: s.title,
  status: 'met' as const,
  detail: s.id === 'sanctions' ? 'Clear · screened 27 Nov 2026, 14:30 ET' : s.detail,
}));

export const ReadinessAllMet: Story = {
  name: 'Readiness / All met (dark)',
  decorators: themed('dark'),
  args: { ...readinessArgs, summary: 'All 5 conditions met. Ready to bind.', steps: allMet },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rows = within(canvas.getByRole('list', { name: 'Ready to bind checklist' })).getAllByRole(
      'listitem',
    );
    for (const row of rows) await expect(row).toHaveTextContent(/Met: /);
    await expect(canvas.queryByText(/Not met/)).toBeNull();
  },
};

export const ReadinessAllMetLight: Story = {
  name: 'Readiness / All met (light)',
  decorators: themed('light'),
  args: { ...readinessArgs, summary: 'All 5 conditions met. Ready to bind.', steps: allMet },
};

/** Onboarding statuses passed to the readiness variant map to met / not met. */
export const ReadinessMappedStatuses: Story = {
  name: 'Readiness / Mapped from onboarding statuses',
  decorators: themed('dark'),
  args: {
    variant: 'readiness',
    title: 'Ready to bind',
    ariaLabel: 'Ready to bind checklist',
    steps: [
      { id: 'a', title: 'Loss runs received', status: 'complete' },
      { id: 'b', title: 'Inspection report reviewed', status: 'current' },
      { id: 'c', title: 'Broker of record letter on file', status: 'todo' },
    ],
  },
  play: async ({ canvasElement }) => {
    const rows = within(canvasElement).getAllByRole('listitem');
    await expect(rows[0]).toHaveTextContent(/Met: /);
    await expect(rows[1]).toHaveTextContent(/Not met · /);
    await expect(rows[2]).toHaveTextContent(/Not met · /);
  },
};

export const ReadinessLoading: Story = {
  name: 'Readiness / Loading',
  decorators: themed('dark'),
  args: { ...readinessArgs, steps: [], loading: true },
  render: (args) => (
    <div>
      <p role="status" style={{ margin: '0 0 8px' }}>
        Checking bind conditions…
      </p>
      <OnboardingChecklist {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('Checking bind conditions…');
    // Skeleton rows are hidden from assistive tech; no list or summary is exposed.
    await expect(canvas.queryByRole('list')).toBeNull();
    await expect(canvasElement.querySelector('[data-loading="true"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    await expect(canvasElement.ownerDocument.getElementById('bind-readiness-summary')).toBeNull();
  },
};

export const ReadinessEmpty: Story = {
  name: 'Readiness / Empty',
  decorators: themed('dark'),
  args: {
    variant: 'readiness',
    title: 'Ready to bind',
    ariaLabel: 'Ready to bind checklist',
    steps: [],
    emptyMessage: 'No bind conditions apply to this submission.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('list')).toBeNull();
    await expect(canvas.getByText('No bind conditions apply to this submission.')).toBeVisible();
  },
};

export const ReadinessNarrow: Story = {
  name: 'Readiness / 375 px',
  decorators: themed('light'),
  parameters: storyViewport(375),
  args: { ...readinessArgs, steps: bindConditions },
  play: async ({ canvasElement }) => {
    expectStoryViewport(375);
    await expectReadiness(canvasElement);
    const doc = canvasElement.ownerDocument.documentElement;
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
    // The link wraps under the text instead of squeezing the title.
    const link = within(canvasElement).getByRole('link', { name: 'Go to documents' });
    const title = link.closest('li')?.querySelector('div > span') as HTMLElement;
    await expect(title).toHaveTextContent('Signed application received');
    await expect(link.getBoundingClientRect().top).toBeGreaterThan(
      title.getBoundingClientRect().top,
    );
  },
};
