import { forwardRef } from 'react';
import { Input } from 'antd';
import { cn } from '@xanh/utils';

export interface TextareaProps {
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  rows?: number;
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ hasError, rows = 4, className, ...props }, ref) => (
    <Input.TextArea
      ref={ref as any}
      rows={rows}
      status={hasError ? 'error' : undefined as any}
      className={cn(className)}
      {...(props as any)}
    />
  ),
);
Textarea.displayName = 'Textarea';
