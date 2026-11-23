import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, expect } from '@storybook/test';
import {
  RequestedCoverageEditor,
  type RequestedCoverage,
  type RequestedCoverageEditorProps,
} from '../../components/RequestedCoverageEditor.js';
import { ValidationMessage } from '../../components/ValidationMessage.js';

const meta: Meta<typeof RequestedCoverageEditor> = {
  id: 'xds-requestedcoverageeditor',
  title: 'Insurance/RequestedCoverageEditor',
  component: RequestedCoverageEditor,
};

export default meta;

type Story = StoryObj<typeof RequestedCoverageEditor>;

const coverages: RequestedCoverage[] = [
  {
    coverageId: 'property',
    name: 'Property',
    selected: true,
    limit: 5000000,
    limitCurrencyCode: 'USD',
    deductible: 25000,
    deductibleCurrencyCode: 'USD',
    terms: '',
  },
  {
    coverageId: 'business-interruption',
    name: 'Business Interruption',
    selected: true,
    limit: null,
    deductible: 'Per policy wording',
    terms: '',
  },
];

const Controlled: React.FC<Omit<RequestedCoverageEditorProps, 'value' | 'onChange'>> = (props) => {
  const [value, setValue] = useState(coverages);
  return <RequestedCoverageEditor {...props} value={value} onChange={setValue} />;
};

const rowErrors: RequestedCoverageEditorProps['fieldErrors'] = [
  { deductible: 'Deductible must be less than the limit.' },
  { limit: 'Enter a limit.', deductible: 'Use a monetary amount for the deductible.' },
];

export const Default: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole('group', { name: 'Requested Coverage' });
    expect(group).not.toHaveAttribute('aria-invalid');
  },
};

export const Disabled: Story = {
  name: 'Disabled (read-only)',
  render: () => <Controlled readOnly />,
};

const describedByResolves = (el: HTMLElement, text: string) => {
  const id = el.getAttribute('aria-describedby');
  expect(id).toBeTruthy();
  const message = el.ownerDocument.getElementById(id!);
  expect(message).not.toBeNull();
  expect(message).toHaveTextContent(text);
};

const GroupInvalid: React.FC<{ readOnly?: boolean }> = ({ readOnly }) => (
  <div>
    <Controlled invalid describedBy="coverage-error" readOnly={readOnly} />
    <ValidationMessage id="coverage-error">Request at least one coverage.</ValidationMessage>
  </div>
);

export const InvalidGroup: Story = {
  render: () => <GroupInvalid />,
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole('group', { name: 'Requested Coverage' });
    expect(group).toHaveAttribute('aria-invalid', 'true');
    describedByResolves(group, 'Request at least one coverage.');
  },
};

export const InvalidRows: Story = {
  render: () => <Controlled fieldErrors={rowErrors} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const propertyDeductible = canvas.getByRole('textbox', { name: 'Property deductible amount' });
    expect(propertyDeductible).toHaveAttribute('aria-invalid', 'true');
    describedByResolves(propertyDeductible, 'Deductible must be less than the limit.');

    const biLimit = canvas.getByRole('textbox', { name: 'Business Interruption limit amount' });
    expect(biLimit).toHaveAttribute('aria-invalid', 'true');
    describedByResolves(biLimit, 'Enter a limit.');

    const biDeductible = canvas.getByRole('textbox', {
      name: 'Business Interruption deductible terms',
    });
    expect(biDeductible).toHaveAttribute('aria-invalid', 'true');
    describedByResolves(biDeductible, 'Use a monetary amount for the deductible.');

    const propertyLimit = canvas.getByRole('textbox', { name: 'Property limit amount' });
    expect(propertyLimit).not.toHaveAttribute('aria-invalid');
    expect(propertyLimit).not.toHaveAttribute('aria-describedby');
  },
};

export const InvalidDisabled: Story = {
  name: 'Invalid + disabled (read-only)',
  render: () => (
    <div>
      <Controlled invalid describedBy="coverage-error-ro" readOnly fieldErrors={rowErrors} />
      <ValidationMessage id="coverage-error-ro">
        This archived submission has errors.
      </ValidationMessage>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: 'Requested Coverage' });
    expect(group).toHaveAttribute('aria-invalid', 'true');
    describedByResolves(group, 'This archived submission has errors.');
    const propertyDeductible = canvas.getByRole('textbox', { name: 'Property deductible amount' });
    expect(propertyDeductible).toBeDisabled();
    expect(propertyDeductible).toHaveAttribute('aria-invalid', 'true');
    describedByResolves(propertyDeductible, 'Deductible must be less than the limit.');
  },
};
