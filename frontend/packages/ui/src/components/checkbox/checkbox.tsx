import { forwardRef } from 'react';
import { Checkbox as AntCheckbox } from 'antd';
import { cn } from '@xanh/utils';

export interface CheckboxProps {
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  label?: string;
  children?: React.ReactNode;
  className?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ label, onCheckedChange, className, children, ...props }, ref) => (
    <AntCheckbox
      ref={ref as any}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={cn(className)}
      {...(props as any)}
    >
      {label || children}
    </AntCheckbox>
  ),
);
Checkbox.displayName = 'Checkbox';
