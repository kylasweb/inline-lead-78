import { z } from 'zod';
import type { FieldError, FieldErrors } from 'react-hook-form';

// Generic validation result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Transform Zod errors to a more usable format
export function transformZodErrors(error: z.ZodError): ValidationError[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}

// Generic validation function
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: transformZodErrors(error),
      };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }],
    };
  }
}

// Safe parse with better error handling
export function safeParseData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
) {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true as const, data: result.data };
  }
  
  return {
    success: false as const,
    errors: transformZodErrors(result.error),
  };
}

// Convert validation errors to React Hook Form format
export function toReactHookFormErrors(errors: ValidationError[]): FieldErrors {
  const formErrors: FieldErrors = {};
  
  errors.forEach((error) => {
    const fieldPath = error.field.split('.');
    let current = formErrors;
    
    for (let i = 0; i < fieldPath.length - 1; i++) {
      const key = fieldPath[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key] as FieldErrors;
    }
    
    const lastKey = fieldPath[fieldPath.length - 1];
    current[lastKey] = {
      type: 'validation',
      message: error.message,
    } as FieldError;
  });
  
  return formErrors;
}

// Validate individual field
export function validateField<T>(
  schema: z.ZodSchema<T>,
  fieldName: string,
  value: unknown
): string | undefined {
  try {
    // Extract field schema from the main schema
    const fieldSchema = (schema as any).shape?.[fieldName];
    if (!fieldSchema) {
      return undefined;
    }
    
    fieldSchema.parse(value);
    return undefined;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message;
    }
    return 'Validation failed';
  }
}

// Async validation function (for server-side validation)
export async function validateDataAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  additionalValidators?: Array<(data: T) => Promise<ValidationError[]>>
): Promise<ValidationResult<T>> {
  // First, validate with Zod schema
  const result = safeParseData(schema, data);
  
  if (!result.success) {
    return {
      success: false,
      errors: result.errors,
    };
  }
  
  // Run additional async validators if provided
  if (additionalValidators && additionalValidators.length > 0) {
    const additionalErrors: ValidationError[] = [];
    
    for (const validator of additionalValidators) {
      try {
        const errors = await validator(result.data);
        additionalErrors.push(...errors);
      } catch (error) {
        additionalErrors.push({
          field: 'async',
          message: 'Async validation failed',
        });
      }
    }
    
    if (additionalErrors.length > 0) {
      return {
        success: false,
        errors: additionalErrors,
      };
    }
  }
  
  return {
    success: true,
    data: result.data,
  };
}

// Format validation errors for display
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0].message;
  
  return `Multiple errors: ${errors.map(e => e.message).join(', ')}`;
}

// Get first error for a specific field
export function getFieldError(errors: ValidationError[], fieldName: string): string | undefined {
  const error = errors.find(e => e.field === fieldName);
  return error?.message;
}

// Check if field has error
export function hasFieldError(errors: ValidationError[], fieldName: string): boolean {
  return errors.some(e => e.field === fieldName);
}

// Group errors by field
export function groupErrorsByField(errors: ValidationError[]): Record<string, ValidationError[]> {
  return errors.reduce((acc, error) => {
    if (!acc[error.field]) {
      acc[error.field] = [];
    }
    acc[error.field].push(error);
    return acc;
  }, {} as Record<string, ValidationError[]>);
}

// Custom validation utilities for common patterns
export const validationUtils = {
  // Email validation with custom message
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Phone validation with flexible formats
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
  },
  
  // Date validation
  isValidDate: (dateString: string): boolean => {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && Boolean(dateString.match(/^\d{4}-\d{2}-\d{2}$/));
  },
  
  // Future date validation
  isFutureDate: (dateString: string): boolean => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  },
  
  // Password strength validation
  isStrongPassword: (password: string): boolean => {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /\d/.test(password);
  },
  
  // URL validation
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
};

// Conditional validation based on other fields
export function createConditionalValidator<T>(
  condition: (data: T) => boolean,
  validator: z.ZodSchema<any>,
  fieldName: string
) {
  return (data: T): ValidationError[] => {
    if (!condition(data)) {
      return [];
    }
    
    const fieldValue = (data as any)[fieldName];
    const result = validator.safeParse(fieldValue);
    
    if (!result.success) {
      return result.error.errors.map(err => ({
        field: fieldName,
        message: err.message,
        code: err.code,
      }));
    }
    
    return [];
  };
}

// Validation debouncer for real-time validation
export function createDebouncedValidator<T>(
  validator: (data: T) => Promise<ValidationResult<T>>,
  delay = 300
) {
  let timeoutId: NodeJS.Timeout;
  
  return (data: T): Promise<ValidationResult<T>> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const result = await validator(data);
        resolve(result);
      }, delay);
    });
  };
}

// Validation middleware for forms
export function createValidationMiddleware<T>(
  schema: z.ZodSchema<T>,
  onSuccess?: (data: T) => void,
  onError?: (errors: ValidationError[]) => void
) {
  return (data: unknown) => {
    const result = safeParseData(schema, data);
    
    if (result.success) {
      onSuccess?.(result.data);
      return result.data;
    } else {
      onError?.(result.errors);
      throw new Error(formatValidationErrors(result.errors));
    }
  };
}