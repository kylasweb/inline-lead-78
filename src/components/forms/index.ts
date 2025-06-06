// Enhanced form components with built-in validation
export { ValidatedInput } from './ValidatedInput';
export type { ValidatedInputProps } from './ValidatedInput';

export { ValidatedSelect } from './ValidatedSelect';
export type { ValidatedSelectProps, SelectOption } from './ValidatedSelect';

export { ValidatedTextarea } from './ValidatedTextarea';
export type { ValidatedTextareaProps } from './ValidatedTextarea';

export { ValidatedDatePicker } from './ValidatedDatePicker';
export type { ValidatedDatePickerProps } from './ValidatedDatePicker';

export { ValidatedNumberInput } from './ValidatedNumberInput';
export type { ValidatedNumberInputProps } from './ValidatedNumberInput';

// Form layout components
export { FormSection } from './FormSection';
export type { FormSectionProps } from './FormSection';

export { MultiStepForm } from './MultiStepForm';
export type { MultiStepFormProps, Step as MultiStepFormStep } from './MultiStepForm';

export { ConditionalField } from './ConditionalField';
export type { ConditionalFieldProps } from './ConditionalField';

// Error handling components
export { ErrorSummary } from './ErrorSummary';
export type { ErrorSummaryProps, FormError } from './ErrorSummary';

// Advanced form components
export { default as AutoSaveIndicator, FloatingAutoSave, AutoSaveStatusBadge } from './AutoSaveIndicator';
export type { AutoSaveIndicatorProps, FloatingAutoSaveProps } from './AutoSaveIndicator';

export { default as FormProgressTracker } from './FormProgressTracker';
export type { FormProgressTrackerProps, FormStep, FormProgressState } from './FormProgressTracker';

export { default as ConditionalFormSection, ConditionalFormBuilder, ConditionalFieldGroup } from './ConditionalFormSection';
export type {
  ConditionalFormSectionProps,
  ConditionalFormBuilderProps,
  ConditionalFieldDefinition,
  ConditionalFieldGroupProps as ConditionalFormFieldGroupProps
} from './ConditionalFormSection';

// Re-export validation utilities for convenience
export {
  useValidation,
  useZodForm,
  useMultiStepValidation,
  useDebouncedValidation,
  useAsyncValidation,
  useValidatedSubmission,
  useConditionalValidation,
} from '@/hooks/use-validation';

// Re-export advanced form hooks
export {
  useConditionalFields,
} from '@/hooks/use-conditional-fields';
export type {
  ConditionalConfig,
  ConditionalRule,
  ConditionalFieldState,
  ConditionalOperator
} from '@/hooks/use-conditional-fields';

export {
  useAutoSave,
  useDraftManager,
} from '@/hooks/use-auto-save';
export type {
  AutoSaveOptions,
  AutoSaveResult,
  AutoSaveStatus,
  DraftOptions,
  DraftResult
} from '@/hooks/use-auto-save';

export {
  useFormPersistence,
  useFormVersions,
} from '@/hooks/use-form-persistence';
export type {
  UseFormPersistenceOptions,
  FormPersistenceResult,
  UseFormVersionsOptions,
  FormVersionsResult,
  FormVersion
} from '@/hooks/use-form-persistence';

export {
  useAccessibility,
  useFormAccessibility,
  useLiveAnnouncements,
  useKeyboardNavigation,
} from '@/hooks/use-accessibility';
export type {
  AccessibilityOptions,
  AccessibilityResult
} from '@/hooks/use-accessibility';

export {
  validateData,
  safeParseData,
  validateField,
  formatValidationErrors,
  getFieldError,
  hasFieldError,
  groupErrorsByField,
} from '@/lib/validation/utils';

// Re-export form utilities
export {
  createFormPersistenceManager,
  migrateFormData,
  getStorageUsage,
} from '@/lib/form-persistence';
export type {
  FormPersistenceOptions,
  FormPersistenceManager,
  PersistedData
} from '@/lib/form-persistence';

export {
  announceToScreenReader,
  createFieldLabels,
  focusManager,
  liveRegionManager,
  prefersReducedMotion,
  isHighContrastMode,
  getContrastRatio,
  isContrastSufficient,
  initializeAccessibility,
  FocusManager,
  LiveRegionManager,
  KeyboardNavigationManager,
} from '@/lib/accessibility-utils';
export type {
  AriaAttributes,
  AriaRole
} from '@/lib/accessibility-utils';

// Re-export common schemas
export {
  staffSchema,
  opportunitySchema,
  advancedOpportunitySchema,
  leadSchema,
  userSchema,
  loginSchema,
  registerSchema,
} from '@/lib/validation/schemas';