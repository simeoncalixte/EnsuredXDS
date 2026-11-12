import React from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';
import { radii, spacing } from '../tokens.js';

const Wrapper = styled.div`
  position: relative;
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: ${spacing.sm + 2}px ${spacing.md - 2}px;
  border-radius: ${radii.lg - 2}px;
  background: ${colors.surfaceContainer};
  border: none;
  color: ${colors.text.primary};
  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 3px;
  }
`;

const Chevron = styled.span`
  position: absolute;
  right: ${spacing.md - 4}px;
  top: 50%;
  transform: translateY(-50%);
  color: ${colors.onSurfaceVariant};
  pointer-events: none;
`;

export const Select: React.FC<React.ComponentPropsWithRef<'select'> & { bare?: boolean }> = ({
  children,
  bare = false,
  style,
  ...rest
}) => {
  if (bare)
    return (
      <StyledSelect {...rest} style={style}>
        {children}
      </StyledSelect>
    );
  return (
    <Wrapper>
      <StyledSelect {...rest} style={style}>
        {children}
      </StyledSelect>
      <Chevron>▾</Chevron>
    </Wrapper>
  );
};

export default Select;
