import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import Range from '../../components/Range.js';

const meta: Meta<typeof Range> = {
  id: 'xds-range',
  title: 'Form Elements/Range',
  component: Range,
  argTypes: {
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Range>;

export const Default: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: 50,
    'aria-label': 'Default range',
  },
};

export const Disabled: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: 25,
    disabled: true,
    'aria-label': 'Disabled range',
  },
};

export const CustomBounds: Story = {
  args: {
    min: 4,
    max: 25,
    step: 0.5,
    defaultValue: 14.5,
    'aria-label': 'Target yield',
  },
};

/**
 * Interaction test: a controlled slider with a visible readout.
 *
 * Play functions dispatch synthetic (untrusted) key events, and browsers don't
 * run a range input's default key action for those. So `userEvent.keyboard`
 * can't move a native slider. `pressSliderKey` does what the browser does for
 * that key (`stepUp`/`stepDown` by one `step`, then an `input` event), which
 * exercises the component's controlled wiring. Real key presses are checked by
 * the Playwright runner (see AIN-354).
 */
export const Controlled: Story = {
  render: function Render() {
    const [value, setValue] = React.useState(20);
    return (
      <div>
        <Range
          min={0}
          max={100}
          step={1}
          value={value}
          aria-label="Risk tolerance"
          onChange={(e) => setValue(Number(e.target.value))}
        />
        <output data-testid="readout">{value}</output>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole('slider', { name: 'Risk tolerance' }) as HTMLInputElement;
    const readout = canvas.getByTestId('readout');
    const expectValue = async (value: string) => {
      await expect(slider.value).toBe(value);
      await expect(readout).toHaveTextContent(value);
    };

    // Native range semantics stay: role slider with its bounds and step.
    await expect(slider).toHaveAttribute('type', 'range');
    await expect(slider).toHaveAttribute('min', '0');
    await expect(slider).toHaveAttribute('max', '100');
    await expect(slider).toHaveAttribute('step', '1');

    // Initial state reflects the controlled value.
    await expectValue('20');

    // A pointer change updates both the input and the readout.
    fireSliderChange(slider, 75);
    await expectValue('75');

    // Each keyboard step moves exactly one step, and the readout follows.
    slider.focus();
    await expect(slider).toHaveFocus();
    await pressSliderKey(slider, 'ArrowRight');
    await expectValue('76');
    await pressSliderKey(slider, 'ArrowUp');
    await expectValue('77');
    await pressSliderKey(slider, 'ArrowLeft');
    await expectValue('76');

    // The slider never widens the page.
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

// userEvent cannot drag a native range input, so dispatch a native input event.
function fireSliderChange(slider: HTMLInputElement, next: number) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(slider, String(next));
  slider.dispatchEvent(new Event('input', { bubbles: true }));
}

const stepKeys = {
  ArrowRight: 1,
  ArrowUp: 1,
  ArrowLeft: -1,
  ArrowDown: -1,
} as const;

// Sends the key, then applies the browser's own step for it if the synthetic
// event was ignored (it always is for untrusted events).
async function pressSliderKey(slider: HTMLInputElement, key: keyof typeof stepKeys) {
  const before = slider.value;
  await userEvent.keyboard(`{${key}}`);
  if (slider.value !== before) return;
  // stepUp/stepDown bypass React's value tracker, so the input event reaches onChange.
  if (stepKeys[key] > 0) slider.stepUp();
  else slider.stepDown();
  slider.dispatchEvent(new Event('input', { bubbles: true }));
}
