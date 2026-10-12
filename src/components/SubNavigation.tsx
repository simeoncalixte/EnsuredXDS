import React, { useLayoutEffect, useRef } from 'react';
import styled from 'styled-components';
import { colors, withAlpha } from '../colors.js';
import { spacing } from '../tokens.js';

const TabButton = styled.button`
  flex: 1 1 0;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition:
    flex-basis 240ms ease,
    min-width 240ms ease;

  &:hover,
  &:focus,
  &[aria-current='step'] {
    flex-basis: var(--label-width, 0px);
    min-width: var(--label-width, 0px);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export type Tab = { id: string; label: string };

export const SubNavigation: React.FC<{
  tabs: Tab[];
  activeId?: string;
  onChange?: (id: string) => void;
  label?: string | null;
}> = ({ tabs, activeId, onChange, label = 'Sub-Navigation Tabs' }) => {
  const navigationRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const labels = navigationRef.current?.querySelectorAll<HTMLSpanElement>('[data-tab-label]');
    if (!labels) return;
    const measure = (element: HTMLSpanElement) => {
      element.parentElement?.style.setProperty(
        '--label-width',
        `${Math.ceil(element.getBoundingClientRect().width)}px`,
      );
    };
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => measure(entry.target as HTMLSpanElement));
    });
    labels.forEach((element) => {
      measure(element);
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, [tabs]);

  return (
    <div
      aria-label={label ?? undefined}
      style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: spacing.md }}
    >
      <div
        ref={navigationRef}
        style={{
          display: 'flex',
          minWidth: 0,
          gap: 32,
          borderBottom: `1px solid ${withAlpha(colors.neutral[400], 0.15)}`,
        }}
      >
        {tabs.map((t) => {
          const active = t.id === activeId;
          return (
            <TabButton
              key={t.id}
              type="button"
              title={t.label}
              aria-current={active ? 'step' : undefined}
              onClick={() => onChange?.(t.id)}
              style={{
                padding: '0 0 12px 0',
                fontSize: 14,
                fontWeight: 700,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: active ? colors.text.accent : 'var(--text-secondary)',
                borderBottom: active ? `2px solid ${colors.text.accent}` : '2px solid transparent',
              }}
            >
              <span data-tab-label style={{ display: 'inline-block' }}>
                {t.label}
              </span>
            </TabButton>
          );
        })}
      </div>
    </div>
  );
};

export default SubNavigation;
