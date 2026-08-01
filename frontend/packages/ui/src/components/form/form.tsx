import { forwardRef } from 'react';
import { cn } from '@xanh/utils';

export const FormLabel = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, children, ...props }, ref) => (
    <label ref={ref} className={cn('block text-sm font-medium text-text-primary', className)} {...props}>
      {children}
    </label>
  ),
);
FormLabel.displayName = 'FormLabel';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  description?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, required, description, error, children, className }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <FormLabel>
          {label}
          {required && <span className="ml-1 text-semantic-error">*</span>}
        </FormLabel>
      )}
      {description && <p className="text-xs text-text-tertiary">{description}</p>}
      {children}
      {error && <p className="text-xs text-semantic-error" role="alert">{error}</p>}
    </div>
  ),
);
FormField.displayName = 'FormField';

export const FormMessage = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ children, className, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs text-semantic-error', className)} role="alert" {...props}>
      {children}
    </p>
  ),
);
FormMessage.displayName = 'FormMessage';

export const FormActions = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-3 pt-2', className)} {...props}>
      {children}
    </div>
  ),
);
FormActions.displayName = 'FormActions';
