import React from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';
import { spacing, radii, typography } from '../tokens.js';

export type XdsTextareaProps = React.ComponentPropsWithRef<'textarea'> & {
  /**
   * Show a visible "n / max" character count under the field. Needs `maxLength`.
   * The count is linked to the textarea with aria-describedby, and a polite live
   * region announces it after typing pauses (not on every keystroke).
   */
  showCount?: boolean;
  /**
   * Text for the polite announcement. Default: "120 of 500 characters used".
   * Pass a function to localise it; it receives the current count and the maximum.
   */
  countAnnouncement?: (count: number, max: number) => string;
  /** Milliseconds after the last keystroke before the count is announced. Default 750. */
  announceDelay?: number;
  /** Visible text added after the count when it reaches `maxLength`. Default "limit reached". */
  limitReachedText?: string;
};

const StyledTextarea = styled.textarea`
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid ${colors.outlineVariant};
  padding: ${spacing.sm}px 0;
  color: ${colors.text.primary};
  outline: none;
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.md}px;
  line-height: 1.5;
  resize: vertical;
  border-radius: ${radii.none}px;

  &::placeholder {
    color: ${colors.text.secondary};
  }

  &:focus {
    border-bottom-color: ${colors.primary};
  }

  &[aria-invalid='true'] {
    border-bottom-color: ${colors.error};
  }

  &:disabled {
    color: ${colors.text.secondary};
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

// Positioned so the visually hidden live region can't escape a scroll container.
const CountWrapper = styled.div`
  position: relative;
  display: grid;
  gap: ${spacing.xs}px;
  width: 100%;
`;

const Count = styled.p<{ $atLimit: boolean }>`
  margin: 0;
  justify-self: end;
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.sm}px;
  font-variant-numeric: tabular-nums;
  font-weight: ${({ $atLimit }) =>
    $atLimit ? typography.weights.semibold : typography.weights.regular};
  color: ${({ $atLimit }) => ($atLimit ? colors.text.primary : colors.text.secondary)};
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
`;

const defaultAnnouncement = (count: number, max: number) => `${count} of ${max} characters used`;

/** Counts characters the way the native `maxLength` does (UTF-16 code units). */
const lengthOf = (value: unknown) =>
  value === undefined || value === null ? 0 : String(value).length;

export const Textarea: React.FC<XdsTextareaProps> = ({
  rows = 4,
  showCount = false,
  countAnnouncement = defaultAnnouncement,
  announceDelay = 750,
  limitReachedText = 'limit reached',
  maxLength,
  id,
  value,
  defaultValue,
  onChange,
  'aria-describedby': describedBy,
  ...rest
}) => {
  const fallbackId = React.useId();
  const countEnabled = showCount && typeof maxLength === 'number' && maxLength > 0;
  const isControlled = value !== undefined;
  const [uncontrolledLength, setUncontrolledLength] = React.useState(() => lengthOf(defaultValue));
  const length = isControlled ? lengthOf(value) : uncontrolledLength;
  const [announcement, setAnnouncement] = React.useState('');
  const hasTyped = React.useRef(false);

  React.useEffect(() => {
    if (!countEnabled || !hasTyped.current) return undefined;
    const timer = setTimeout(
      () => setAnnouncement(countAnnouncement(length, maxLength as number)),
      announceDelay,
    );
    return () => clearTimeout(timer);
  }, [countEnabled, length, maxLength, announceDelay, countAnnouncement]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    hasTyped.current = true;
    if (!isControlled) setUncontrolledLength(event.target.value.length);
    onChange?.(event);
  };

  if (!countEnabled) {
    return (
      <StyledTextarea
        rows={rows}
        id={id}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        aria-describedby={describedBy}
        {...rest}
      />
    );
  }

  const fieldId = id || fallbackId;
  const countId = `${fieldId}-count`;
  const max = maxLength as number;
  const atLimit = length >= max;

  return (
    <CountWrapper>
      <StyledTextarea
        rows={rows}
        id={fieldId}
        maxLength={max}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        aria-describedby={[describedBy, countId].filter(Boolean).join(' ')}
        {...rest}
      />
      <Count id={countId} $atLimit={atLimit} data-at-limit={atLimit || undefined}>
        {length} / {max}
        {atLimit && limitReachedText && <span> · {limitReachedText}</span>}
      </Count>
      <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </VisuallyHidden>
    </CountWrapper>
  );
};

export default Textarea;
