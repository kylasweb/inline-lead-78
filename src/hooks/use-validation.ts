import { useState, useCallback, useRef } from 'react';
import { z } from 'zod';
import { useForm, UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  validateData,
  safeParseData,
  validateField,
  formatValidationErrors,
  createDebouncedValidator,
  type ValidationError,
  type ValidationResult,
} from '@/lib/validation/utils';
import type { UseValidationReturn, ValidationState, FieldValidationError } from '@/types/validation';

// Hook for basic validation without React Hook Form
export function useValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialData?: Partial<T>
): UseValidationReturn<T> {
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const validate = useCallback(async (data: T): Promise<boolean> => {
    setIsValidating(true);
    const result = safeParseData(schema, data);
    
    if (result.success) {
      setErrors({} as Record<keyof T, string>);
      setIsValid(true);
      setIsValidating(false);
      return true;
    } else {
      const newErrors = {} as Record<keyof T, string>;
      result.errors.forEach(error => {
        newErrors[error.field as keyof T] = error.message;
      });
      setErrors(newErrors);
      setIsValid(false);
      setIsValidating(false);
      return false;
    }
  }, [schema]);

  const validateFieldValue = useCallback(async (field: keyof T, value: any): Promise<string | undefined> => {
    setIsValidating(true);
    const error = validateField(schema, field as string, value);
    
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    setIsValidating(false);
    return error;
  }, [schema]);

  const clearErrors = useCallback(() => {
    setErrors({} as Record<keyof T, string>);
    setIsValid(false);
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    validate,
    validateField: validateFieldValue,
    errors,
    isValid,
    isValidating,
    clearErrors,
    clearFieldError,
  };
}

// Hook for React Hook Form integration with Zod
export function useZodForm<T extends FieldValues>(
  schema: z.ZodSchema<T>,
  defaultValues?: Partial<T>
): UseFormReturn<T> & {
  validateAsync: (data: T) => Promise<ValidationResult<T>>;
  getFieldError: (field: Path<T>) => string | undefined;
} {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
    mode: 'onChange',
  });

  const validateAsync = useCallback(async (data: T): Promise<ValidationResult<T>> => {
    return validateData(schema, data);
  }, [schema]);

  const getFieldError = useCallback((field: Path<T>): string | undefined => {
    const error = form.formState.errors[field];
    return typeof error?.message === 'string' ? error.message : undefined;
  }, [form.formState.errors]);

  return {
    ...form,
    validateAsync,
    getFieldError,
  };
}

// Hook for multi-step form validation
export function useMultiStepValidation<T extends Record<string, any>>(
  schemas: z.ZodSchema<any>[],
  initialData?: Partial<T>
) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepData] = useState<Partial<T>[]>(
    schemas.map(() => ({}))
  );
  const [stepErrors, setStepErrors] = useState<ValidationError[][]>(
    schemas.map(() => [])
  );
  const [isValidating, setIsValidating] = useState(false);

  const validateStep = useCallback(async (step: number, data: any): Promise<boolean> => {
    if (step >= schemas.length) return false;
    
    setIsValidating(true);
    const result = safeParseData(schemas[step], data);
    
    const newStepErrors = [...stepErrors];
    if (result.success) {
      newStepErrors[step] = [];
      setStepErrors(newStepErrors);
      
      const newStepData = [...stepData];
      newStepData[step] = data;
      setStepData(newStepData);
      
      setIsValidating(false);
      return true;
    } else {
      newStepErrors[step] = result.errors;
      setStepErrors(newStepErrors);
      setIsValidating(false);
      return false;
    }
  }, [schemas, stepData, stepErrors]);

  const validateAllSteps = useCallback(async (): Promise<boolean> => {
    setIsValidating(true);
    let allValid = true;
    
    for (let i = 0; i < schemas.length; i++) {
      const isStepValid = await validateStep(i, stepData[i]);
      if (!isStepValid) {
        allValid = false;
      }
    }
    
    setIsValidating(false);
    return allValid;
  }, [schemas, stepData, validateStep]);

  const nextStep = useCallback(async (): Promise<boolean> => {
    const isValid = await validateStep(currentStep, stepData[currentStep]);
    if (isValid && currentStep < schemas.length - 1) {
      setCurrentStep(currentStep + 1);
      return true;
    }
    return isValid;
  }, [currentStep, schemas.length, stepData, validateStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const updateStepData = useCallback((step: number, data: Partial<T>) => {
    const newStepData = [...stepData];
    newStepData[step] = { ...newStepData[step], ...data };
    setStepData(newStepData);
  }, [stepData]);

  const getAllData = useCallback((): T => {
    return stepData.reduce((acc, step) => ({ ...acc, ...step }), {}) as T;
  }, [stepData]);

  return {
    currentStep,
    stepData,
    stepErrors,
    isValidating,
    validateStep,
    validateAllSteps,
    nextStep,
    previousStep,
    updateStepData,
    getAllData,
    totalSteps: schemas.length,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === schemas.length - 1,
  };
}

// Hook for debounced field validation
export function useDebouncedValidation<T>(
  validator: (value: T) => Promise<string | undefined>,
  delay = 300
) {
  const [error, setError] = useState<string | undefined>();
  const [isValidating, setIsValidating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const validate = useCallback(async (value: T) => {
    setIsValidating(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const validationError = await validator(value);
        setError(validationError);
      } catch (err) {
        setError('Validation failed');
      } finally {
        setIsValidating(false);
      }
    }, delay);
  }, [validator, delay]);

  const clearError = useCallback(() => {
    setError(undefined);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsValidating(false);
  }, []);

  return { validate, error, isValidating, clearError };
}

// Hook for async validation (e.g., checking if email exists)
export function useAsyncValidation<T>(
  asyncValidator: (value: T) => Promise<ValidationResult<T>>,
  dependencies: any[] = []
) {
  const [validationState, setValidationState] = useState<ValidationState<T | null>>({
    data: null,
    errors: {},
    isValid: false,
    isValidating: false,
  });

  const validate = useCallback(async (value: T) => {
    setValidationState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const result = await asyncValidator(value);
      
      if (result.success && result.data) {
        setValidationState({
          data: result.data,
          errors: {},
          isValid: true,
          isValidating: false,
        });
      } else {
        const errors: Record<string, string> = {};
        result.errors?.forEach(error => {
          errors[error.field] = error.message;
        });
        
        setValidationState({
          data: null,
          errors,
          isValid: false,
          isValidating: false,
        });
      }
    } catch (error) {
      setValidationState({
        data: null,
        errors: { general: 'Validation failed' },
        isValid: false,
        isValidating: false,
      });
    }
  }, [asyncValidator, ...dependencies]);

  const reset = useCallback(() => {
    setValidationState({
      data: null,
      errors: {},
      isValid: false,
      isValidating: false,
    });
  }, []);

  return { ...validationState, validate, reset };
}

// Hook for form submission with validation
export function useValidatedSubmission<T extends FieldValues>(
  schema: z.ZodSchema<T>,
  onSubmit: (data: T) => Promise<void> | void,
  onError?: (errors: FieldValidationError[]) => void
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submit = useCallback(async (data: unknown) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = safeParseData(schema, data);
      
      if (!result.success) {
        const fieldErrors: FieldValidationError[] = result.errors.map(error => ({
          field: error.field,
          message: error.message,
          type: 'format' as const,
        }));
        
        onError?.(fieldErrors);
        setSubmitError(formatValidationErrors(result.errors));
        return false;
      }

      await onSubmit(result.data);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Submission failed';
      setSubmitError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [schema, onSubmit, onError]);

  const clearError = useCallback(() => {
    setSubmitError(null);
  }, []);

  return {
    submit,
    isSubmitting,
    submitError,
    clearError,
  };
}

// Hook for conditional validation based on other form fields
export function useConditionalValidation<T extends Record<string, any>>(
  baseSchema: z.ZodSchema<T>,
  conditions: Array<{
    when: (data: Partial<T>) => boolean;
    then: z.ZodSchema<any>;
    field: keyof T;
  }>
) {
  const [conditionalErrors, setConditionalErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>);

  const validateConditional = useCallback(async (data: Partial<T>): Promise<boolean> => {
    const errors = {} as Record<keyof T, string>;
    let hasErrors = false;

    for (const condition of conditions) {
      if (condition.when(data)) {
        const fieldValue = data[condition.field];
        const result = condition.then.safeParse(fieldValue);
        
        if (!result.success) {
          errors[condition.field] = result.error.errors[0]?.message || 'Validation failed';
          hasErrors = true;
        }
      }
    }

    setConditionalErrors(errors);
    return !hasErrors;
  }, [conditions]);

  const clearConditionalErrors = useCallback(() => {
    setConditionalErrors({} as Record<keyof T, string>);
  }, []);

  return {
    validateConditional,
    conditionalErrors,
    clearConditionalErrors,
  };
}