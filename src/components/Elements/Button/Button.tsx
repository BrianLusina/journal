import { FunctionComponent } from 'react';
import { ButtonProps } from './Button.types';

const Button: FunctionComponent<ButtonProps> = ({
  onClick,
  children,
  className,
  type = 'button',
  disabled = false,
}) => (
  <button
    // eslint-disable-next-line react/button-has-type
    type={type}
    className={`button large ${className || ''} ${disabled ? 'disabled' : ''}`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

export default Button;
