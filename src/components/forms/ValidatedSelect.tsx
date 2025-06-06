import * as React from "react";
import { AlertCircle, CheckCircle2, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ValidatedSelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  error?: string;
  isValid?: boolean;
  isValidating?: boolean;
  showValidationIcons?: boolean;
  helperText?: string;
  required?: boolean;
  variant?: 'default' | 'success' | 'error' | 'warning';
  disabled?: boolean;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onValidate?: (value: string) => void;
  containerClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
  errorClassName?: string;
  helperClassName?: string;
  id?: string;
  name?: string;
}

const ValidatedSelect = React.forwardRef<
  React.ElementRef<typeof SelectTrigger>,
  ValidatedSelectProps
>(({
  label,
  placeholder = "Select an option...",
  options,
  value,
  defaultValue,
  error,
  isValid,
  isValidating,
  showValidationIcons = true,
  helperText,
  required = false,
  variant = 'default',
  disabled = false,
  onChange,
  onBlur,
  onValidate,
  containerClassName,
  labelClassName,
  selectClassName,
  errorClassName,
  helperClassName,
  id,
  name,
  ...props
}, ref) => {
  const generatedId = React.useId();
  const selectId = id || generatedId;

  // Determine validation state
  const hasError = Boolean(error);
  const hasSuccess = isValid && !hasError && !isValidating;
  const currentVariant = hasError ? 'error' : hasSuccess ? 'success' : variant;

  // Handle value change
  const handleValueChange = React.useCallback((newValue: string) => {
    onChange?.(newValue);
    onValidate?.(newValue);
  }, [onChange, onValidate]);

  // Handle blur
  const handleBlur = React.useCallback(() => {
    onBlur?.();
  }, [onBlur]);

  // Select trigger styling based on variant
  const selectStyles = cn(
    "validated-select transition-all duration-200 relative",
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
      
      // Padding adjustment for validation icons
      "pr-12": showValidationIcons && (hasError || hasSuccess || isValidating),
    },
    selectClassName
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
    <div className={cn("validated-select-container", containerClassName)}>
      {label && (
        <Label htmlFor={selectId} className={labelStyles}>
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Select
          value={value}
          defaultValue={defaultValue}
          onValueChange={handleValueChange}
          disabled={disabled}
          name={name}
        >
          <SelectTrigger
            ref={ref}
            id={selectId}
            className={selectStyles}
            onBlur={handleBlur}
            aria-invalid={hasError}
            aria-describedby={
              cn(
                error && `${selectId}-error`,
                helperText && `${selectId}-helper`
              ).trim() || undefined
            }
            {...props}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          
          <SelectContent>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Validation Icons */}
        {showValidationIcons && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
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

      {/* Error Message */}
      {error && (
        <p 
          id={`${selectId}-error`}
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
          id={`${selectId}-helper`}
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
});

ValidatedSelect.displayName = "ValidatedSelect";

export { ValidatedSelect };