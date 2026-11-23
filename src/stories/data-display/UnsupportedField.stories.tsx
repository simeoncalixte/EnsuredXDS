import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import UnsupportedField from '../../components/UnsupportedField.js';

const meta: Meta<typeof UnsupportedField> = {
  id: 'xds-unsupportedfield',
  title: 'Data Display/UnsupportedField',
  component: UnsupportedField,
  argTypes: {
    label: { control: 'text' },
    path: { control: 'text' },
    componentRef: { control: 'text' },
    reason: { control: 'inline-radio', options: ['unknown-ref', 'not-form-allowed', 'retired'] },
    reasonText: { control: 'text' },
    truncateAt: { control: 'number' },
    emptyLabel: { control: 'text' },
    value: { control: 'object' },
  },
};

export default meta;
type Story = StoryObj<typeof UnsupportedField>;

/** Checks the group's name and that every aria-describedby id resolves to a real element. */
const expectAccessibleGroup = async (canvasElement: HTMLElement, label: string) => {
  const canvas = within(canvasElement);
  const group = canvas.getByRole('group', { name: label });
  const ids = (group.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
  await expect(ids.length).toBe(2);
  for (const id of ids) {
    await expect(canvasElement.ownerDocument.getElementById(id)).not.toBeNull();
  }
  await expect(within(group).getByText('Read-only')).toBeVisible();
  return group;
};

export const ScalarValue: Story = {
  args: {
    label: 'Years in business',
    path: 'insured.yearsInBusiness',
    componentRef: 'xds.legacy-stepper',
    reason: 'unknown-ref',
    value: 12,
  },
  play: async ({ canvasElement }) => {
    const group = await expectAccessibleGroup(canvasElement, 'Years in business');
    await expect(within(group).getByText('12')).toBeVisible();
    await expect(within(group).getByText(/isn't recognised/)).toBeVisible();
  },
};

/** Decimal strings are shown exactly as stored: no rounding or float maths. */
export const ExactDecimal: Story = {
  args: {
    label: 'Total insured value',
    path: 'exposure.tiv',
    componentRef: 'xds.tiv-builder',
    reason: 'retired',
    value: '125000000.10',
  },
  play: async ({ canvasElement }) => {
    const group = await expectAccessibleGroup(canvasElement, 'Total insured value');
    await expect(within(group).getByText('125000000.10')).toBeVisible();
    await expect(within(group).getByText(/has been retired/)).toBeVisible();
  },
};

export const ObjectValue: Story = {
  args: {
    label: 'Prior carrier',
    path: 'lossHistory.priorCarrier',
    componentRef: 'xds.carrier-picker',
    reason: 'not-form-allowed',
    value: {
      carrier: 'Northbridge Mutual',
      policyNumber: 'NBM-CP-0048213',
      expirationDate: '2026-12-31',
      nonRenewed: false,
      cancellationReason: null,
    },
  },
  play: async ({ canvasElement }) => {
    const group = await expectAccessibleGroup(canvasElement, 'Prior carrier');
    await expect(within(group).getByText('policyNumber')).toBeVisible();
    await expect(within(group).getByText('NBM-CP-0048213')).toBeVisible();
    await expect(within(group).getByText('false')).toBeVisible();
    await expect(within(group).getByText(/isn't allowed in forms/)).toBeVisible();
  },
};

export const ArrayOfRecords: Story = {
  args: {
    label: 'Schedule of locations',
    path: 'insured.locations',
    componentRef: 'xds.location-schedule',
    reason: 'unknown-ref',
    value: [
      {
        locationId: 'L-001',
        address: '12 Harbour Rd, Boston MA',
        tiv: '18500000',
        construction: 'Masonry non-combustible',
      },
      {
        locationId: 'L-002',
        address: '400 Mill St, Lowell MA',
        tiv: '6200000.50',
        sprinklered: true,
      },
      { locationId: 'L-003', address: '9 Pier Ave, Salem MA', tiv: null },
    ],
  },
  play: async ({ canvasElement }) => {
    const group = await expectAccessibleGroup(canvasElement, 'Schedule of locations');
    const region = within(group).getByRole('region', {
      name: 'Schedule of locations: stored records',
    });
    await expect(region).toHaveAttribute('tabindex', '0');
    const table = within(region).getByRole('table');
    // Union of keys across all rows: no column is dropped.
    for (const col of ['locationId', 'address', 'tiv', 'construction', 'sprinklered']) {
      await expect(within(table).getByRole('columnheader', { name: col })).toBeInTheDocument();
    }
    await expect(within(table).getAllByRole('row')).toHaveLength(4);
    await expect(within(table).getByText('6200000.50')).toBeInTheDocument();
  },
};

export const ArrayOfScalars: Story = {
  args: {
    label: 'Operations',
    path: 'insured.operations',
    componentRef: 'xds.tag-picker',
    reason: 'retired',
    value: ['Warehousing', 'Cold storage', 'Light assembly'],
  },
  play: async ({ canvasElement }) => {
    const group = await expectAccessibleGroup(canvasElement, 'Operations');
    await expect(within(group).getAllByRole('listitem')).toHaveLength(3);
  },
};

export const EmptyValue: Story = {
  args: {
    label: 'Additional insureds',
    path: 'policy.additionalInsureds',
    componentRef: 'xds.additional-insured-list',
    reason: 'unknown-ref',
    value: [],
  },
  play: async ({ canvasElement }) => {
    const group = await expectAccessibleGroup(canvasElement, 'Additional insureds');
    await expect(within(group).getByText('No value recorded')).toBeVisible();
  },
};

const longNarrative =
  'Insured operates three refrigerated warehouses. In 2024 a compressor failure at L-002 caused a spoilage loss of 412,000 USD, paid under the equipment breakdown extension. Since then the insured has installed redundant compressors, remote temperature monitoring with 24/7 alerting, and a backup generator rated for 72 hours of full load. The underwriter requested the maintenance logs for the last 36 months, which are attached to the submission.';

export const LongValue: Story = {
  args: {
    label: 'Loss narrative',
    path: 'lossHistory.narrative',
    componentRef: 'xds.rich-text',
    reason: 'not-form-allowed',
    value: longNarrative,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = await expectAccessibleGroup(canvasElement, 'Loss narrative');
    const toggle = within(group).getByRole('button', { name: 'Show full value' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const controlled = canvasElement.ownerDocument.getElementById(
      toggle.getAttribute('aria-controls') ?? '',
    );
    await expect(controlled).not.toBeNull();
    await expect(canvas.queryByText(longNarrative)).toBeNull();

    // Keyboard: Tab reaches the toggle and Enter expands it.
    await userEvent.tab();
    await expect(toggle).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveTextContent('Show less');
    await expect(canvas.getByText(longNarrative)).toBeVisible();
  },
};

export const CustomReason: Story = {
  args: {
    label: 'Catastrophe model output',
    path: 'modelling.natCat',
    componentRef: 'xds.cat-model-viewer',
    reason: 'unknown-ref',
    reasonText: 'Shown read-only until the catastrophe model viewer is available.',
    value: { aal: '84210.00', pml250: '3900000', model: 'Vendor A v23' },
  },
};

export const NarrowViewport: Story = {
  args: ArrayOfRecords.args,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
};
