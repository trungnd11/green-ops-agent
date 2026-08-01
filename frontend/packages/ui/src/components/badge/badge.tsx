import { forwardRef } from 'react';
import { Tag } from 'antd';
import { cn } from '@xanh/utils';

const variantColorMap = {
  default: 'default',
  success: 'success',
  warning: 'warning',
  error: 'error',
  pending: 'purple',
  info: 'blue',
} as const;

export interface BadgeProps {
  variant?: keyof typeof variantColorMap;
  dot?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', dot, children, className, ...props }, ref) => (
    <Tag
      ref={ref}
      color={variantColorMap[variant]}
      className={cn(
        'inline-flex items-center gap-1 rounded-badge px-2.5 py-0.5 text-xs font-medium',
        className,
      )}
      {...props}
    >
      {dot && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </Tag>
  ),
);
Badge.displayName = 'Badge';
