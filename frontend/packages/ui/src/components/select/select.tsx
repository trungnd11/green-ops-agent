import { forwardRef } from 'react';
import { Select as AntSelect } from 'antd';
import { cn } from '@xanh/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  allowClear?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder = 'Chọn...', hasError, className, onValueChange, allowClear = true, ...props }, ref) => (
    <AntSelect
      ref={ref as any}
      placeholder={placeholder}
      options={options}
      size="middle"
      allowClear={allowClear}
      status={hasError ? 'error' : undefined as any}
      onChange={(v) => onValueChange?.(v ?? '')}
      className={cn('w-full [&_.ant-select-selector]:!px-[11px]', className)}
      popupClassName="rounded-lg"
      {...(props as any)}
    />
  ),
);
Select.displayName = 'Select';
