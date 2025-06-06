import type { z } from 'zod';
import type {
  staffSchema,
  opportunitySchema,
  advancedOpportunitySchema,
  leadSchema,
  userSchema,
  loginSchema,
  registerSchema,
  createOpportunityStepOneSchema,
  createOpportunityStepTwoSchema,
  createOpportunityStepThreeSchema,
  advancedOpportunityStepOneSchema,
  advancedOpportunityStepTwoSchema,
  advancedOpportunityStepThreeSchema,
  advancedOpportunityStepFourSchema,
} from '@/lib/validation/schemas';

// Core data types derived from schemas
export type Staff = z.infer<typeof staffSchema>;
export type Opportunity = z.infer<typeof opportunitySchema>;
export type AdvancedOpportunity = z.infer<typeof advancedOpportunitySchema>;
export type Lead = z.infer<typeof leadSchema>;
export type User = z.infer<typeof userSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

// Form step types for multi-step forms
export type OpportunityStepOne = z.infer<typeof createOpportunityStepOneSchema>;
export type OpportunityStepTwo = z.infer<typeof createOpportunityStepTwoSchema>;
export type OpportunityStepThree = z.infer<typeof createOpportunityStepThreeSchema>;

export type AdvancedOpportunityStepOne = z.infer<typeof advancedOpportunityStepOneSchema>;
export type AdvancedOpportunityStepTwo = z.infer<typeof advancedOpportunityStepTwoSchema>;
export type AdvancedOpportunityStepThree = z.infer<typeof advancedOpportunityStepThreeSchema>;
export type AdvancedOpportunityStepFour = z.infer<typeof advancedOpportunityStepFourSchema>;

// Partial types for updates
export type StaffUpdate = Partial<Staff>;
export type OpportunityUpdate = Partial<Opportunity>;
export type AdvancedOpportunityUpdate = Partial<AdvancedOpportunity>;
export type LeadUpdate = Partial<Lead>;
export type UserUpdate = Partial<User>;

// Form validation state types
export interface ValidationState<T> {
  data: T;
  errors: Record<string, string>;
  isValid: boolean;
  isValidating: boolean;
}

// Form field error type
export interface FieldValidationError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'custom' | 'server';
}

// Enum types for dropdowns and selections
export type StaffStatus = 'active' | 'inactive' | 'on-leave';
export type StaffDepartment = 'Engineering' | 'Sales' | 'Marketing' | 'HR' | 'Finance';

export type OpportunityStage = 
  | 'qualification' 
  | 'needs-analysis' 
  | 'proposal' 
  | 'negotiation' 
  | 'closed-won' 
  | 'closed-lost';

export type OpportunitySource = 
  | 'inbound-lead' 
  | 'referral' 
  | 'cold-outreach' 
  | 'marketing-campaign' 
  | 'trade-show' 
  | 'social-media' 
  | 'content-marketing';

export type AdvancedOpportunityStage = 
  | 'qualified' 
  | 'proposal' 
  | 'negotiation' 
  | 'closed-won' 
  | 'closed-lost';

export type AdvancedOpportunitySource = 
  | 'website' 
  | 'referral' 
  | 'cold-call' 
  | 'social-media' 
  | 'event' 
  | 'partner';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Industry = 'technology' | 'healthcare' | 'finance' | 'manufacturing' | 'retail' | 'education';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
export type LeadSource = 'website' | 'referral' | 'cold-call' | 'social-media' | 'event' | 'partner' | 'advertisement';

export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';

// Validation hook return types
export interface UseValidationReturn<T> {
  validate: (data: T) => Promise<boolean>;
  validateField: (field: keyof T, value: any) => Promise<string | undefined>;
  errors: Record<keyof T, string>;
  isValid: boolean;
  isValidating: boolean;
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
}

// Form submission types
export interface FormSubmissionState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error?: string;
}

// Complex nested object types
export interface OpportunityAudience {
  demographics?: string;
  psychographics?: string;
  painPoints: string[];
  budget?: string;
}

export interface OpportunityAIInsights {
  riskFactors: string[];
  recommendations: string[];
  successProbability: number;
  estimatedTimeToClose: string;
}

export interface OpportunityBudget {
  min: number;
  max: number;
  approved: boolean;
}

export interface OpportunityTimeline {
  startDate?: string;
  endDate?: string;
  milestones: string[];
}

// API response types that align with validation
export interface ValidationApiResponse<T> {
  success: boolean;
  data?: T;
  errors?: FieldValidationError[];
  message?: string;
}

// Form configuration types
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | undefined;
  };
}

export interface FormStepConfig {
  title: string;
  description?: string;
  fields: FormFieldConfig[];
}

export interface MultiStepFormConfig {
  steps: FormStepConfig[];
  validationSchemas: z.ZodSchema<any>[];
}

// Export utility types for generic form handling
export type FormData<T extends Record<string, any>> = {
  [K in keyof T]: T[K];
};

export type FormErrors<T extends Record<string, any>> = {
  [K in keyof T]?: string;
};

export type FormTouched<T extends Record<string, any>> = {
  [K in keyof T]?: boolean;
};

// Validation rule types
export interface ValidationRule<T = any> {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | undefined;
  asyncValidator?: (value: T) => Promise<string | undefined>;
}

export type ValidationRules<T extends Record<string, any>> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

// Form event types
export interface FormChangeEvent<T> {
  field: keyof T;
  value: any;
  isValid: boolean;
  error?: string;
}

export interface FormSubmitEvent<T> {
  data: T;
  isValid: boolean;
  errors: FormErrors<T>;
}

// Validation context types for providers
export interface ValidationContextValue {
  schemas: {
    staff: typeof staffSchema;
    opportunity: typeof opportunitySchema;
    advancedOpportunity: typeof advancedOpportunitySchema;
    lead: typeof leadSchema;
    user: typeof userSchema;
    login: typeof loginSchema;
    register: typeof registerSchema;
  };
  validate: <T>(schema: z.ZodSchema<T>, data: unknown) => Promise<{ success: boolean; data?: T; errors?: FieldValidationError[] }>;
  validateField: <T>(schema: z.ZodSchema<T>, field: string, value: unknown) => Promise<string | undefined>;
}