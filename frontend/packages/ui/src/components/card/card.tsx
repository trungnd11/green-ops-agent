import { forwardRef } from 'react';
import { Card as AntCard } from 'antd';
import { cn } from '@xanh/utils';

export interface CardProps {
  variant?: 'default' | 'soft';
  className?: string;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className, children, ...props }, ref) => (
    <AntCard
      ref={ref as any}
      className={cn(
        variant === 'soft' ? 'bg-surface-card-soft' : 'bg-surface-card',
        'border-border-default',
        className,
      )}
      bordered={false}
      {...(props as any)}
    >
      {children}
    </AntCard>
  ),
);
Card.displayName = 'Card';
