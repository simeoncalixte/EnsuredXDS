import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import RightHandPanel from '../../components/RightHandPanel';

const meta = {
  id: 'layout-righthandpanel',
  title: 'Filters/RightHandPanel',
  component: RightHandPanel,
} satisfies Meta<typeof RightHandPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
function Fixture() {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState('');
  return (
    <>
      <p data-testid="payload">{submitted || 'No filter submitted'}</p>
      <RightHandPanel title="Filters">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(JSON.stringify({ territory: value }));
          }}
        >
          <label>
            Territory
            <input value={value} onChange={(e) => setValue(e.target.value)} />
          </label>
          <button type="submit">Apply filters</button>
          <button type="button" onClick={() => setValue('')}>
            Reset filters
          </button>
        </form>
      </RightHandPanel>
    </>
  );
}
export const ApplyResetAndKeyboard: Story = {
  args: { title: 'Filters', children: null },
  render: () => <Fixture />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      trigger = c.getByRole('button', { name: 'Filters' });
    await userEvent.click(trigger);
    const panel = c.getByRole('dialog', { name: 'Filters' }),
      p = within(panel);
    await expect(panel).toHaveFocus();
    await userEvent.type(p.getByRole('textbox', { name: 'Territory' }), 'US-NY');
    await userEvent.click(p.getByRole('button', { name: 'Apply filters' }));
    await expect(c.getByTestId('payload')).toHaveTextContent('{"territory":"US-NY"}');
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveFocus();
    await expect(c.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(trigger);
    await expect(p.getByRole('textbox')).toHaveValue('US-NY');
    await userEvent.click(p.getByRole('button', { name: 'Reset filters' }));
    await userEvent.click(p.getByRole('button', { name: 'Apply filters' }));
    await expect(c.getByTestId('payload')).toHaveTextContent('{"territory":""}');
    await userEvent.click(p.getByRole('button', { name: 'Close filters' }));
    await expect(trigger).toHaveFocus();
  },
};
