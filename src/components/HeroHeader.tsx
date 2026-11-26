import React from 'react';
import { colors, withAlpha } from '../colors.js';

export const HeroHeader: React.FC<{
  title?: string;
  subtitle?: string;
  tag?: string;
  responsive?: boolean;
}> = ({ title, subtitle, tag, responsive = false }) => {
  return (
    <header style={{ margin: '0 auto' }}>
      {tag && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 9999,
            background: withAlpha(colors.onSurface, 0.03),
            border: `1px solid ${colors.outlineVariant}`,
            marginBottom: 16,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 8, background: colors.secondary }} />
          <span
            style={{
              fontSize: 10,
              fontFamily: 'ui-monospace, Menlo, monospace',
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: colors.onSurfaceVariant,
            }}
          >
            {tag}
          </span>
        </div>
      )}

      <h1
        style={{
          fontSize: responsive ? 'clamp(2rem, 4vw, 3.6rem)' : 48,
          maxWidth: responsive ? '20ch' : undefined,
          lineHeight: 1.02,
          margin: 0,
          color: colors.text.primary,
          fontWeight: 800,
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          style={{
            marginTop: 16,
            color: responsive ? colors.text.primary : colors.onSurfaceVariant,
            fontSize: responsive ? 22 : 18,
            lineHeight: responsive ? 1.5 : undefined,
            maxWidth: 720,
          }}
        >
          {subtitle}
        </p>
      )}
    </header>
  );
};

export default HeroHeader;
