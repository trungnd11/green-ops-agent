import { forwardRef } from 'react';
import { Alert as AntAlert } from 'antd';
import { cn } from '@xanh/utils';

const typeMap = {
  info: 'info' as const,
  success: 'success' as const,
  warning: 'warning' as const,
  error: 'error' as const,
};

export interface AlertProps {
  variant?: keyof typeof typeMap;
  icon?: React.ReactNode;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = 'info', icon, title, children, className, ...props }, ref) => (
    <AntAlert
      ref={ref as any}
      type={typeMap[variant]}
      message={title}
      description={children}
      icon={icon}
      showIcon={!!icon}
      className={cn('rounded-card', className)}
      {...(props as any)}
    />
  ),
);
Alert.displayName = 'Alert';
