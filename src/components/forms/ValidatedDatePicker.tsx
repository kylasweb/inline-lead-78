import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ValidatedDatePickerProps {
  label?: string;
  placeholder?: string;
  value?: Date;
  defaultValue?: Date;
  error?: string;
  isValid?: boolean;
  isValidating?: boolean;
  showValidationIcons?: boolean;
  helperText?: string;
  required?: boolean;
  variant?: 'default' | 'success' | 'error' | 'warning';
  disabled?: boolean;
  disabledDates?: (date: Date) => boolean;
  minDate?: Date;
  maxDate?: Date;
  dateFormat?: string;
  showTimeSelect?: boolean;
  onChange?: (date: Date | undefined) => void;
  onBlur?: () => void;
  onValidate?: (date: Date | undefined) => void;
  containerClassName?: string;
  labelClassName?: string;
  buttonClassName?: string;
  errorClassName?: string;
  helperClassName?: string;
  id?: string;
  name?: string;
}

const ValidatedDatePicker = React.forwardRef<
  React.ElementRef<typeof PopoverTrigger>,
  ValidatedDatePickerProps
>(({
  label,
  placeholder = "Pick a date",
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
  disabledDates,
  minDate,
  maxDate,
  dateFormat = "PPP",
  showTimeSelect = false,
  onChange,
  onBlur,
  onValidate,
  containerClassName,
  labelClassName,
  buttonClassName,
  errorClassName,
  helperClassName,
  id,
  name,
  ...props
}, ref) => {
  const [internalValue, setInternalValue] = React.useState<Date | undefined>(defaultValue);
  const [isOpen, setIsOpen] = React.useState(false);
  const generatedId = React.useId();
  const datePickerId = id || generatedId;

  const currentValue = value !== undefined ? value : internalValue;

  // Determine validation state
  const hasError = Boolean(error);
  const hasSuccess = isValid && !hasError && !isValidating;
  const currentVariant = hasError ? 'error' : hasSuccess ? 'success' : variant;

  // Handle date selection
  const handleDateSelect = React.useCallback((date: Date | undefined) => {
    setInternalValue(date);
    setIsOpen(false);
    
    // Call onChange and validation
    onChange?.(date);
    onValidate?.(date);
  }, [onChange, onValidate]);

  // Handle popover open change
  const handleOpenChange = React.useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      onBlur?.();
    }
  }, [onBlur]);

  // Create disabled date function that combines all restrictions
  const getDisabledDate = React.useCallback((date: Date) => {
    // Check custom disabled dates
    if (disabledDates?.(date)) return true;
    
    // Check min/max dates
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    
    return false;
  }, [disabledDates, minDate, maxDate]);

  // Button styling based on variant
  const buttonStyles = cn(
    "validated-datepicker w-full justify-start text-left font-normal transition-all duration-200",
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
      
      // Placeholder styling
      "text-muted-foreground": !currentValue,
    },
    buttonClassName
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
    <div className={cn("validated-datepicker-container", containerClassName)}>
      {label && (
        <Label htmlFor={datePickerId} className={labelStyles}>
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              id={datePickerId}
              variant="outline"
              className={buttonStyles}
              disabled={disabled}
              aria-invalid={hasError}
              aria-describedby={
                cn(
                  error && `${datePickerId}-error`,
                  helperText && `${datePickerId}-helper`
                ).trim() || undefined
              }
              {...props}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {currentValue ? format(currentValue, dateFormat) : placeholder}
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={currentValue}
              onSelect={handleDateSelect}
              disabled={getDisabledDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Validation Icons */}
        {showValidationIcons && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
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

        {/* Hidden input for form integration */}
        <input
          type="hidden"
          name={name}
          value={currentValue ? currentValue.toISOString() : ''}
        />
      </div>

      {/* Error Message */}
      {error && (
        <p 
          id={`${datePickerId}-error`}
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
          id={`${datePickerId}-helper`}
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

ValidatedDatePicker.displayName = "ValidatedDatePicker";

export { ValidatedDatePicker };