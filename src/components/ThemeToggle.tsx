import React from 'react';
import styled from 'styled-components';
import { colors, withAlpha } from '../colors.js';
import { useXdsTheme } from '../theme.js';

const ToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-width: 2.5rem;
  height: 2.5rem;
  padding: 0 0.75rem;
  border: 1px solid ${withAlpha(colors.outline, 0.28)};
  border-radius: 0.75rem;
  background: ${withAlpha(colors.surfaceHigh, 0.92)};
  color: ${colors.onSurfaceStrong};
  cursor: pointer;
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    transform 100ms ease;

  &:hover {
    background: ${colors.surfaceRaised};
    border-color: ${withAlpha(colors.primarySoft, 0.48)};
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }

  &:active {
    transform: scale(0.96);
  }
`;

const Icon = styled.span`
  font-size: 1.2rem;
  line-height: 1;
`;

const Label = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;

  @media (max-width: 520px) {
    display: none;
  }
`;

export const ThemeToggle: React.FC = () => {
  const { themeName, toggleTheme } = useXdsTheme();
  const nextTheme = themeName === 'dark' ? 'light' : 'dark';

  return (
    <ToggleButton
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      <Icon aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7">
          {themeName === 'dark' ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> : <path d="M20.5 13.5A8.5 8.5 0 0 1 10.5 3a8.5 8.5 0 1 0 10 10.5Z" />}
        </svg>
      </Icon>
      <Label>{nextTheme === 'light' ? 'Light' : 'Dark'}</Label>
    </ToggleButton>
  );
};

export default ThemeToggle;
