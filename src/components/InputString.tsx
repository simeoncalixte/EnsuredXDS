import React, { useEffect, useId, useRef, useState } from 'react';
import styled from 'styled-components';
import Button from './Button.js';
import { colors } from '../colors.js';
import { spacing, typography } from '../tokens.js';
export type InputStringOption = { id: string; label: string; tag?: string };
export type InputStringStep = {
  id: string;
  label: string;
  type: 'single' | 'multi' | 'action';
  options?: InputStringOption[];
};
export type InputStringFlow = {
  id: string;
  label: string;
  steps: InputStringStep[];
  disabled?: boolean;
  notice?: string;
};
export type InputStringValue = Record<string, string[]>;
export type InputStringResult = { flowId: string; answers: InputStringValue };
export type InputStringProps = {
  flows: InputStringFlow[];
  value: InputStringValue;
  onChange: (value: InputStringValue) => void;
  onComplete: (result: InputStringResult) => void;
  onFlowChange?: (id: string) => void;
  renderResult?: (result: InputStringResult) => React.ReactNode;
  className?: string;
};
const Root = styled.section`
  display: grid;
  gap: ${spacing.md}px;
  min-width: 0;
  color: ${colors.text.primary};
  font-family: ${typography.bodyFamily};
`;
const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${spacing.sm}px;
  min-width: 0;
`;
const Option = styled(Button)`
  min-height: 44px;
  max-width: 100%;
  white-space: normal;
  text-align: start;
`;
const Token = styled(Option)`
  text-decoration: underline;
  text-underline-offset: 0.25em;
`;
const Notice = styled.p`
  margin: 0;
  color: ${colors.onSurfaceVariant};
  line-height: 1.5;
`;
/** A keyboard-operable example sentence. Choices update immediately; there is
 * no independent animation timeline. The host may compose it in a scroll scene. */
export default function InputString({
  flows,
  value,
  onChange,
  onComplete,
  onFlowChange,
  renderResult,
  className,
}: InputStringProps) {
  const noticeId = useId();
  const [open, setOpen] = useState(false);
  const [flowId, setFlowId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<InputStringResult | null>(null);
  const active = useRef<HTMLDivElement>(null);
  const resultNode = useRef<HTMLDivElement>(null);
  const flow = flows.find((f) => f.id === flowId);
  const current = flow?.steps[step];
  useEffect(() => {
    if (!open) return;
    if (result) {
      resultNode.current?.focus();
      return;
    }
    active.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
  }, [open, flowId, step, result]);
  const chooseFlow = (id: string) => {
    const next = flows.find((f) => f.id === id);
    if (!next || next.disabled) return;
    setFlowId(id);
    setStep(0);
    setResult(null);
    onChange({});
    onFlowChange?.(id);
  };
  const complete = () => {
    if (!flow) return;
    // Validate every answer even when the caller changes controlled values.
    const invalid = flow.steps.findIndex((s) => s.type !== 'action' && !value[s.id]?.length);
    if (invalid >= 0) {
      setStep(invalid);
      return;
    }
    const submitted = { flowId: flow.id, answers: structuredClone(value) };
    setResult(submitted);
    onComplete(submitted);
  };
  const next = () => {
    if (!flow) return;
    if (step >= flow.steps.length - 1) complete();
    else setStep(step + 1);
  };
  const choose = (id: string) => {
    if (!current) return;
    const selected = value[current.id] ?? [];
    onChange({
      ...value,
      [current.id]:
        current.type === 'multi'
          ? selected.includes(id)
            ? selected.filter((v) => v !== id)
            : [...selected, id]
          : [id],
    });
    if (current.type === 'single' && flow && step < flow.steps.length - 1) setStep(step + 1);
  };
  return (
    <Root className={className} aria-label="Try an illustrative example">
      <Option type="button" variant="secondary" aria-expanded={open} onClick={() => setOpen(!open)}>
        Try an example
      </Option>
      {open && (
        <>
          <Notice>Example data only. Nothing is quoted, sent to a market or bound here.</Notice>
          <Row aria-label="Your example choices">
            {flow && (
              <Token
                type="button"
                variant="text"
                onClick={() => {
                  setFlowId(null);
                  setResult(null);
                }}
                aria-label={`Path: ${flow.label}. Change`}
              >
                {flow.label}
              </Token>
            )}
            {flow?.steps
              .filter((s) => s.type !== 'action' && value[s.id]?.length)
              .map((s) => (
                <Token
                  key={s.id}
                  type="button"
                  variant="text"
                  aria-label={`${s.label}: ${value[s.id].map((id) => s.options?.find((o) => o.id === id)?.label ?? id).join(', ')}. Change`}
                  onClick={() => {
                    setResult(null);
                    setStep(flow.steps.findIndex((x) => x.id === s.id));
                  }}
                >
                  {value[s.id]
                    .map((id) => s.options?.find((o) => o.id === id)?.label ?? id)
                    .join(', ')}
                </Token>
              ))}
          </Row>
          {result ? (
            <div ref={resultNode} tabIndex={-1} role="status" aria-live="polite">
              <strong>Example:</strong>{' '}
              {renderResult ? renderResult(result) : 'Your illustrative selection is complete.'}
              <Row>
                <Option
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setResult(null);
                    setStep(0);
                  }}
                >
                  Try another example
                </Option>
              </Row>
            </div>
          ) : (
            <div ref={active} role="group" aria-label={current?.label ?? 'I bring'}>
              {!flow ? (
                <Row>
                  {flows.length === 0 && <Notice>No example paths are available.</Notice>}
                  {flows.map((f) => (
                    <div key={f.id}>
                      <Option
                        type="button"
                        variant="secondary"
                        disabled={f.disabled}
                        aria-describedby={f.notice ? `${noticeId}-${f.id}` : undefined}
                        onClick={() => chooseFlow(f.id)}
                      >
                        {f.label}
                      </Option>
                      {f.notice && <Notice id={`${noticeId}-${f.id}`}>{f.notice}</Notice>}
                    </div>
                  ))}
                </Row>
              ) : (
                <>
                  <Notice>{current?.label}</Notice>
                  <Row>
                    {current?.options?.map((o) => (
                      <Option
                        key={o.id}
                        type="button"
                        variant="secondary"
                        aria-pressed={(value[current.id] ?? []).includes(o.id)}
                        onClick={() => choose(o.id)}
                      >
                        {(value[current.id] ?? []).includes(o.id) ? '✓ ' : ''}
                        {o.label}
                        {o.tag ? ` · ${o.tag}` : ''}
                      </Option>
                    ))}
                  </Row>
                  <Row>
                    {step > 0 && (
                      <Option type="button" variant="text" onClick={() => setStep(step - 1)}>
                        Back
                      </Option>
                    )}
                    {current?.type === 'action' ? (
                      <Option type="button" onClick={complete}>
                        {current.label}
                      </Option>
                    ) : (
                      <Option
                        type="button"
                        variant="secondary"
                        disabled={!current || !value[current.id]?.length}
                        onClick={next}
                      >
                        Next
                      </Option>
                    )}
                  </Row>
                </>
              )}
            </div>
          )}
        </>
      )}
    </Root>
  );
}
