import { forwardRef } from 'react';
import { Input as AntInput } from 'antd';
import { cn } from '@xanh/utils';

export interface InputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  hasError?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ hasError, leftIcon, rightIcon, className, ...props }, ref) => (
    <AntInput
      ref={ref as any}
      prefix={leftIcon}
      suffix={rightIcon}
      status={hasError ? 'error' : undefined as any}
      className={cn(className)}
      {...(props as any)}
    />
  ),
);
Input.displayName = 'Input';
