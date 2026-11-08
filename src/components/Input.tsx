import React from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';

export type InputEditProps = {
  /** Requests editing; the consuming application owns editing and feedback state. */
  onEdit?: () => void;
  editDisabled?: boolean;
  editLabel?: string;
};
export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & InputEditProps;

const EditContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
`;
const ValueContainer = styled.div`
  flex: 1;
  min-width: 0;
`;
const EditButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  padding: 0;
  border: 1px solid ${colors.outlineVariant};
  border-radius: 7px;
  color: ${colors.onSurfaceVariant};
  background: transparent;
  cursor: pointer;
  &:hover:not(:disabled) {
    color: ${colors.primary};
    border-color: currentColor;
  }
  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 3px;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
/** Shared trailing edit affordance for input, select, numeric and composite controls. */
export function InputEditAction({
  children,
  onEdit,
  editDisabled,
  editLabel = 'Edit field',
}: React.PropsWithChildren<InputEditProps>) {
  if (!onEdit) return <>{children}</>;
  return (
    <EditContainer>
      <ValueContainer>{children}</ValueContainer>
      <EditButton
        type="button"
        onClick={onEdit}
        disabled={editDisabled}
        aria-label={editLabel}
        title={editLabel}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="m15 4 5 5M4 20l5-1L20 8a2 2 0 0 0-5-5L4 14v6Z" />
        </svg>
      </EditButton>
    </EditContainer>
  );
}

const StyledInput = styled.input`
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid ${colors.outlineVariant};
  padding: 8px 0;
  color: ${colors.text.primary};
  outline: none;
`;

export const Input: React.FC<InputProps> = ({
  placeholder,
  onEdit,
  editDisabled,
  editLabel,
  ...rest
}) => {
  return (
    <InputEditAction
      onEdit={onEdit}
      editDisabled={editDisabled ?? rest.disabled}
      editLabel={editLabel}
    >
      <StyledInput {...rest} placeholder={placeholder} />
    </InputEditAction>
  );
};

export default Input;
