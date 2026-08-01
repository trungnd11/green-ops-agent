import { Modal } from 'antd';

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  children?: React.ReactNode;
}

export function Dialog({ open, onOpenChange, title, children, ...props }: DialogProps) {
  return (
    <Modal
      open={open as any}
      onCancel={() => onOpenChange?.(false)}
      title={title}
      footer={null}
      width={480}
      centered
      {...(props as any)}
    >
      {children}
    </Modal>
  );
}
