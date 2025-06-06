import * as React from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ValidatedNumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur' | 'onFocus' | 'type' | 'value'> {
  label?: string;
  error?: string;
  isValid?: boolean;
  isValidating?: boolean;
  showValidationIcons?: boolean;
  helperText?: string;
  required?: boolean;
  variant?: 'default' | 'success' | 'error' | 'warning';
  value?: number | string;
  defaultValue?: number | string;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  format?: 'number' | 'currency' | 'percentage' | 'decimal';
  currency?: string;
  locale?: string;
  allowNegative?: boolean;
  allowDecimal?: boolean;
  thousandsSeparator?: boolean;
  prefix?: string;
  suffix?: string;
  onChange?: (value: number | undefined, formattedValue: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (value: number | undefined, formattedValue: string, event: React.FocusEvent<HTMLInputElement>) => void;
  onValidate?: (value: number | undefined) => void;
  debounceMs?: number;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  helperClassName?: string;
}

const ValidatedNumberInput = React.forwardRef<HTMLInputElement, ValidatedNumberInputProps>(
  ({
    label,
    error,
    isValid,
    isValidating,
    showValidationIcons = true,
    helperText,
    required = false,
    variant = 'default',
    value,
    defaultValue,
    min,
    max,
    step = 1,
    precision = 2,
    format = 'number',
    currency = 'USD',
    locale = 'en-US',
    allowNegative = true,
    allowDecimal = true,
    thousandsSeparator = true,
    prefix,
    suffix,
    onChange,
    onBlur,
    onValidate,
    debounceMs = 300,
    containerClassName,
    labelClassName,
    inputClassName,
    errorClassName,
    helperClassName,
    className,
    id,
    disabled,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string>('');
    const [isFocused, setIsFocused] = React.useState(false);
    const debounceTimeoutRef = React.useRef<NodeJS.Timeout>();
    const generatedId = React.useId();
    const inputId = id || generatedId;

    // Format number for display - moved before useEffect to fix hoisting issue
    const formatDisplayValue = React.useCallback((num: number): string => {
      if (isNaN(num)) return '';

      let formatted = '';
      
      switch (format) {
        case 'currency':
          formatted = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: precision,
            maximumFractionDigits: precision,
          }).format(num);
          break;
          
        case 'percentage':
          formatted = new Intl.NumberFormat(locale, {
            style: 'percent',
            minimumFractionDigits: precision,
            maximumFractionDigits: precision,
          }).format(num / 100);
          break;
          
        case 'decimal':
          formatted = new Intl.NumberFormat(locale, {
            minimumFractionDigits: precision,
            maximumFractionDigits: precision,
            useGrouping: thousandsSeparator,
          }).format(num);
          break;
          
        default:
          formatted = thousandsSeparator 
            ? new Intl.NumberFormat(locale).format(num)
            : num.toString();
          break;
      }

      // Add custom prefix/suffix
      if (prefix) formatted = prefix + formatted;
      if (suffix) formatted = formatted + suffix;

      return formatted;
    }, [format, currency, locale, precision, thousandsSeparator, prefix, suffix]);

    // Initialize internal value
    React.useEffect(() => {
      const initialValue = value !== undefined ? value : defaultValue;
      if (initialValue !== undefined) {
        setInternalValue(formatDisplayValue(Number(initialValue)));
      }
    }, [defaultValue, formatDisplayValue, value]);

    // Update internal value when external value changes
    React.useEffect(() => {
      if (value !== undefined && !isFocused) {
        setInternalValue(formatDisplayValue(Number(value)));
      }
    }, [value, isFocused, formatDisplayValue]);

    // Parse input value to number
    const parseInputValue = React.useCallback((inputStr: string): number | undefined => {
      if (!inputStr.trim()) return undefined;

      // Remove formatting characters
      let cleanStr = inputStr;
      
      // Remove custom prefix/suffix
      if (prefix) cleanStr = cleanStr.replace(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '');
      if (suffix) cleanStr = cleanStr.replace(new RegExp(`${suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '');
      
      // Remove currency symbols and percentage signs
      cleanStr = cleanStr.replace(/[$€£¥%,\s]/g, '');
      
      // Handle negative numbers
      const isNegative = cleanStr.includes('-');
      cleanStr = cleanStr.replace(/-/g, '');
      
      const parsed = parseFloat(cleanStr);
      if (isNaN(parsed)) return undefined;
      
      let result = isNegative && allowNegative ? -parsed : parsed;
      
      // Handle percentage
      if (format === 'percentage') {
        result = result * 100;
      }
      
      return result;
    }, [prefix, suffix, allowNegative, format]);

    // Validate number constraints
    const validateNumber = React.useCallback((num: number | undefined): boolean => {
      if (num === undefined) return !required;
      
      if (min !== undefined && num < min) return false;
      if (max !== undefined && num > max) return false;
      if (!allowNegative && num < 0) return false;
      if (!allowDecimal && num % 1 !== 0) return false;
      
      return true;
    }, [min, max, allowNegative, allowDecimal, required]);

    // Determine validation state
    const hasError = Boolean(error);
    const hasSuccess = isValid && !hasError && !isValidating;
    const currentVariant = hasError ? 'error' : hasSuccess ? 'success' : variant;

    // Handle input change
    const handleChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      setInternalValue(inputValue);
      
      const numericValue = parseInputValue(inputValue);
      onChange?.(numericValue, inputValue, event);

      // Debounced validation
      if (onValidate && debounceMs > 0) {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
          onValidate(numericValue);
        }, debounceMs);
      } else if (onValidate) {
        onValidate(numericValue);
      }
    }, [onChange, onValidate, parseInputValue, debounceMs]);

    // Handle focus
    const handleFocus = React.useCallback((event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      
      // Show raw number when focused for easier editing
      const numericValue = parseInputValue(internalValue);
      if (numericValue !== undefined) {
        setInternalValue(numericValue.toString());
      }
      
      // Call original onFocus if provided
    }, [internalValue, parseInputValue]);

    // Handle blur
    const handleBlur = React.useCallback((event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      
      const numericValue = parseInputValue(internalValue);
      
      // Format the value when losing focus
      if (numericValue !== undefined && validateNumber(numericValue)) {
        const formatted = formatDisplayValue(numericValue);
        setInternalValue(formatted);
      }
      
      onBlur?.(numericValue, internalValue, event);
      
      // Trigger immediate validation on blur
      if (onValidate && !isValidating) {
        onValidate(numericValue);
      }
      
      // Call original onBlur if provided
    }, [internalValue, parseInputValue, validateNumber, formatDisplayValue, onBlur, onValidate, isValidating]);

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
      "validated-number-input transition-all duration-200",
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
        "pr-10": showValidationIcons && (hasError || hasSuccess || isValidating),
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
      <div className={cn("validated-number-input-container", containerClassName)}>
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
            type="text"
            value={internalValue}
            onChange={handleChange}
            onFocus={handleFocus}
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
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
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

ValidatedNumberInput.displayName = "ValidatedNumberInput";

export { ValidatedNumberInput };