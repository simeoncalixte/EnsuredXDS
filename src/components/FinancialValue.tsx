import React, { useEffect, useId, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { colors } from '../colors.js';
import { radii, spacing, typography, zIndices } from '../tokens.js';

/**
 * Truthfulness state of a financial figure. Every money amount, ratio or
 * financial count shown in a product UI must declare one of these states.
 */
export type FinancialValueState =
  | 'verified'
  | 'pending'
  | 'estimated'
  | 'illustrative'
  | 'unavailable'
  | 'mixed-currency'
  | 'loading';

export type FinancialValueProps = {
  /** Decimal string such as "4200000" or "-12.50". `null` when the value is unknown. */
  amount: string | null;
  /** ISO 4217 code such as "USD". `null` for ratios and counts. */
  currency: string | null;
  state: FinancialValueState;
  /** ISO datetime of the figure. Adds an "As of … UTC" caption. */
  asOf?: string;
  /** Short source label, e.g. "Ledger reconciliation". */
  source?: string;
  /** Why the value is unavailable or otherwise qualified. */
  reason?: string;
  /** `compact` is for headline tiles only; the full value moves into the description. */
  scale?: 'full' | 'compact';
  /** Use `end` in table columns. */
  align?: 'start' | 'end';
  /** Shown as a "View by currency" link button in the `mixed-currency` state. */
  onViewByCurrency?: () => void;
  /** BCP 47 locale. Defaults to the browser locale. */
  locale?: string;
  className?: string;
};

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
const DECIMAL = /^-?\d+(\.\d+)?$/;
const AMOUNT_STATES = new Set<FinancialValueState>([
  'verified',
  'pending',
  'estimated',
  'illustrative',
]);

const STATE_DESCRIPTIONS: Partial<Record<FinancialValueState, string>> = {
  pending: 'Not yet funded or confirmed.',
  estimated: 'Model estimate, not a confirmed figure.',
  illustrative: 'Illustrative value for demonstration. Not live data.',
  'mixed-currency': 'Amounts are in more than one currency and are not summed.',
};

const CHIPS: Partial<Record<FinancialValueState, { label: string; tone: ChipTone }>> = {
  pending: { label: 'Pending', tone: 'outline' },
  estimated: { label: 'Estimate', tone: 'info' },
  illustrative: { label: 'Example', tone: 'warning' },
};

type ChipTone = 'outline' | 'info' | 'warning';

const isDevelopment = (): boolean => {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
};

const activeLocale = (locale?: string): string | undefined =>
  locale ?? (typeof navigator !== 'undefined' ? navigator.language : undefined);

const withMinusSign = (parts: Intl.NumberFormatPart[]): string =>
  parts.map((part) => (part.type === 'minusSign' ? '−' : part.value)).join('');

const fractionDigits = (amount: string): number => amount.split('.')[1]?.length ?? 0;

/** Intl.NumberFormat accepts decimal strings exactly; older lib typings only declare numbers. */
const toParts = (formatter: Intl.NumberFormat, amount: string): Intl.NumberFormatPart[] =>
  formatter.formatToParts(amount as unknown as number);

export function formatFinancialAmount(
  amount: string,
  currency: string | null,
  scale: 'full' | 'compact',
  locale?: string,
): { text: string; full: string } {
  const loc = activeLocale(locale);
  const decimals = fractionDigits(amount);
  let fullFormatter: Intl.NumberFormat;
  if (currency) {
    const currencyDigits =
      new Intl.NumberFormat(loc, { style: 'currency', currency }).resolvedOptions()
        .maximumFractionDigits ?? 2;
    const digits = decimals === 0 ? 0 : currencyDigits;
    fullFormatter = new Intl.NumberFormat(loc, {
      style: 'currency',
      currency,
      currencyDisplay: 'code',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  } else {
    fullFormatter = new Intl.NumberFormat(loc, {
      maximumFractionDigits: Math.min(decimals, 6),
    });
  }
  const full = withMinusSign(toParts(fullFormatter, amount));
  if (scale !== 'compact') return { text: full, full };

  const compactFormatter = new Intl.NumberFormat(loc, {
    notation: 'compact',
    maximumFractionDigits: 1,
    ...(currency ? { style: 'currency', currency, currencyDisplay: 'narrowSymbol' } : {}),
  });
  let text = withMinusSign(toParts(compactFormatter, amount));
  if (currency && !text.includes(currency.toUpperCase()))
    text = `${text} ${currency.toUpperCase()}`;
  return { text, full };
}

/** Formats an ISO datetime as "20 Nov 2026, 14:05" in UTC. Returns null when invalid. */
export function formatFinancialAsOf(asOf: string, locale?: string): string | null {
  const date = new Date(asOf);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat(activeLocale(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('day')} ${part('month')} ${part('year')}, ${part('hour')}:${part('minute')}`;
}

type Resolved = {
  state: FinancialValueState;
  text: string | null;
  full: string | null;
  negative: boolean;
  warning: string | null;
};

function resolve(
  amount: string | null,
  currency: string | null,
  state: FinancialValueState,
  scale: 'full' | 'compact',
  locale?: string,
): Resolved {
  const empty = { text: null, full: null, negative: false };
  if (!AMOUNT_STATES.has(state)) return { state, ...empty, warning: null };
  if (amount == null) {
    return {
      state: 'unavailable',
      ...empty,
      warning: `FinancialValue: amount is null with state "${state}"; rendering "unavailable".`,
    };
  }
  const trimmed = amount.trim();
  if (!DECIMAL.test(trimmed)) {
    return {
      state: 'unavailable',
      ...empty,
      warning: `FinancialValue: "${amount}" is not a decimal string; rendering "unavailable".`,
    };
  }
  try {
    const { text, full } = formatFinancialAmount(trimmed, currency, scale, locale);
    const negative = trimmed.startsWith('-') && /[1-9]/.test(trimmed);
    return { state, text, full, negative, warning: null };
  } catch {
    return {
      state: 'unavailable',
      ...empty,
      warning: `FinancialValue: currency "${currency}" is not a valid ISO 4217 code; rendering "unavailable".`,
    };
  }
}

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
`;

const Root = styled.span<{ $align: 'start' | 'end' }>`
  position: relative;
  display: inline-flex;
  flex-direction: column;
  gap: ${spacing.xs}px;
  align-items: ${({ $align }) => ($align === 'end' ? 'flex-end' : 'flex-start')};
  text-align: ${({ $align }) => $align};
  max-width: 100%;
  color: ${colors.text.primary};
  font-variant-numeric: tabular-nums;
`;

const Line = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${spacing.sm}px;
  max-width: 100%;
  border-radius: ${radii.sm}px;

  &:focus {
    outline: none;
  }
  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }
`;

const ValueText = styled.span<{ $tone: 'default' | 'muted' | 'danger' }>`
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
  color: ${({ $tone }) =>
    $tone === 'danger'
      ? colors.danger
      : $tone === 'muted'
        ? colors.text.secondary
        : colors.text.primary};
`;

const chipTones: Record<ChipTone, string> = {
  outline: colors.text.secondary,
  info: colors.info,
  warning: colors.warning,
};

const Chip = styled.span<{ $tone: ChipTone }>`
  display: inline-flex;
  align-items: center;
  padding: 2px ${spacing.sm}px;
  border-radius: ${radii.round}px;
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.xs}px;
  font-weight: ${typography.weights.semibold};
  line-height: 1.4;
  white-space: nowrap;
  background: transparent;
  ${({ $tone }) => css`
    color: ${chipTones[$tone]};
    border: 1px solid ${$tone === 'outline' ? colors.outline : chipTones[$tone]};
  `}
`;

const LinkButton = styled.button`
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: ${typography.sizes.sm}px;
  color: ${colors.text.primary};
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  border-radius: ${radii.sm}px;

  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }
`;

const Caption = styled.span`
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.xs}px;
  color: ${colors.text.secondary};
`;

const Stale = styled.span`
  color: ${colors.warning};
  font-weight: ${typography.weights.semibold};
`;

const Skeleton = styled.span<{ $width: number }>`
  display: inline-block;
  width: ${({ $width }) => $width}ch;
  max-width: 100%;
  height: 1em;
  border-radius: ${radii.sm}px;
  background: ${colors.surfaceContainerHigh};
  animation: ${pulse} 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Tooltip = styled.span<{ $align: 'start' | 'end' }>`
  position: absolute;
  top: calc(100% + ${spacing.xs}px);
  ${({ $align }) => ($align === 'end' ? 'right: 0;' : 'left: 0;')}
  z-index: ${zIndices.dropdown};
  width: max-content;
  max-width: min(280px, 80vw);
  padding: ${spacing.sm}px ${spacing.sm + 4}px;
  border-radius: ${radii.md}px;
  border: 1px solid ${colors.outlineVariant};
  background: ${colors.surfaceRaised};
  color: ${colors.onSurface};
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.xs}px;
  font-weight: ${typography.weights.regular};
  line-height: 1.5;
  text-align: start;
  white-space: normal;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;

  ${Root}:hover:not([data-dismissed='true']) > &,
  ${Root}:focus-within:not([data-dismissed='true']) > & {
    visibility: visible;
    opacity: 1;
  }
`;

/**
 * Renders a money amount, ratio or financial count together with its
 * truthfulness state, currency, as-of time and source. Unknown values are
 * shown as "Not available" and never as 0.
 */
export function FinancialValue({
  amount,
  currency,
  state,
  asOf,
  source,
  reason,
  scale = 'full',
  align = 'start',
  onViewByCurrency,
  locale,
  className,
}: FinancialValueProps) {
  const descriptionId = useId();
  const [dismissed, setDismissed] = useState(false);
  const resolved = resolve(amount, currency, state, scale, locale);
  const shownState = resolved.state;

  const asOfText = asOf ? formatFinancialAsOf(asOf, locale) : null;
  const stale =
    asOfText != null && Date.now() - new Date(asOf as string).getTime() > STALE_AFTER_MS;
  const invalidAsOf = asOf != null && asOfText == null;

  useEffect(() => {
    if (!isDevelopment()) return;
    if (resolved.warning) console.warn(resolved.warning);
    if (invalidAsOf) console.warn(`FinancialValue: asOf "${asOf}" is not a valid ISO datetime.`);
  }, [resolved.warning, invalidAsOf, asOf]);

  if (shownState === 'loading') {
    const width =
      amount && DECIMAL.test(amount.trim())
        ? (resolve(amount, currency, 'verified', scale, locale).text?.length ?? 10)
        : 10;
    return (
      <Root
        $align={align}
        className={className}
        data-xds="financial-value"
        data-state="loading"
        aria-busy="true"
      >
        <Skeleton $width={Math.max(4, width)} aria-hidden="true" />
      </Root>
    );
  }

  const sentences: string[] = [];
  if (shownState === 'verified') {
    sentences.push('Verified.');
  } else if (STATE_DESCRIPTIONS[shownState]) {
    sentences.push(STATE_DESCRIPTIONS[shownState] as string);
  }
  if (asOfText) sentences.push(`As of ${asOfText} UTC${stale ? ' (stale)' : ''}.`);
  if (source) sentences.push(`Source: ${source}.`);
  if (scale === 'compact' && resolved.full && resolved.full !== resolved.text) {
    sentences.push(`Full value: ${resolved.full}.`);
  }
  if (reason) sentences.push(reason);
  const description = sentences.join(' ');
  const hasDescription = description.length > 0;

  const chip = CHIPS[shownState];
  let valueNode: React.ReactNode;
  if (shownState === 'unavailable') {
    valueNode = <ValueText $tone="muted">Not available</ValueText>;
  } else if (shownState === 'mixed-currency') {
    valueNode = <ValueText $tone="default">Multiple currencies</ValueText>;
  } else {
    const tone = resolved.negative ? 'danger' : shownState === 'illustrative' ? 'muted' : 'default';
    valueNode = (
      <ValueText $tone={tone} data-negative={resolved.negative ? 'true' : undefined}>
        {shownState === 'estimated' ? '≈ ' : ''}
        {resolved.text}
      </ValueText>
    );
  }

  return (
    <Root
      $align={align}
      className={className}
      data-xds="financial-value"
      data-state={shownState}
      data-dismissed={dismissed ? 'true' : undefined}
      onMouseLeave={() => setDismissed(false)}
      onKeyDown={(event: React.KeyboardEvent) => {
        if (event.key === 'Escape') setDismissed(true);
      }}
      onBlur={() => setDismissed(false)}
    >
      <Line
        tabIndex={hasDescription ? 0 : undefined}
        role={hasDescription ? 'group' : undefined}
        aria-describedby={hasDescription ? descriptionId : undefined}
      >
        {valueNode}
        {chip ? <Chip $tone={chip.tone}>{chip.label}</Chip> : null}
      </Line>
      {shownState === 'mixed-currency' && onViewByCurrency ? (
        <LinkButton type="button" onClick={onViewByCurrency}>
          View by currency
        </LinkButton>
      ) : null}
      {asOfText ? (
        <Caption>
          As of {asOfText} UTC{stale ? <Stale> (stale)</Stale> : null}
        </Caption>
      ) : null}
      {hasDescription ? (
        <Tooltip role="tooltip" id={descriptionId} $align={align}>
          {description}
        </Tooltip>
      ) : null}
    </Root>
  );
}

export default FinancialValue;
