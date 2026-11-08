import type { Meta, StoryObj } from '@storybook/react';
import { fn, expect, userEvent, within } from '@storybook/test';
import ResultsToolbar from './ResultsToolbar';
const meta = {
  title: 'Results/ResultsToolbar',
  component: ResultsToolbar,
  args: {
    title: 'Underwriting results',
    description: 'Results for the selected submissions.',
    periodLabel: 'Year to date',
    matchedCount: 24,
    activeFilterCount: 3,
    onOpenFilters: fn(),
    onClearFilters: fn(),
  },
} satisfies Meta<typeof ResultsToolbar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Filters (3)' }));
    await expect(args.onOpenFilters).toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Clear filters' }));
    await expect(args.onClearFilters).toHaveBeenCalled();
  },
};
export const Updating: Story = { args: { loading: true } };
export const NoFilters: Story = { args: { activeFilterCount: 0, matchedCount: 0 } };
