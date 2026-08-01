import { forwardRef } from 'react';
import AntDrawer from 'antd/es/drawer';
import { cn } from '@xanh/utils';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  width?: number | string;
  className?: string;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  closable?: boolean;
  styles?: Record<string, React.CSSProperties>;
  getContainer?: HTMLElement | false | (() => HTMLElement);
}

export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(
  ({ open, onClose, title, children, width = 480, className, placement = 'right', ...rest }, ref) => {
    return (
      <AntDrawer
        ref={ref as any}
        open={open}
        onClose={onClose}
        title={title}
        width={width}
        placement={placement}
        className={cn(className)}
        {...(rest as any)}
      >
        {children}
      </AntDrawer>
    );
  },
);
Drawer.displayName = 'Drawer';
