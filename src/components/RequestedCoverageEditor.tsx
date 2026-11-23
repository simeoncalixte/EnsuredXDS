import React, { useId, useRef, useState } from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';
import Button from './Button.js';
import CurrencyInput from './CurrencyInput.js';
import ValidationMessage from './ValidationMessage.js';

export type RequestedCoverage = Record<string, any> & {
  coverageId?: string;
  name?: string;
  selected?: boolean;
  description?: string;
  limit?: number | string | null;
  deductible?: number | string | null;
  currencyCode?: string;
  limitCurrencyCode?: string;
  deductibleCurrencyCode?: string;
  terms?: string;
};
/** Per-row controls that can carry their own validation error. */
export type RequestedCoverageField = 'name' | 'selected' | 'limit' | 'deductible' | 'terms';
// Spelled out (not Partial<Record<…>>) so the manifest generator can resolve each key.
export type RequestedCoverageFieldErrors = {
  name?: string;
  selected?: string;
  limit?: string;
  deductible?: string;
  terms?: string;
};
export type RequestedCoverageEditorProps = {
  value: RequestedCoverage[];
  onChange: (value: RequestedCoverage[]) => void;
  title?: string;
  description?: string;
  allowRename?: boolean;
  allowReorder?: boolean;
  termsMaxLength?: number;
  readOnly?: boolean;
  /** Marks the whole coverage group as failing validation (`aria-invalid` on the group). */
  invalid?: boolean;
  /** Id(s) of the element(s) describing the group, usually a ValidationMessage. */
  describedBy?: string;
  /** Row-level errors indexed like `value` (use `{}` for a valid row); each control gets `aria-invalid` and `aria-describedby` to its message. */
  fieldErrors?: RequestedCoverageFieldErrors[];
  renderInput?: (
    index: number,
    key: string,
    label: string,
    control: React.ReactNode,
  ) => React.ReactNode;
  renderAdditionalFields?: (
    coverage: RequestedCoverage,
    onChange: (coverage: RequestedCoverage) => void,
  ) => React.ReactNode;
};
const Panel = styled.section<{ $invalid: boolean }>`
  padding: 20px;
  border: 1px solid ${({ $invalid }) => ($invalid ? colors.error : colors.outlineVariant)};
  border-radius: 9px;
  background: ${colors.surface};
  color: ${colors.text.primary};
  display: grid;
  gap: 14px;
  * {
    box-sizing: border-box;
  }
  h3,
  p {
    margin: 0;
  }
  p {
    color: ${colors.onSurfaceVariant};
    font-size: 13px;
    line-height: 1.5;
  }
  input,
  textarea,
  select {
    font: inherit;
  }
  [aria-invalid='true'] {
    border-color: ${colors.error};
  }
`;
const Header = styled.div`
  display: flex;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
  & > :first-child {
    flex: 1;
    min-width: 180px;
  }
`;
const Count = styled.span`
  padding: 8px 14px;
  border-radius: 24px;
  background: ${colors.primaryContainer};
  color: ${colors.onPrimaryContainer};
  font-size: 13px;
`;
const Card = styled.div`
  border: 1px solid ${colors.outlineVariant};
  border-radius: 7px;
  padding: 16px;
  display: grid;
  gap: 14px;
`;
const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
`;
const NumberBadge = styled.span`
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: ${colors.primaryContainer};
  color: ${colors.onPrimaryContainer};
  font-weight: 700;
`;
const Name = styled.div`
  flex: 1;
  min-width: 160px;
  input {
    width: 100%;
    color: inherit;
    background: transparent;
    border: 1px solid ${colors.outlineVariant};
    border-radius: 5px;
    padding: 5px 8px;
    font-weight: 600;
  }
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;
const Field = styled.div`
  display: grid;
  gap: 5px;
  min-width: 0;
  font-size: 14px;
`;
const Control = styled.input`
  width: 100%;
  padding: 11px 12px;
  color: ${colors.text.primary};
  background: ${colors.surfaceContainerLow};
  border: 1px solid ${colors.outlineVariant};
  border-radius: 7px;
  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }
`;
const Terms = styled.textarea`
  width: 100%;
  min-height: 44px;
  resize: vertical;
  padding: 11px 12px;
  color: ${colors.text.primary};
  background: ${colors.surfaceContainerLow};
  border: 1px solid ${colors.outlineVariant};
  border-radius: 7px;
`;
const Footer = styled.button`
  width: 100%;
  padding: 16px;
  border: 1px dashed ${colors.primary};
  border-radius: 7px;
  background: transparent;
  color: ${colors.primary};
  cursor: pointer;
  font: inherit;
  font-weight: 600;
`;
const Moves = styled.div`
  display: flex;
  gap: 2px;
  align-items: center;
`;
const monetary = (value: unknown) =>
  value == null ||
  value === '' ||
  typeof value === 'number' ||
  (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value));

export function RequestedCoverageEditor({
  value,
  onChange,
  title = 'Requested Coverage',
  description = 'Add the coverage types and limits you are requesting for this property or risk. Include any special terms or notes.',
  allowRename = true,
  allowReorder = true,
  termsMaxLength = 500,
  renderAdditionalFields,
  readOnly = false,
  invalid = false,
  describedBy,
  fieldErrors,
  renderInput,
}: RequestedCoverageEditorProps) {
  const baseId = useId();
  const errorOf = (index: number, key: RequestedCoverageField) => fieldErrors?.[index]?.[key];
  const errorIdOf = (index: number, key: RequestedCoverageField) =>
    `${baseId}-coverage-${index}-${key}-error`;
  const errorProps = (index: number, key: RequestedCoverageField) =>
    errorOf(index, key)
      ? { 'aria-invalid': true as const, 'aria-describedby': errorIdOf(index, key) }
      : {};
  const errorMessage = (index: number, key: RequestedCoverageField) => {
    const message = errorOf(index, key);
    return message ? (
      <ValidationMessage id={errorIdOf(index, key)}>{message}</ValidationMessage>
    ) : null;
  };
  const decorate = (index: number, key: string, label: string, control: React.ReactNode) =>
    renderInput?.(index, key, label, control) ?? control;
  const dragIndex = useRef<number | null>(null);
  const [announcement, announce] = useState('');
  const update = (index: number, row: RequestedCoverage) =>
    onChange(value.map((v, i) => (i === index ? row : v)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const rows = [...value];
    const [row] = rows.splice(from, 1);
    rows.splice(to, 0, row);
    onChange(rows);
    announce(`${row.name || 'Coverage'} moved to position ${to + 1}`);
  };
  const add = () =>
    onChange([
      ...value,
      {
        coverageId: crypto.randomUUID(),
        name: 'New Coverage',
        selected: true,
        limit: null,
        deductible: null,
        terms: '',
      },
    ]);
  return (
    <Panel
      role="group"
      aria-label={title}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy || undefined}
      $invalid={invalid}
    >
      <Header>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <Count>
          {value.length} {value.length === 1 ? 'coverage' : 'coverages'}
        </Count>
        <Button type="button" disabled={readOnly} onClick={add}>
          ＋ Add Coverage
        </Button>
      </Header>
      {allowRename && <p>You can rename each requested coverage title to match the submission.</p>}
      <span
        role="status"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clipPath: 'inset(50%)',
        }}
      >
        {announcement}
      </span>
      {value.map((row, index) => {
        const name = row.name || `Coverage ${index + 1}`;
        return (
          <Card
            key={row.coverageId ?? row.id ?? index}
            onDragOver={(e) => {
              if (allowReorder && dragIndex.current !== null) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (allowReorder && dragIndex.current !== null) move(dragIndex.current, index);
              dragIndex.current = null;
            }}
          >
            <CardHeader>
              {allowReorder && (
                <Moves>
                  <span
                    draggable
                    aria-hidden="true"
                    style={{ cursor: 'grab' }}
                    onDragStart={(e) => {
                      dragIndex.current = index;
                      e.dataTransfer.setData('text/plain', String(index));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      dragIndex.current = null;
                    }}
                  >
                    ⠿
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Move ${name} up`}
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Move ${name} down`}
                    disabled={index === value.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    ↓
                  </Button>
                </Moves>
              )}
              <NumberBadge>{index + 1}</NumberBadge>
              <Name>
                {decorate(
                  index,
                  'name',
                  `${name} name`,
                  allowRename ? (
                    <input
                      aria-label={`Coverage ${index + 1} title`}
                      {...errorProps(index, 'name')}
                      value={row.name ?? ''}
                      readOnly={readOnly}
                      onChange={(e) => update(index, { ...row, name: e.target.value })}
                    />
                  ) : (
                    <strong>{name}</strong>
                  ),
                )}
                {errorMessage(index, 'name')}
                {row.description && <p>{row.description}</p>}
              </Name>
              <Button
                type="button"
                variant="ghost"
                tone="danger"
                aria-label={`Remove ${name}`}
                disabled={readOnly}
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </CardHeader>
            <Grid>
              <Field>
                <span>Requested</span>
                {decorate(
                  index,
                  'selected',
                  `${name} requested`,
                  <Control
                    as="select"
                    disabled={readOnly}
                    aria-label={`${name} requested`}
                    {...errorProps(index, 'selected')}
                    value={row.selected === false ? 'no' : 'yes'}
                    onChange={(e) => update(index, { ...row, selected: e.target.value === 'yes' })}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </Control>,
                )}
                {errorMessage(index, 'selected')}
              </Field>
              {(['limit', 'deductible'] as const).map((key) => {
                const label = key === 'limit' ? 'Limit' : 'Deductible';
                const currencyKey =
                  key === 'limit' ? 'limitCurrencyCode' : 'deductibleCurrencyCode';
                return (
                  <Field key={key}>
                    <span>{label}</span>
                    {monetary(row[key]) ? (
                      <CurrencyInput
                        disabled={readOnly}
                        invalid={!!errorOf(index, key)}
                        describedBy={errorOf(index, key) ? errorIdOf(index, key) : undefined}
                        renderInput={
                          renderInput
                            ? (input, control) =>
                                decorate(
                                  index,
                                  input === 'amount' ? key : currencyKey,
                                  `${name} ${label.toLowerCase()} ${input === 'amount' ? 'amount' : 'currency'}`,
                                  control,
                                )
                            : undefined
                        }
                        label={`${name} ${label.toLowerCase()}`}
                        value={row[key]}
                        currencyCode={row[currencyKey] ?? row.currencyCode ?? ''}
                        onChange={(amount) => update(index, { ...row, [key]: amount })}
                        onCurrencyChange={(code) => update(index, { ...row, [currencyKey]: code })}
                      />
                    ) : typeof row[key] === 'string' ? (
                      decorate(
                        index,
                        key,
                        `${name} ${label.toLowerCase()} terms`,
                        <Control
                          readOnly={readOnly}
                          aria-label={`${name} ${label.toLowerCase()} terms`}
                          {...errorProps(index, key)}
                          value={row[key]}
                          onChange={(e) => update(index, { ...row, [key]: e.target.value })}
                        />,
                      )
                    ) : (
                      <p>See additional parameters below.</p>
                    )}
                    {errorMessage(index, key)}
                  </Field>
                );
              })}
            </Grid>
            <Field>
              <span>Additional Terms (Optional)</span>
              {decorate(
                index,
                'terms',
                `${name} additional terms`,
                <Terms
                  readOnly={readOnly}
                  rows={1}
                  aria-label={`${name} additional terms`}
                  {...errorProps(index, 'terms')}
                  value={row.terms ?? ''}
                  maxLength={termsMaxLength}
                  onChange={(e) => update(index, { ...row, terms: e.target.value })}
                />,
              )}
              {errorMessage(index, 'terms')}
              <p style={{ textAlign: 'right' }}>
                {(row.terms ?? '').length}/{termsMaxLength}
              </p>
            </Field>
            {renderAdditionalFields?.(row, (next) => update(index, next))}
          </Card>
        );
      })}
      <Footer type="button" disabled={readOnly} onClick={add}>
        ⊕ Add Another Coverage<p>Add additional coverage types to your request</p>
      </Footer>
    </Panel>
  );
}
export default RequestedCoverageEditor;
