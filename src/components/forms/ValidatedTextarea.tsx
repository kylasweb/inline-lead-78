import * as React from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface ValidatedTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'onBlur'> {
  label?: string;
  error?: string;
  isValid?: boolean;
  isValidating?: boolean;
  showValidationIcons?: boolean;
  helperText?: string;
  required?: boolean;
  variant?: 'default' | 'success' | 'error' | 'warning';
  showCharCount?: boolean;
  maxLength?: number;
  minHeight?: number;
  maxHeight?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  onChange?: (value: string, event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (value: string, event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onValidate?: (value: string) => void;
  debounceMs?: number;
  containerClassName?: string;
  labelClassName?: string;
  textareaClassName?: string;
  errorClassName?: string;
  helperClassName?: string;
  charCountClassName?: string;
}

const ValidatedTextarea = React.forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({
    label,
    error,
    isValid,
    isValidating,
    showValidationIcons = true,
    helperText,
    required = false,
    variant = 'default',
    showCharCount = false,
    maxLength,
    minHeight = 80,
    maxHeight,
    resize = 'vertical',
    onChange,
    onBlur,
    onValidate,
    debounceMs = 300,
    containerClassName,
    labelClassName,
    textareaClassName,
    errorClassName,
    helperClassName,
    charCountClassName,
    className,
    id,
    disabled,
    style,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(props.defaultValue?.toString() || '');
    const debounceTimeoutRef = React.useRef<NodeJS.Timeout>();
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    // Get current character count
    const currentValue = props.value !== undefined ? props.value.toString() : internalValue;
    const charCount = currentValue.length;
    const isOverLimit = maxLength ? charCount > maxLength : false;

    // Determine validation state
    const hasError = Boolean(error) || isOverLimit;
    const hasSuccess = isValid && !hasError && !isValidating;
    const currentVariant = hasError ? 'error' : hasSuccess ? 'success' : variant;

    // Handle textarea change with debounced validation
    const handleChange = React.useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value;
      setInternalValue(value);
      
      // Call onChange immediately
      onChange?.(value, event);

      // Debounced validation
      if (onValidate && debounceMs > 0) {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
          onValidate(value);
        }, debounceMs);
      } else if (onValidate) {
        onValidate(value);
      }
    }, [onChange, onValidate, debounceMs]);

    // Handle blur
    const handleBlur = React.useCallback((event: React.FocusEvent<HTMLTextAreaElement>) => {
      const value = event.target.value;
      onBlur?.(value, event);
      
      // Trigger immediate validation on blur if not already validating
      if (onValidate && !isValidating) {
        onValidate(value);
      }
    }, [onBlur, onValidate, isValidating]);

    // Clean up timeout on unmount
    React.useEffect(() => {
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      };
    }, []);

    // Textarea styling based on variant
    const textareaStyles = cn(
      "validated-textarea transition-all duration-200 relative",
      {
        // Error state
        "border-red-500 focus:border-red-500 focus:ring-red-500/20": currentVariant === 'error',
        "focus:ring-red-100 dark:focus:ring-red-900/20": currentVariant === 'error',
        
        // Success state  
        "border-green-500 focus:border-green-500 focus:ring-green-500/20": currentVariant === 'success',
        "focus:ring-green-100 dark:focus:ring-green-900/20": currentVariant === 'success',
        
        // Warning state
        "border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500/20": currentVariant === 'warning',
        "focus:ring-yellow-100 dark:focus:ring-yellow-900/20": currentVariant === 'warning',
        
        // Default state
        "focus:ring-blue-500/20": currentVariant === 'default',
        
        // Resize options
        "resize-none": resize === 'none',
        "resize-y": resize === 'vertical',
        "resize-x": resize === 'horizontal',
        "resize": resize === 'both',
      },
      textareaClassName,
      className
    );

    // Label styling
    const labelStyles = cn(
      "block text-sm font-medium mb-1.5 transition-colors duration-200",
      {
        "text-red-600 dark:text-red-400": currentVariant === 'error',
        "text-green-600 dark:text-green-400": currentVariant === 'success',
        "text-yellow-600 dark:text-yellow-400": currentVariant === 'warning',
        "text-gray-700 dark:text-gray-300": currentVariant === 'default',
      },
      labelClassName
    );

    // Character count styling
    const charCountStyles = cn(
      "text-xs transition-colors duration-200",
      {
        "text-red-600 dark:text-red-400": isOverLimit,
        "text-yellow-600 dark:text-yellow-400": maxLength && charCount > maxLength * 0.8,
        "text-gray-500 dark:text-gray-400": !isOverLimit && (!maxLength || charCount <= maxLength * 0.8),
      },
      charCountClassName
    );

    // Combine inline styles
    const combinedStyle: React.CSSProperties = {
      minHeight: `${minHeight}px`,
      maxHeight: maxHeight ? `${maxHeight}px` : undefined,
      ...style,
    };

    return (
      <div className={cn("validated-textarea-container", containerClassName)}>
        {label && (
          <Label htmlFor={textareaId} className={labelStyles}>
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </Label>
        )}
        
        <div className="relative">
          <Textarea
            ref={ref}
            id={textareaId}
            value={props.value !== undefined ? props.value : internalValue}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            maxLength={maxLength}
            className={textareaStyles}
            style={combinedStyle}
            aria-invalid={hasError}
            aria-describedby={
              cn(
                error && `${textareaId}-error`,
                helperText && `${textareaId}-helper`,
                showCharCount && `${textareaId}-charcount`
              ).trim() || undefined
            }
            {...props}
          />

          {/* Validation Icons */}
          {showValidationIcons && (
            <div className="absolute right-3 top-3 flex items-center">
              {isValidating && (
                <Loader2 
                  className="h-4 w-4 animate-spin text-blue-500" 
                  aria-label="Validating"
                />
              )}
              {hasError && !isValidating && (
                <AlertCircle 
                  className="h-4 w-4 text-red-500" 
                  aria-label="Error"
                />
              )}
              {hasSuccess && !isValidating && (
                <CheckCircle2 
                  className="h-4 w-4 text-green-500" 
                  aria-label="Valid"
                />
              )}
            </div>
          )}
        </div>

        {/* Footer with error/helper text and character count */}
        <div className="flex justify-between items-start mt-1.5 gap-2">
          <div className="flex-1">
            {/* Error Message */}
            {error && (
              <p 
                id={`${textareaId}-error`}
                className={cn(
                  "text-sm text-red-600 dark:text-red-400 flex items-center gap-1",
                  errorClassName
                )}
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                {error}
              </p>
            )}

            {/* Helper Text */}
            {helperText && !error && (
              <p 
                id={`${textareaId}-helper`}
                className={cn(
                  "text-sm text-gray-500 dark:text-gray-400",
                  helperClassName
                )}
              >
                {helperText}
              </p>
            )}
          </div>

          {/* Character Count */}
          {showCharCount && (
            <p 
              id={`${textareaId}-charcount`}
              className={charCountStyles}
              aria-live="polite"
            >
              {charCount}{maxLength && `/${maxLength}`}
            </p>
          )}
        </div>
      </div>
    );
  }
);

ValidatedTextarea.displayName = "ValidatedTextarea";

export { ValidatedTextarea };