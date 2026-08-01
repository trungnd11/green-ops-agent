import { forwardRef } from 'react';
import { Button as AntButton } from 'antd';
import { cn } from '@xanh/utils';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  htmlType?: 'button' | 'submit' | 'reset';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'default', isLoading, leftIcon, className, children, ...props }, ref) => {
    const antType = variant === 'primary' ? 'primary' : variant === 'danger' ? 'primary' : variant === 'ghost' ? 'text' : 'default';
    return (
      <AntButton
        ref={ref as any}
        type={antType}
        danger={variant === 'danger'}
        size={size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'middle'}
        loading={!!isLoading}
        icon={leftIcon}
        className={cn(className)}
        {...(props as any)}
      >
        {children}
      </AntButton>
    );
  },
);
Button.displayName = 'Button';
