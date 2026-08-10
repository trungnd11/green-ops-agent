import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
  children: ReactNode;
}

export function GlassButton({ variant = 'primary', isLoading = false, children, className, disabled, ...rest }: GlassButtonProps) {
  const variantClass =
    variant === 'primary' ? 'btn-primary' : variant === 'secondary' ? 'btn-secondary' : 'btn-ghost';
  return (
    <button className={`btn ${variantClass} ${className || ''}`} disabled={disabled || isLoading} {...rest}>
      {isLoading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  );
}
