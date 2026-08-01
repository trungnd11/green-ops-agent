import { forwardRef, type ComponentProps } from 'react';
import { Skeleton as AntSkeleton } from 'antd';
import { cn } from '@xanh/utils';

type AntSkeletonProps = ComponentProps<typeof AntSkeleton>;

const variantMap: Record<string, AntSkeletonProps> = {
  text: { paragraph: { rows: 1, width: '100%' }, title: false, active: true },
  card: { paragraph: { rows: 3 }, title: false, active: true },
  avatar: { avatar: true, paragraph: { rows: 0 }, active: true },
  table: { paragraph: { rows: 4 }, title: false, active: true },
};

export interface SkeletonProps {
  variant?: keyof typeof variantMap;
  className?: string;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'text', className }, ref) => (
    <div ref={ref} className={cn(className)}>
      <AntSkeleton {...variantMap[variant]} />
    </div>
  ),
);
Skeleton.displayName = 'Skeleton';
