import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, fn } from '@storybook/test';
import FinancialValue, {
  type FinancialValueProps,
  type FinancialValueState,
} from '../../components/FinancialValue.js';
import { cssVariables, xdsThemes, type XdsThemeName } from '../../palette.js';
import { colors } from '../../colors.js';

// All figures below are illustrative fixtures, not live financial data.
const recent = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

const viewports = {
  xds390: { name: '390 px', styles: { width: '390px', height: '844px' }, type: 'mobile' },
  xds1440: { name: '1440 px', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
};

const meta = {
  id: 'xds-financialvalue',
  title: 'Data Display/FinancialValue',
  component: FinancialValue,
  args: { amount: '4200000', currency: 'USD', state: 'verified', locale: 'en-US' },
  parameters: { viewport: { viewports } },
} satisfies Meta<typeof FinancialValue>;
export default meta;
type Story = StoryObj<typeof meta>;

const stateArgs: Record<FinancialValueState, Partial<FinancialValueProps>> = {
  verified: { amount: '4200000', asOf: recent, source: 'Ledger reconciliation' },
  pending: { amount: '1250000' },
  estimated: { amount: '980000', source: 'Pricing model v3' },
  illustrative: { amount: '4200000000', scale: 'compact' },
  unavailable: { amount: null, reason: 'No reconciled data yet.' },
  'mixed-currency': { amount: null, currency: null },
  loading: { amount: '4200000' },
};

const expectedText: Record<FinancialValueState, RegExp | null> = {
  verified: /USD\s4,200,000/,
  pending: /Pending/,
  estimated: /≈/,
  illustrative: /\$4\.2B USD/,
  unavailable: /Not available/,
  'mixed-currency': /Multiple currencies/,
  loading: null,
};

const expectedDescription: Record<FinancialValueState, RegExp | null> = {
  verified: /^Verified\. As of .* UTC\. Source: Ledger reconciliation\.$/,
  pending: /Not yet funded or confirmed\./,
  estimated: /Model estimate, not a confirmed figure\. Source: Pricing model v3\./,
  illustrative:
    /Illustrative value for demonstration\. Not live data\. Full value: USD\s4,200,000,000\./,
  unavailable: /^No reconciled data yet\.$/,
  'mixed-currency': /not summed/,
  loading: null,
};

function ThemeFrame({ theme, children }: React.PropsWithChildren<{ theme: XdsThemeName }>) {
  return (
    <div
      data-theme={theme}
      style={{
        ...(cssVariables(xdsThemes[theme]) as React.CSSProperties),
        background: colors.background,
        color: colors.text.primary,
        padding: 24,
        minHeight: 160,
        boxSizing: 'border-box',
        maxWidth: '100%',
      }}
    >
      {children}
    </div>
  );
}

const pascal = (state: string) =>
  state
    .split('-')
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join('');

const make = (state: FinancialValueState, theme: XdsThemeName, width: 390 | 1440): Story => ({
  name: `${pascal(state)} · ${theme} · ${width} px`,
  args: {
    state,
    ...stateArgs[state],
    ...(state === 'mixed-currency' ? { onViewByCurrency: fn() } : {}),
  },
  parameters: { viewport: { defaultViewport: width === 390 ? 'xds390' : 'xds1440' } },
  decorators: [
    (StoryFn) => (
      <ThemeFrame theme={theme}>
        <StoryFn />
      </ThemeFrame>
    ),
  ],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-xds="financial-value"]') as HTMLElement;
    await expect(root).toBeTruthy();
    await expect(root.dataset.state).toBe(state);
    const text = root.textContent ?? '';
    const expected = expectedText[state];
    if (expected) await expect(text).toMatch(expected);

    if (state === 'loading') {
      await expect(root).toHaveAttribute('aria-busy', 'true');
      await expect(text).toBe('');
      return;
    }
    if (state === 'unavailable') {
      await expect(text).not.toMatch(/0/);
      await expect(text).not.toMatch(/^\s*[—–-]\s*$/);
    }
    if (state === 'verified') {
      await expect(canvas.queryByText(/Pending|Estimate|Example/)).toBeNull();
      await expect(text).toMatch(/As of .* UTC/);
    }
    if (state === 'estimated') await expect(canvas.getByText('Estimate')).toBeVisible();
    if (state === 'illustrative') await expect(canvas.getByText('Example')).toBeVisible();

    // The description is reachable by keyboard focus.
    await userEvent.tab();
    const focused = canvasElement.ownerDocument.activeElement as HTMLElement;
    await expect(root.contains(focused)).toBe(true);
    const describedBy = focused.getAttribute('aria-describedby');
    await expect(describedBy).toBeTruthy();
    const description = canvasElement.ownerDocument.getElementById(describedBy as string);
    await expect(description?.textContent).toMatch(expectedDescription[state] as RegExp);
    await expect(description).toBeVisible();

    if (state === 'mixed-currency') {
      await userEvent.tab();
      await userEvent.keyboard('{Enter}');
      await expect(args.onViewByCurrency).toHaveBeenCalled();
    }
  },
});

export const VerifiedLight390 = make('verified', 'light', 390);
export const VerifiedLight1440 = make('verified', 'light', 1440);
export const VerifiedDark390 = make('verified', 'dark', 390);
export const VerifiedDark1440 = make('verified', 'dark', 1440);
export const PendingLight390 = make('pending', 'light', 390);
export const PendingLight1440 = make('pending', 'light', 1440);
export const PendingDark390 = make('pending', 'dark', 390);
export const PendingDark1440 = make('pending', 'dark', 1440);
export const EstimatedLight390 = make('estimated', 'light', 390);
export const EstimatedLight1440 = make('estimated', 'light', 1440);
export const EstimatedDark390 = make('estimated', 'dark', 390);
export const EstimatedDark1440 = make('estimated', 'dark', 1440);
export const IllustrativeLight390 = make('illustrative', 'light', 390);
export const IllustrativeLight1440 = make('illustrative', 'light', 1440);
export const IllustrativeDark390 = make('illustrative', 'dark', 390);
export const IllustrativeDark1440 = make('illustrative', 'dark', 1440);
export const UnavailableLight390 = make('unavailable', 'light', 390);
export const UnavailableLight1440 = make('unavailable', 'light', 1440);
export const UnavailableDark390 = make('unavailable', 'dark', 390);
export const UnavailableDark1440 = make('unavailable', 'dark', 1440);
export const MixedCurrencyLight390 = make('mixed-currency', 'light', 390);
export const MixedCurrencyLight1440 = make('mixed-currency', 'light', 1440);
export const MixedCurrencyDark390 = make('mixed-currency', 'dark', 390);
export const MixedCurrencyDark1440 = make('mixed-currency', 'dark', 1440);
export const LoadingLight390 = make('loading', 'light', 390);
export const LoadingLight1440 = make('loading', 'light', 1440);
export const LoadingDark390 = make('loading', 'dark', 390);
export const LoadingDark1440 = make('loading', 'dark', 1440);

/** Negative values keep a visible minus sign and use the danger text token. */
export const Negative: Story = {
  args: { amount: '-12500.50', state: 'verified', align: 'end' },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-xds="financial-value"]') as HTMLElement;
    await expect(root.textContent).toMatch(/−/);
    await expect(root.querySelector('[data-negative="true"]')).toBeTruthy();
  },
};

/** As-of times older than 24 hours are marked stale in warning tone. */
export const StaleAsOf: Story = {
  args: { state: 'verified', asOf: '2026-01-05T09:30:00Z', source: 'Quarterly close' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toMatch(/As of 5 Jan 2026, 09:30 UTC \(stale\)/);
  },
};

/** A null amount with an amount-bearing state falls back to unavailable (and warns in development). */
export const NullAmountFallback: Story = {
  args: { state: 'verified', amount: null },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-xds="financial-value"]') as HTMLElement;
    await expect(root.dataset.state).toBe('unavailable');
    await expect(root.textContent).toBe('Not available');
  },
};

/** Table usage: full scale, end-aligned, ISO code always shown. */
export const TableColumn: Story = {
  render: (args) => (
    <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 520 }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'start', padding: 8 }}>Facility</th>
          <th style={{ textAlign: 'end', padding: 8 }}>Committed</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ padding: 8 }}>Alpha Re</td>
          <td style={{ padding: 8, textAlign: 'end' }}>
            <FinancialValue {...args} amount="2500000" state="verified" align="end" />
          </td>
        </tr>
        <tr>
          <td style={{ padding: 8 }}>Beta Capital</td>
          <td style={{ padding: 8, textAlign: 'end' }}>
            <FinancialValue {...args} amount="750000.25" state="pending" align="end" />
          </td>
        </tr>
        <tr>
          <td style={{ padding: 8 }}>Gamma Fund</td>
          <td style={{ padding: 8, textAlign: 'end' }}>
            <FinancialValue
              {...args}
              amount={null}
              state="unavailable"
              align="end"
              reason="No reconciled data yet."
            />
          </td>
        </tr>
      </tbody>
    </table>
  ),
};
