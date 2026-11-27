import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import Textarea from '../../components/Textarea.js';

const meta: Meta<typeof Textarea> = {
  id: 'xds-textarea',
  title: 'Form Elements/Textarea',
  component: Textarea,
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: 'Describe the risk exposure...',
    rows: 4,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Read only field',
    value: 'This textarea is disabled.',
    disabled: true,
    rows: 3,
  },
};

const ControlledTextarea: React.FC = () => {
  const [value, setValue] = useState('');
  return (
    <Textarea
      placeholder="Type your notes here..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
      rows={5}
    />
  );
};

export const Controlled: Story = {
  render: () => <ControlledTextarea />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByPlaceholderText('Type your notes here...') as HTMLTextAreaElement;
    await userEvent.type(textarea, 'Hello world');
    await expect(textarea).toHaveValue('Hello world');
  },
};

const DeclineReason: React.FC<{ initial?: string; invalid?: boolean }> = ({
  initial = '',
  invalid = false,
}) => {
  const [value, setValue] = useState(initial);
  return (
    <div style={{ display: 'grid', gap: 6, maxWidth: 560 }}>
      <label htmlFor="decline-reason">Reason for declining</label>
      <p id="decline-reason-hint" style={{ margin: 0 }}>
        The broker sees this reason on the referral.
      </p>
      <Textarea
        id="decline-reason"
        maxLength={500}
        showCount
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-describedby={
          invalid ? 'decline-reason-hint decline-reason-error' : 'decline-reason-hint'
        }
        aria-invalid={invalid || undefined}
      />
      {invalid && (
        <p id="decline-reason-error" style={{ margin: 0 }}>
          Error: enter a reason for declining.
        </p>
      )}
    </div>
  );
};

/** Decline reason with a 500-character limit and a visible "n / max" count. */
export const WithCount: Story = {
  render: () => <DeclineReason />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Reason for declining');
    await expect(textarea).toHaveAttribute('maxlength', '500');
    await expect(canvas.getByText('0 / 500')).toBeInTheDocument();
    await expect(textarea.getAttribute('aria-describedby')?.split(' ')).toEqual([
      'decline-reason-hint',
      'decline-reason-count',
    ]);
    await userEvent.type(textarea, 'Outside appetite');
    await expect(canvas.getByText('16 / 500')).toBeInTheDocument();
    // The polite announcement follows once typing pauses.
    await waitFor(
      () => expect(canvas.getByRole('status')).toHaveTextContent('16 of 500 characters used'),
      { timeout: 2000 },
    );
  },
};

/** Near the limit: the count updates but there is no colour-only warning. */
export const NearLimit: Story = {
  render: () => <DeclineReason initial={'Risk is outside underwriting appetite. '.repeat(12)} />,
};

/** At the limit: native maxLength stops input and the count says "limit reached" in text. */
export const AtLimit: Story = {
  render: () => <DeclineReason initial={'x'.repeat(500)} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Reason for declining') as HTMLTextAreaElement;
    await expect(canvas.getByText(/500 \/ 500/)).toHaveTextContent('500 / 500 · limit reached');
    await userEvent.type(textarea, 'more');
    await expect(textarea.value.length).toBe(500);
  },
};

/** Error state: the consumer's error id and the count are both in aria-describedby. */
export const WithCountInvalid: Story = {
  render: () => <DeclineReason invalid />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Reason for declining');
    await expect(textarea).toHaveAttribute('aria-invalid', 'true');
    for (const id of textarea.getAttribute('aria-describedby')!.split(' ')) {
      await expect(canvasElement.ownerDocument.getElementById(id)).not.toBeNull();
    }
  },
};

/** Disabled with a count. */
export const WithCountDisabled: Story = {
  args: {
    'aria-label': 'Reason for declining',
    maxLength: 500,
    showCount: true,
    disabled: true,
    defaultValue: 'Declined at referral: outside appetite.',
  },
};

/** Inside a narrow, non-positioned scroll container at 375 px: the hidden live region stays contained. */
export const WithCountInNarrowScroller: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => (
    <div style={{ overflowX: 'auto', width: 343 }}>
      <DeclineReason />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    await expect(doc.documentElement.scrollWidth).toBeLessThanOrEqual(
      doc.documentElement.clientWidth,
    );
  },
};
