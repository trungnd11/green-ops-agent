import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface GlassSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function GlassSheet({ open, onClose, title, description, children, footer }: GlassSheetProps) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return undefined;
    }
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open && !shown) return null;

  return (
    <>
      <div className={`sheet-scrim ${shown ? 'show' : ''}`} onClick={onClose} />
      <div className={`sheet glass ${shown ? 'show' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-handle" />
        <div className="row-between" style={{ marginBottom: 6 }}>
          <h2 className="sheet-title">{title}</h2>
          <button type="button" className="icon-btn" aria-label="Đóng" onClick={onClose}>
            <X size={18} strokeWidth={1.9} />
          </button>
        </div>
        {description && <p className="sheet-desc">{description}</p>}
        {children}
        {footer && <div className="row-between" style={{ marginTop: 20 }}>{footer}</div>}
      </div>
    </>
  );
}
