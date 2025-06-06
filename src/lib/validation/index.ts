// Export all validation schemas
export * from './schemas';

// Export all validation utilities
export * from './utils';

// Re-export commonly used Zod utilities
export { z } from 'zod';

// Export validation types
export type * from '@/types/validation';

// Export validation hooks
export * from '@/hooks/use-validation';

// Convenience exports for common schemas
export {
  staffSchema,
  opportunitySchema,
  advancedOpportunitySchema,
  leadSchema,
  userSchema,
  loginSchema,
  registerSchema,
  // Step schemas for multi-step forms
  createOpportunityStepOneSchema,
  createOpportunityStepTwoSchema,
  createOpportunityStepThreeSchema,
  advancedOpportunityStepOneSchema,
  advancedOpportunityStepTwoSchema,
  advancedOpportunityStepThreeSchema,
  advancedOpportunityStepFourSchema,
  // Common validators
  commonValidators,
} from './schemas';

// Convenience exports for validation utilities
export {
  validateData,
  safeParseData,
  validateField,
  formatValidationErrors,
  getFieldError,
  hasFieldError,
  groupErrorsByField,
  validationUtils,
  createConditionalValidator,
  createDebouncedValidator,
  createValidationMiddleware,
} from './utils';

// Convenience exports for validation hooks
export {
  useValidation,
  useZodForm,
  useMultiStepValidation,
  useDebouncedValidation,
  useAsyncValidation,
  useValidatedSubmission,
  useConditionalValidation,
} from '@/hooks/use-validation';