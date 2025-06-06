import * as React from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface ValidatedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'> {
  label?: string;
  error?: string;
  isValid?: boolean;
  isValidating?: boolean;
  showValidationIcons?: boolean;
  helperText?: string;
  required?: boolean;
  variant?: 'default' | 'success' | 'error' | 'warning';
  passwordToggle?: boolean;
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (value: string, event: React.FocusEvent<HTMLInputElement>) => void;
  onValidate?: (value: string) => void;
  debounceMs?: number;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  helperClassName?: string;
}

const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({
    label,
    error,
    isValid,
    isValidating,
    showValidationIcons = true,
    helperText,
    required = false,
    variant = 'default',
    passwordToggle = false,
    onChange,
    onBlur,
    onValidate,
    debounceMs = 300,
    containerClassName,
    labelClassName,
    inputClassName,
    errorClassName,
    helperClassName,
    type = 'text',
    className,
    id,
    disabled,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(props.defaultValue?.toString() || '');
    const debounceTimeoutRef = React.useRef<NodeJS.Timeout>();
    const generatedId = React.useId();
    const inputId = id || generatedId;

    // Determine the actual input type
    const inputType = type === 'password' && showPassword ? 'text' : type;
    const isPasswordField = type === 'password' && passwordToggle;

    // Determine validation state
    const hasError = Boolean(error);
    const hasSuccess = isValid && !hasError && !isValidating;
    const currentVariant = hasError ? 'error' : hasSuccess ? 'success' : variant;

    // Handle input change with debounced validation
    const handleChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
    const handleBlur = React.useCallback((event: React.FocusEvent<HTMLInputElement>) => {
      const value = event.target.value;
      onBlur?.(value, event);
      
      // Trigger immediate validation on blur if not already validating
      if (onValidate && !isValidating) {
        onValidate(value);
      }
    }, [onBlur, onValidate, isValidating]);

    // Toggle password visibility
    const togglePasswordVisibility = React.useCallback(() => {
      setShowPassword(prev => !prev);
    }, []);

    // Clean up timeout on unmount
    React.useEffect(() => {
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      };
    }, []);

    // Input styling based on variant
    const inputStyles = cn(
      "validated-input transition-all duration-200",
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
        
        // Padding adjustments for icons
        "pr-16": isPasswordField && showValidationIcons && (hasError || hasSuccess || isValidating),
        "pr-10": (showValidationIcons && (hasError || hasSuccess || isValidating)) || (isPasswordField && !showValidationIcons),
      },
      inputClassName,
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

    return (
      <div className={cn("validated-input-container", containerClassName)}>
        {label && (
          <Label htmlFor={inputId} className={labelStyles}>
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </Label>
        )}
        
        <div className="relative">
          <Input
            ref={ref}
            id={inputId}
            type={inputType}
            value={props.value !== undefined ? props.value : internalValue}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            className={inputStyles}
            aria-invalid={hasError}
            aria-describedby={
              cn(
                error && `${inputId}-error`,
                helperText && `${inputId}-helper`
              ).trim() || undefined
            }
            {...props}
          />

          {/* Validation Icons */}
          {showValidationIcons && (
            <div className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 flex items-center",
              isPasswordField && "right-12"
            )}>
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

          {/* Password Toggle */}
          {isPasswordField && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
              onClick={togglePasswordVisibility}
              disabled={disabled}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p 
            id={`${inputId}-error`}
            className={cn(
              "mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1",
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
            id={`${inputId}-helper`}
            className={cn(
              "mt-1.5 text-sm text-gray-500 dark:text-gray-400",
              helperClassName
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";

export { ValidatedInput };