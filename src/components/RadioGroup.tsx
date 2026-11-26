import React, { useId, useState } from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';
import { radii, spacing, typography } from '../tokens.js';

export type RadioGroupOption = {
  /** Value submitted with the form and passed to `onChange`. */
  value: string;
  /** Visible option label, e.g. "Approve" or "Decline". */
  label: React.ReactNode;
  /** Optional detail line under the label, linked to the radio with aria-describedby. */
  description?: React.ReactNode;
  /**
   * Option can't be chosen. Give a `description` that says why, e.g.
   * "Not priced yet. Price SUB-8401 before approving." The reason stays at full contrast.
   */
  disabled?: boolean;
};

export type RadioGroupProps = {
  /** Shared `name` of the native radios. */
  name: string;
  /** Visible group label, rendered as the fieldset `<legend>`. */
  legend: React.ReactNode;
  /** Optional help text under the legend, linked to the group with aria-describedby. */
  hint?: React.ReactNode;
  options: RadioGroupOption[];
  /**
   * Selected value (controlled). `null` means nothing is selected yet. Leave it
   * `undefined` to let the group manage its own state. There is never a default selection.
   */
  value?: string | null;
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Marks the choice as required (native `required` on the radios, plus a visible "Required"). */
  required?: boolean;
  /** Disables every option. */
  disabled?: boolean;
  /** Error message (e.g. "Choose Approve or Decline."), linked to the fieldset with aria-describedby. */
  error?: React.ReactNode;
  /** `vertical` (default) stacks options; `horizontal` lays them out in a wrapping row. */
  orientation?: 'vertical' | 'horizontal';
  /** Visually hide the legend (it stays the accessible name). Use only when a heading already names the group. */
  legendHidden?: boolean;
  id?: string;
  className?: string;
};

const visuallyHidden = `
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

const Fieldset = styled.fieldset`
  margin: 0;
  padding: 0;
  border: none;
  min-width: 0;
  font-family: ${typography.fontFamily};
  color: ${colors.text.primary};
`;

const Legend = styled.legend<{ $hidden?: boolean }>`
  padding: 0;
  margin-bottom: ${spacing.sm}px;
  font-size: ${typography.sizes.sm}px;
  font-weight: ${typography.weights.semibold};
  color: ${colors.text.primary};
  ${({ $hidden }) => ($hidden ? visuallyHidden : '')}
`;

const RequiredText = styled.span`
  margin-left: ${spacing.xs}px;
  font-weight: ${typography.weights.regular};
  color: ${colors.text.secondary};
`;

const Hint = styled.p`
  margin: 0 0 ${spacing.sm}px;
  font-size: ${typography.sizes.sm}px;
  color: ${colors.text.secondary};
`;

const Options = styled.div<{ $orientation: 'vertical' | 'horizontal' }>`
  display: flex;
  flex-direction: ${({ $orientation }) => ($orientation === 'horizontal' ? 'row' : 'column')};
  flex-wrap: wrap;
  gap: ${spacing.sm}px;

  & > * {
    flex: ${({ $orientation }) => ($orientation === 'horizontal' ? '1 1 200px' : '0 0 auto')};
  }
`;

const OptionLabel = styled.label<{ $checked: boolean; $disabled: boolean; $invalid: boolean }>`
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: ${spacing.sm}px;
  align-items: start;
  padding: ${spacing.sm + spacing.xs}px ${spacing.md}px;
  border-radius: ${radii.md}px;
  border: 1px solid
    ${({ $checked, $invalid }) =>
      $checked ? colors.primary : $invalid ? colors.error : colors.outlineVariant};
  box-shadow: ${({ $checked }) => ($checked ? `inset 0 0 0 1px ${colors.primary}` : 'none')};
  background: ${({ $checked }) => ($checked ? colors.surfaceContainerLow : 'transparent')};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};

  &:hover {
    border-color: ${({ $disabled, $checked }) =>
      $disabled ? colors.outlineVariant : $checked ? colors.primary : colors.outline};
  }

  &:focus-within {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }
`;

const Radio = styled.input`
  appearance: none;
  margin: 2px 0 0;
  width: 18px;
  height: 18px;
  border-radius: ${radii.round}px;
  border: 2px solid ${colors.outline};
  background: transparent;
  display: grid;
  place-content: center;
  cursor: inherit;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: ${radii.round}px;
    background: ${colors.primary};
    transform: scale(0);
  }

  &:checked {
    border-color: ${colors.primary};
  }

  &:checked::before {
    transform: scale(1);
  }

  &:focus-visible {
    outline: none;
  }

  &:disabled {
    border-style: dashed;
  }

  @media (forced-colors: active) {
    &::before {
      background: CanvasText;
    }
  }
`;

const OptionText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const OptionTitle = styled.span<{ $disabled: boolean }>`
  font-size: ${typography.sizes.md}px;
  font-weight: ${typography.weights.medium};
  color: ${({ $disabled }) => ($disabled ? colors.text.secondary : colors.text.primary)};
`;

const OptionDescription = styled.span`
  font-size: ${typography.sizes.sm}px;
  color: ${colors.text.secondary};
`;

const ErrorText = styled.p`
  display: flex;
  gap: ${spacing.xs}px;
  align-items: center;
  margin: ${spacing.sm}px 0 0;
  font-size: ${typography.sizes.sm}px;
  color: ${colors.error};
`;

const HiddenText = styled.span`
  ${visuallyHidden}
`;

const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 4.5v4.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="8" cy="11.25" r="0.9" fill="currentColor" />
  </svg>
);

/**
 * `xds.radio-group`: a fieldset + legend of native radios, each with a label and an
 * optional description. Nothing is selected until the person chooses.
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  legend,
  hint,
  options,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  orientation = 'vertical',
  legendHidden = false,
  id,
  className,
}) => {
  const autoId = useId();
  const baseId = id ?? `xds-radio-group-${autoId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const hintId = hint ? `${baseId}-hint` : undefined;
  const errorId = error ? `${baseId}-error` : undefined;
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string | null>(null);
  const current = isControlled ? value : internal;

  const groupDescribedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternal(event.target.value);
    onChange?.(event.target.value, event);
  };

  return (
    <Fieldset
      id={baseId}
      className={className}
      aria-describedby={groupDescribedBy}
      disabled={disabled || undefined}
      data-invalid={error ? 'true' : undefined}
    >
      <Legend $hidden={legendHidden}>
        {legend}
        {required ? <RequiredText>(required)</RequiredText> : null}
      </Legend>
      {hint ? <Hint id={hintId}>{hint}</Hint> : null}
      <Options $orientation={orientation}>
        {options.map((option, index) => {
          const optionId = `${baseId}-option-${index}`;
          const titleId = `${optionId}-label`;
          const descriptionId = option.description ? `${optionId}-description` : undefined;
          const optionDisabled = disabled || Boolean(option.disabled);
          const checked = current === option.value;
          return (
            <OptionLabel
              key={option.value}
              htmlFor={optionId}
              $checked={checked}
              $disabled={optionDisabled}
              $invalid={Boolean(error)}
              data-checked={checked ? 'true' : 'false'}
              data-disabled={optionDisabled ? 'true' : undefined}
            >
              <Radio
                type="radio"
                id={optionId}
                name={name}
                value={option.value}
                checked={checked}
                onChange={handleChange}
                disabled={optionDisabled}
                required={required}
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
              />
              <OptionText>
                <OptionTitle id={titleId} $disabled={optionDisabled}>
                  {option.label}
                </OptionTitle>
                {option.description ? (
                  <OptionDescription id={descriptionId}>{option.description}</OptionDescription>
                ) : null}
              </OptionText>
            </OptionLabel>
          );
        })}
      </Options>
      {error ? (
        <ErrorText id={errorId}>
          <ErrorIcon />
          <span>
            <HiddenText>Error: </HiddenText>
            {error}
          </span>
        </ErrorText>
      ) : null}
    </Fieldset>
  );
};

export default RadioGroup;
