import { notification } from 'antd';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  action?: ToastAction;
  duration?: number;
}

export function toast(props: ToastProps) {
  const typeMap = {
    default: 'info' as const,
    success: 'success' as const,
    error: 'error' as const,
    warning: 'warning' as const,
  };
  const method = typeMap[props.variant || 'default'];
  notification[method]({
    message: props.title,
    description: props.description,
    duration: props.duration || 5,
    btn: props.action ? (
      <button onClick={props.action.onClick}>{props.action.label}</button>
    ) : undefined,
    placement: 'bottomRight',
  });
}

export { toast as default };
