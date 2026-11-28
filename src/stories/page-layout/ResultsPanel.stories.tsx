import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import ResultsPanel from '../../components/ResultsPanel';
const meta = {
  id: 'results-resultspanel',
  title: 'Page Layout/ResultsPanel',
  component: ResultsPanel,
  args: {
    title: 'Received submissions',
    description: 'Current filtered population',
    children: 'Place an XDS chart or data table here.',
  },
} satisfies Meta<typeof ResultsPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = {};
export const Loading: Story = { args: { state: 'loading' } };
export const Empty: Story = { args: { state: 'empty' } };
export const Unavailable: Story = {
  args: { state: 'unavailable', message: 'No historical snapshots are available.' },
};
export const Error: Story = { args: { state: 'error', onRetry: fn() } };

// AIN-322 (AIN-297 Revision 2.1) states.
const correlationId = 'req_7f3a9c21e4b84d0a'; // illustrative AIN-334 correlationId

export const UnavailableWithBasis: Story = {
  name: 'Unavailable with basis (silent)',
  args: {
    state: 'unavailable',
    title: 'Earned premium',
    message: 'Unavailable — not measured yet.',
    basis: 'Earned premium appears once policies are issued on the platform.',
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain('appears once policies are issued');
    await expect(canvasElement.querySelectorAll('[role="alert"], [role="status"]')).toHaveLength(0);
  },
};

export const ErrorDefaultCopy: Story = {
  name: 'Error (default copy, Try again)',
  args: { state: 'error', onRetry: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const alerts = canvas.getAllByRole('alert');
    await expect(alerts).toHaveLength(1);
    await expect(alerts[0].textContent).toContain(
      "We couldn't load this panel. The other panels aren't affected. Try again in a moment.",
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole('button', { name: 'Retry' })).toBeNull();
  },
};

export const ErrorWithReference: Story = {
  name: 'Error with reference',
  args: { state: 'error', onRetry: fn(), reference: correlationId },
  play: async ({ canvasElement }) => {
    const alerts = within(canvasElement).getAllByRole('alert');
    await expect(alerts).toHaveLength(1);
    await expect(alerts[0].textContent).toContain(`Reference: ${correlationId}`);
    await expect(canvasElement.textContent?.toLowerCase()).not.toContain('quote');
  },
};

const admin = (
  <dl style={{ margin: 0 }}>
    <dt>Correlation id</dt>
    <dd>{correlationId}</dd>
    <dt>Status</dt>
    <dd>503 from the results service</dd>
  </dl>
);

export const ErrorWithAdminDetailsCollapsed: Story = {
  name: 'Error with admin details · collapsed',
  args: { state: 'error', onRetry: fn(), reference: correlationId, adminDetails: admin },
  play: async ({ canvasElement }) => {
    const details = canvasElement.querySelector('details') as HTMLDetailsElement;
    await expect(details.open).toBe(false);
    await expect(details.querySelector('summary')?.textContent).toBe(
      'Technical details (admins only)',
    );
    await expect(within(canvasElement).getAllByRole('alert')).toHaveLength(1);
  },
};

export const ErrorWithAdminDetailsExpanded: Story = {
  name: 'Error with admin details · expanded',
  args: { state: 'error', onRetry: fn(), reference: correlationId, adminDetails: admin },
  play: async ({ canvasElement }) => {
    const summary = within(canvasElement).getByText('Technical details (admins only)');
    // Native <summary> is in the tab order; keyboard Enter/Space activate it like a click.
    await expect(summary.tabIndex).toBeGreaterThanOrEqual(0);
    await userEvent.click(summary);
    const details = canvasElement.querySelector('details') as HTMLDetailsElement;
    await expect(details.open).toBe(true);
    await expect(details.textContent).toContain('503 from the results service');
  },
};

export const HeadingLevel3: Story = {
  name: 'Heading level 3',
  args: { headingLevel: 3 },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('heading', { level: 3, name: 'Received submissions' }),
    ).toBeInTheDocument();
  },
};
