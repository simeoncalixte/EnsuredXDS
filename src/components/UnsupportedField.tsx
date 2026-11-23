import React, { useId, useState } from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';
import { radii, spacing, typography } from '../tokens.js';

/**
 * Why a shape node can't be rendered with its own component.
 * - `unknown-ref`: the `componentRef` isn't in the component registry.
 * - `not-form-allowed`: the component exists but isn't allowed in forms.
 * - `retired`: the component was retired from the registry.
 */
export type UnsupportedFieldReason = 'unknown-ref' | 'not-form-allowed' | 'retired';

export type UnsupportedFieldProps = {
  /** Field label from the shape node. */
  label: string;
  /** Data path of the node, e.g. "insured.locations". Shown so the value can be traced. */
  path?: string;
  /** The component ref that couldn't be rendered, e.g. "xds.legacy-schedule". */
  componentRef?: string;
  /** Stored value as JSON: a scalar, an object, an array of records or an array of scalars. */
  value?: unknown;
  /** Why the node falls back to this component. */
  reason: UnsupportedFieldReason;
  /** Overrides the default visible reason text. */
  reasonText?: string;
  /** Always read-only in v1. */
  readOnly?: true;
  /** Text longer than this (in characters) is truncated with a "Show full value" toggle. Defaults to 160. */
  truncateAt?: number;
  /** Shown when the stored value is null, undefined, an empty string, array or object. Defaults to "No value recorded". */
  emptyLabel?: string;
  className?: string;
};

const DEFAULT_REASONS: Record<UnsupportedFieldReason, string> = {
  'unknown-ref': "This field's component isn't recognised. Its stored value is shown read-only.",
  'not-form-allowed':
    "This field's component isn't allowed in forms. Its stored value is shown read-only.",
  retired: "This field's component has been retired. Its stored value is shown read-only.",
};

type JsonRecord = Record<string, unknown>;

const isRecord = (v: unknown): v is JsonRecord =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isEmpty = (v: unknown): boolean =>
  v === null ||
  v === undefined ||
  v === '' ||
  (Array.isArray(v) && v.length === 0) ||
  (isRecord(v) && Object.keys(v).length === 0);

/** Exact text for a stored value. Numbers are shown as stored: no rounding or locale formatting. */
const toText = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm}px;
  min-width: 0;
  padding: ${spacing.md}px;
  border: 1px dashed ${colors.outlineVariant};
  border-left: 4px solid ${colors.warning};
  border-radius: ${radii.md}px;
  background: ${colors.surfaceContainerLow};
  color: ${colors.text.primary};
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.sm}px;
`;

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: ${spacing.xs}px ${spacing.sm}px;
`;

const Label = styled.div`
  margin: 0;
  font-size: ${typography.sizes.sm}px;
  font-weight: ${typography.weights.semibold};
  color: ${colors.text.primary};
  overflow-wrap: anywhere;
`;

const ReadOnlyTag = styled.span`
  padding: 2px ${spacing.sm}px;
  border: 1px solid ${colors.outlineVariant};
  border-radius: ${radii.sm}px;
  font-family: ${typography.labelFamily};
  font-size: ${typography.sizes.xs}px;
  color: ${colors.onSurfaceVariant};
  white-space: nowrap;
`;

const Reason = styled.p`
  margin: 0;
  font-size: ${typography.sizes.xs}px;
  color: ${colors.onSurfaceVariant};
`;

const Meta = styled.dl`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing.xs}px ${spacing.md}px;
  margin: 0;
  font-size: ${typography.sizes.xs}px;
  color: ${colors.onSurfaceVariant};

  & > div {
    display: flex;
    gap: ${spacing.xs}px;
    min-width: 0;
  }
  dt {
    font-weight: ${typography.weights.medium};
  }
  dd {
    margin: 0;
    font-family: ${typography.labelFamily};
    overflow-wrap: anywhere;
  }
`;

const ValueText = styled.span`
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const Empty = styled.p`
  margin: 0;
  font-style: italic;
  color: ${colors.onSurfaceVariant};
`;

const KeyValues = styled.dl`
  display: grid;
  grid-template-columns: minmax(96px, max-content) minmax(0, 1fr);
  gap: ${spacing.xs}px ${spacing.md}px;
  margin: 0;

  dt {
    color: ${colors.onSurfaceVariant};
    font-family: ${typography.labelFamily};
    font-size: ${typography.sizes.xs}px;
    overflow-wrap: anywhere;
  }
  dd {
    margin: 0;
    min-width: 0;
  }

  @media (max-width: 479px) {
    grid-template-columns: minmax(0, 1fr);
    dd {
      margin-bottom: ${spacing.xs}px;
    }
  }
`;

const List = styled.ul`
  margin: 0;
  padding-left: ${spacing.md}px;
`;

const TableScroll = styled.div`
  max-width: 100%;
  overflow-x: auto;
  border: 1px solid ${colors.outlineVariant};
  border-radius: ${radii.sm}px;

  &:focus-visible {
    outline: 2px solid ${colors.secondary};
    outline-offset: 2px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${typography.sizes.xs}px;

  th,
  td {
    padding: ${spacing.xs}px ${spacing.sm}px;
    text-align: left;
    vertical-align: top;
    border-bottom: 1px solid ${colors.outlineVariant};
  }
  th {
    font-family: ${typography.labelFamily};
    font-weight: ${typography.weights.medium};
    color: ${colors.onSurfaceVariant};
    white-space: nowrap;
  }
  tr:last-child td {
    border-bottom: 0;
  }
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const ToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  margin-left: ${spacing.xs}px;
  padding: 0 ${spacing.xs}px;
  border: 0;
  border-radius: ${radii.sm}px;
  background: transparent;
  color: ${colors.text.accent};
  font: inherit;
  font-weight: ${typography.weights.semibold};
  text-decoration: underline;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${colors.secondary};
    outline-offset: 2px;
  }

  @media (pointer: coarse) {
    min-height: 44px;
  }
`;

const LongText: React.FC<{ text: string; limit: number }> = ({ text, limit }) => {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  if (text.length <= limit) return <ValueText>{text}</ValueText>;
  return (
    <>
      <ValueText id={id}>
        {expanded ? text : `${text.slice(0, limit)}…`}
        {!expanded && <VisuallyHidden> (truncated)</VisuallyHidden>}
      </ValueText>
      <ToggleButton
        type="button"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? 'Show less' : 'Show full value'}
      </ToggleButton>
    </>
  );
};

const Cell: React.FC<{ value: unknown; limit: number; emptyLabel: string }> = ({
  value,
  limit,
  emptyLabel,
}) =>
  isEmpty(value) ? (
    <Empty as="span">{emptyLabel}</Empty>
  ) : (
    <LongText text={toText(value)} limit={limit} />
  );

/**
 * Read-only fallback for a submission shape node whose component can't be rendered
 * (unknown, retired or not allowed in forms). It always keeps the stored value visible,
 * so an underwriter never loses submitted data. Presentational only.
 */
export function UnsupportedField({
  label,
  path,
  componentRef,
  value,
  reason,
  reasonText,
  truncateAt = 160,
  emptyLabel = 'No value recorded',
  className,
}: UnsupportedFieldProps) {
  const baseId = useId();
  const labelId = `${baseId}-label`;
  const statusId = `${baseId}-status`;
  const reasonId = `${baseId}-reason`;

  let body: React.ReactNode;
  if (isEmpty(value)) {
    body = <Empty>{emptyLabel}</Empty>;
  } else if (Array.isArray(value) && value.every(isRecord)) {
    const columns: string[] = [];
    for (const row of value)
      for (const key of Object.keys(row)) {
        if (!columns.includes(key)) columns.push(key);
      }
    body = (
      <TableScroll
        role="region"
        aria-label={`${label}: stored records`}
        tabIndex={0}
        data-testid="unsupported-field-table"
      >
        <Table>
          <caption>
            <VisuallyHidden>
              {label}: {value.length} stored {value.length === 1 ? 'record' : 'records'}
            </VisuallyHidden>
          </caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {value.map((row, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c}>
                    <Cell value={row[c]} limit={truncateAt} emptyLabel="—" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </TableScroll>
    );
  } else if (Array.isArray(value)) {
    body = (
      <List>
        {value.map((item, i) => (
          <li key={i}>
            <Cell value={item} limit={truncateAt} emptyLabel={emptyLabel} />
          </li>
        ))}
      </List>
    );
  } else if (isRecord(value)) {
    body = (
      <KeyValues>
        {Object.entries(value).map(([k, v]) => (
          <React.Fragment key={k}>
            <dt>{k}</dt>
            <dd>
              <Cell value={v} limit={truncateAt} emptyLabel={emptyLabel} />
            </dd>
          </React.Fragment>
        ))}
      </KeyValues>
    );
  } else {
    body = <LongText text={toText(value)} limit={truncateAt} />;
  }

  return (
    <Root
      role="group"
      className={className}
      aria-labelledby={labelId}
      aria-describedby={`${statusId} ${reasonId}`}
      data-reason={reason}
      data-readonly="true"
    >
      <Header>
        <Label id={labelId}>{label}</Label>
        <ReadOnlyTag id={statusId}>Read-only</ReadOnlyTag>
      </Header>
      <Reason id={reasonId}>{reasonText ?? DEFAULT_REASONS[reason]}</Reason>
      {(componentRef || path) && (
        <Meta>
          {componentRef && (
            <div>
              <dt>Component</dt>
              <dd>{componentRef}</dd>
            </div>
          )}
          {path && (
            <div>
              <dt>Path</dt>
              <dd>{path}</dd>
            </div>
          )}
        </Meta>
      )}
      {body}
    </Root>
  );
}

export default UnsupportedField;
