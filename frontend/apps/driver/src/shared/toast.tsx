import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';

type ToastType = 'ok' | 'err';

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('ok');
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((msg: string, t: ToastType = 'ok') => {
    setMessage(msg);
    setType(t);
    setVisible(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setVisible(false), 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className={`toast glass-soft ${type} ${visible ? 'show' : ''}`} role="status">
        <CheckCircle2 size={18} strokeWidth={2} />
        <span>{message}</span>
      </div>
    </ToastContext.Provider>
  );
}
