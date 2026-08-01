import { forwardRef } from 'react';
import { Empty } from 'antd';
import { cn } from '@xanh/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className }, ref) => (
    <div ref={ref} className={cn('flex flex-col items-center justify-center py-12', className)}>
      <Empty
        image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div className="text-center">
            <h3 className="text-base font-semibold text-text-primary">{title}</h3>
            {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
          </div>
        }
      >
        {action && <div className="mt-4">{action}</div>}
      </Empty>
    </div>
  ),
);
EmptyState.displayName = 'EmptyState';
