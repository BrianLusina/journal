import { ReactNode } from 'react';

export type ButtonProps = {
  type?: 'button' | 'submit' | 'reset';
  onClick: (e?: unknown) => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};
