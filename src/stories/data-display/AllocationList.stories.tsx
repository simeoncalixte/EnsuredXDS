import type { Meta, StoryObj } from '@storybook/react';
import AllocationList from '../../components/AllocationList';
const meta = {
  id: 'results-allocationlist',
  title: 'Data Display/AllocationList',
  component: AllocationList,
  args: {
    basis: 'Share of matching submissions. Multi-line categories may overlap.',
    items: [
      { id: 'property', label: 'Property', formattedValue: '16 submissions', share: 66.7 },
      {
        id: 'cyber',
        label: 'Cyber',
        formattedValue: '8 submissions',
        share: 33.3,
        tone: 'tertiary',
      },
      {
        id: 'unknown',
        label: 'Unclassified',
        formattedValue: '4 submissions',
        share: null,
        annotation: { label: 'Needs discovery', tone: 'warning' },
      },
    ],
  },
} satisfies Meta<typeof AllocationList>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { items: [] } };
export const LongLabels: Story = {
  args: {
    items: [
      {
        id: 'long',
        label: 'Specialty international marine and energy construction liability',
        formattedValue: '3 submissions',
        share: 12.5,
      },
    ],
  },
};
