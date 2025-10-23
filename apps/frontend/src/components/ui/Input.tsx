import { forwardRef, InputHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'flex w-full rounded-xl border-2 bg-surface px-4 py-3 text-[15px] text-foreground placeholder:text-tertiary transition-all duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-border hover:border-border-hover focus-visible:border-brand-green-500 focus-visible:ring-4 focus-visible:ring-brand-green-500/10',
        error:
          'border-error focus-visible:border-error focus-visible:ring-4 focus-visible:ring-error/10',
      },
      inputSize: {
        sm: 'h-9 px-3 py-2 text-sm',
        md: 'h-11 px-4 py-3 text-[15px]',
        lg: 'h-12 px-5 py-3.5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  }
);

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>,
  VariantProps<typeof inputVariants> {
  error?: string;
  label?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, type = 'text', error, label, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          className={inputVariants({
            variant: error ? 'error' : variant,
            inputSize,
            className,
          })}
          ref={ref}
          id={inputId}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-error flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-error" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-secondary">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
