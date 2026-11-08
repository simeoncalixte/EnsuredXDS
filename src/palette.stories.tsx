import HeatmapChart from './components/HeatmapChart.js';
import React, { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within, waitFor } from '@storybook/test';
import { colors } from './colors.js';
import { palette, xdsThemes } from './palette.js';
import { useXdsTheme, XDS_THEME_STORAGE_KEY } from './theme.js';
import { Button } from './components/Button.js';
import { Input } from './components/Input.js';
import { Badge } from './components/Badge.js';
import { Card } from './components/Card.js';
import { ThemeToggle } from './components/ThemeToggle.js';
import { ValidationMessage } from './components/ValidationMessage.js';

function PaletteForm({ onSubmit }: { onSubmit: (payload: { name: string }) => void }) {
  const { themeName } = useXdsTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <main
      style={{
        background: colors.background,
        color: colors.text.primary,
        minHeight: '100vh',
        padding: 24,
      }}
    >
      <h1>Digital Vermilion palette</h1>
      <Button type="button" onClick={() => inputRef.current?.focus()}>
        Focus name
      </Button>
      <ThemeToggle />
      <p data-testid="theme">{themeName}</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBlock: 24 }}>
        {Object.entries(palette).map(([label, color]) => (
          <div key={label}>
            <div
              style={{
                background: color,
                width: 80,
                height: 60,
                border: `1px solid ${colors.outline}`,
              }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <Card style={{ maxWidth: 540 }}>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) {
              setError(true);
              return;
            }
            setError(false);
            onSubmit({ name: name.trim() });
            setSaved(true);
          }}
        >
          <label htmlFor="palette-name">Display name</label>
          <Input
            ref={inputRef}
            id="palette-name"
            value={name}
            aria-invalid={error}
            aria-describedby={error ? 'palette-error' : undefined}
            placeholder="Enter a name"
            onChange={(event) => setName(event.target.value)}
          />
          {error && <ValidationMessage id="palette-error">Enter a display name.</ValidationMessage>}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBlock: 24 }}>
            <Button type="submit">Save</Button>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
            <Button type="button" disabled>
              Unavailable
            </Button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['success', 'warning', 'danger', 'info'] as const).map((tone) => (
              <Badge key={tone} variant={tone}>
                {tone}
              </Badge>
            ))}
          </div>
          {saved && <p role="status">Saved {name.trim()}</p>}
        </form>
      </Card>
      <div data-testid="heatmap">
        <HeatmapChart
          cells={[
            { x: 'Marine', y: 'US', value: 100 },
            { x: 'Marine', y: 'CA', value: 50 },
          ]}
        />
      </div>
    </main>
  );
}
const meta = {
  title: 'XDS/Palette/Workflow',
  component: PaletteForm,
  args: { onSubmit: fn() },
} satisfies Meta<typeof PaletteForm>;
export default meta;
type Story = StoryObj<typeof meta>;
const rgb = (hex: string) =>
  `rgb(${hex
    .slice(1)
    .match(/../g)!
    .map((v) => parseInt(v, 16))
    .join(', ')})`;
export const ThemeAndForm: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    for (const name of ['light', 'dark'] as const) {
      if (document.documentElement.dataset.theme !== name)
        await userEvent.click(canvas.getByRole('button', { name: `Switch to ${name} theme` }));
      await waitFor(() => expect(document.documentElement.dataset.theme).toBe(name));
      await expect(localStorage.getItem(XDS_THEME_STORAGE_KEY)).toBe(name);
      const c = xdsThemes[name].colors;
      await expect(getComputedStyle(canvas.getByRole('main')).backgroundColor).toBe(
        rgb(c.background),
      );
      const save = canvas.getByRole('button', { name: 'Save' });
      await userEvent.unhover(save);
      await expect(getComputedStyle(save).backgroundColor).toBe(rgb(c.primary));
      await expect(getComputedStyle(save).color).toBe(rgb(c.onPrimary));
      await userEvent.hover(save);
      await userEvent.unhover(save);
      await expect(canvas.getByRole('button', { name: 'Unavailable' })).toBeDisabled();
      const cancel = canvas.getByRole('button', { name: 'Cancel' });
      await expect(getComputedStyle(cancel).backgroundColor).toBe(rgb(c.secondaryContainer));
      await expect(getComputedStyle(cancel).color).toBe(rgb(c.onSecondaryContainer));
      for (const tone of ['success', 'warning', 'danger', 'info']) {
        const badge = canvas.getByText(tone);
        await expect(getComputedStyle(badge).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
        await expect(getComputedStyle(badge).backgroundColor).not.toContain('NaN');
      }
    }
    await userEvent.click(canvas.getByRole('button', { name: 'Focus name' }));
    await expect(canvas.getByRole('textbox', { name: 'Display name' })).toHaveFocus();
    for (const rect of canvas.getByTestId('heatmap').querySelectorAll('rect')) {
      await expect(rect.getAttribute('fill')).not.toContain('NaN');
      await expect(getComputedStyle(rect).fill).not.toBe('none');
    }
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(canvas.getByRole('alert')).toHaveTextContent('Enter a display name.');
    await expect(args.onSubmit).not.toHaveBeenCalled();
    const input = canvas.getByRole('textbox', { name: 'Display name' });
    await userEvent.click(input);
    await userEvent.type(input, 'Digital Vermilion user');
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Save' })).toHaveFocus();
    await expect(getComputedStyle(canvas.getByRole('button', { name: 'Save' })).outlineStyle).toBe(
      'solid',
    );
    await userEvent.keyboard('{Enter}');
    await expect(args.onSubmit).toHaveBeenCalledTimes(1);
    await expect(args.onSubmit).toHaveBeenCalledWith({ name: 'Digital Vermilion user' });
    await expect(canvas.getByRole('status')).toHaveTextContent('Saved Digital Vermilion user');
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
  },
};
