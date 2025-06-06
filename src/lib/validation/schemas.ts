import { z } from 'zod';

// Common field validators
export const commonValidators = {
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(
    /^[+]?[1-9][\d]{0,15}$/,
    'Please enter a valid phone number'
  ),
  positiveNumber: z.number().positive('Must be a positive number'),
  percentage: z.number().min(0, 'Must be at least 0').max(100, 'Must be at most 100'),
  currency: z.number().min(0, 'Amount must be positive'),
  nonEmptyString: z.string().min(1, 'This field is required'),
  optionalString: z.string().optional(),
  dateString: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Please enter a valid date (YYYY-MM-DD)'
  ),
  url: z.string().url('Please enter a valid URL').optional(),
};

// Staff validation schema
export const staffSchema = z.object({
  id: z.string().optional(),
  firstName: commonValidators.nonEmptyString.min(2, 'First name must be at least 2 characters'),
  lastName: commonValidators.nonEmptyString.min(2, 'Last name must be at least 2 characters'),
  email: commonValidators.email,
  phone: commonValidators.phone,
  department: z.enum(['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'], {
    errorMap: () => ({ message: 'Please select a valid department' })
  }),
  position: commonValidators.nonEmptyString.min(2, 'Position must be at least 2 characters'),
  hireDate: commonValidators.dateString,
  status: z.enum(['active', 'inactive', 'on-leave'], {
    errorMap: () => ({ message: 'Please select a valid status' })
  }),
  performance: commonValidators.percentage,
  trainingsCompleted: z.number().min(0, 'Training count cannot be negative').int('Must be a whole number'),
  location: commonValidators.nonEmptyString.min(2, 'Location must be at least 2 characters'),
});

// Basic opportunity validation schema (for AddOpportunityForm)
export const opportunitySchema = z.object({
  id: z.number().optional(),
  name: commonValidators.nonEmptyString.min(3, 'Opportunity name must be at least 3 characters'),
  description: commonValidators.optionalString,
  value: commonValidators.currency,
  stage: z.enum(['qualification', 'needs-analysis', 'proposal', 'negotiation', 'closed-won', 'closed-lost'], {
    errorMap: () => ({ message: 'Please select a valid stage' })
  }),
  probability: commonValidators.percentage,
  expectedCloseDate: commonValidators.dateString.optional(),
  leadId: z.number().optional(),
  assignedTo: commonValidators.nonEmptyString,
  source: z.enum([
    'inbound-lead', 'referral', 'cold-outreach', 'marketing-campaign', 
    'trade-show', 'social-media', 'content-marketing'
  ]).optional(),
  competitorAnalysis: commonValidators.optionalString,
  nextSteps: commonValidators.optionalString,
  // AI Insights (optional nested object)
  aiInsights: z.object({
    riskFactors: z.array(z.string()),
    recommendations: z.array(z.string()),
    successProbability: commonValidators.percentage,
    estimatedTimeToClose: z.string(),
  }).optional(),
  // Audience data (optional nested object)
  audience: z.object({
    demographics: z.string().optional(),
    psychographics: z.string().optional(),
    painPoints: z.array(z.string()).default([]),
    budget: z.string().optional(),
  }).optional(),
  potentialPatterns: z.array(z.string()).default([]),
  behavioralIndicators: z.array(z.string()).default([]),
});

// Advanced opportunity validation schema (for AddOpportunityFormAdvanced)
export const advancedOpportunitySchema = z.object({
  id: z.number().optional(),
  title: commonValidators.nonEmptyString.min(3, 'Title must be at least 3 characters'),
  company: commonValidators.nonEmptyString.min(2, 'Company name must be at least 2 characters'),
  contact: commonValidators.nonEmptyString.min(2, 'Contact name must be at least 2 characters'),
  contactEmail: commonValidators.email.optional().or(z.literal('')),
  contactPhone: commonValidators.phone.optional().or(z.literal('')),
  value: commonValidators.currency.optional(),
  stage: z.enum(['qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'], {
    errorMap: () => ({ message: 'Please select a valid stage' })
  }),
  probability: commonValidators.percentage,
  expectedCloseDate: commonValidators.dateString.optional(),
  lastActivity: commonValidators.dateString.optional(),
  description: commonValidators.optionalString,
  source: z.enum(['website', 'referral', 'cold-call', 'social-media', 'event', 'partner']).optional(),
  industry: z.enum(['technology', 'healthcare', 'finance', 'manufacturing', 'retail', 'education']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Please select a valid priority' })
  }),
  tags: z.array(z.string()).default([]),
  notes: commonValidators.optionalString,
  competitorAnalysis: commonValidators.optionalString,
  // Budget nested object with validation
  budget: z.object({
    min: commonValidators.currency,
    max: commonValidators.currency,
    approved: z.boolean(),
  }).refine(data => data.max >= data.min, {
    message: 'Maximum budget must be greater than or equal to minimum budget',
    path: ['max'],
  }),
  // Timeline nested object with validation
  timeline: z.object({
    startDate: commonValidators.dateString.optional(),
    endDate: commonValidators.dateString.optional(),
    milestones: z.array(z.string()).default([]),
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  }, {
    message: 'End date must be after start date',
    path: ['endDate'],
  }),
});

// Lead validation schema (for potential future use)
export const leadSchema = z.object({
  id: z.number().optional(),
  name: commonValidators.nonEmptyString.min(2, 'Name must be at least 2 characters'),
  company: commonValidators.nonEmptyString.min(2, 'Company name must be at least 2 characters'),
  email: commonValidators.email,
  phone: commonValidators.phone.optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted'], {
    errorMap: () => ({ message: 'Please select a valid status' })
  }).optional(),
  source: z.enum([
    'website', 'referral', 'cold-call', 'social-media', 'event', 'partner', 'advertisement'
  ]).optional(),
  notes: commonValidators.optionalString,
  createdAt: commonValidators.dateString.optional(),
  lastContactDate: commonValidators.dateString.optional(),
});

// Enhanced User validation schema (for AddUserForm)
export const userSchema = z.object({
  id: z.number().optional(),
  name: commonValidators.nonEmptyString.min(2, 'Name must be at least 2 characters'),
  email: commonValidators.email,
  phone: commonValidators.phone.optional(),
  department: z.enum(['sales', 'marketing', 'support', 'development', 'hr', 'finance'], {
    errorMap: () => ({ message: 'Please select a valid department' })
  }),
  position: commonValidators.optionalString,
  role: z.enum(['admin', 'manager', 'user', 'viewer'], {
    errorMap: () => ({ message: 'Please select a valid role' })
  }),
  status: z.enum(['active', 'inactive', 'pending']).default('pending'),
  permissions: z.array(z.string()).default(['read']),
  bio: commonValidators.optionalString,
  avatar: commonValidators.optionalString,
  leadSource: z.number().optional(),
  onboardingCompleted: z.boolean().default(false),
  skills: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  emergencyContact: z.object({
    name: commonValidators.nonEmptyString.min(1, 'Emergency contact name is required'),
    phone: commonValidators.phone,
    relationship: commonValidators.nonEmptyString.min(1, 'Relationship is required'),
  }).optional(),
  // Form-specific settings
  sendWelcomeEmail: z.boolean().default(true),
  requirePasswordChange: z.boolean().default(true),
});

// Multi-step user creation schemas
export const createUserStepOneSchema = userSchema.pick({
  name: true,
  email: true,
  phone: true,
  department: true,
  position: true,
  role: true,
  leadSource: true,
});

export const createUserStepTwoSchema = userSchema.pick({
  permissions: true,
  bio: true,
  emergencyContact: true,
});

export const createUserStepThreeSchema = userSchema.pick({
  skills: true,
  certifications: true,
  sendWelcomeEmail: true,
  requirePasswordChange: true,
});

// Authentication schemas
export const loginSchema = z.object({
  email: commonValidators.email,
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  firstName: commonValidators.nonEmptyString.min(2, 'First name must be at least 2 characters'),
  lastName: commonValidators.nonEmptyString.min(2, 'Last name must be at least 2 characters'),
  email: commonValidators.email,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Conditional validation schemas for complex forms
export const createOpportunityStepOneSchema = opportunitySchema.pick({
  name: true,
  description: true,
  value: true,
  stage: true,
  assignedTo: true,
  source: true,
});

export const createOpportunityStepTwoSchema = opportunitySchema.pick({
  audience: true,
  potentialPatterns: true,
  behavioralIndicators: true,
});

export const createOpportunityStepThreeSchema = opportunitySchema.pick({
  expectedCloseDate: true,
  probability: true,
  leadId: true,
  nextSteps: true,
  competitorAnalysis: true,
});

// Advanced opportunity step schemas
export const advancedOpportunityStepOneSchema = advancedOpportunitySchema.pick({
  title: true,
  company: true,
  contact: true,
  contactEmail: true,
  contactPhone: true,
  value: true,
  description: true,
});

export const advancedOpportunityStepTwoSchema = advancedOpportunitySchema.pick({
  stage: true,
  priority: true,
  source: true,
  industry: true,
  expectedCloseDate: true,
  probability: true,
});

export const advancedOpportunityStepThreeSchema = advancedOpportunitySchema.pick({
  budget: true,
  timeline: true,
});

export const advancedOpportunityStepFourSchema = advancedOpportunitySchema.pick({
  notes: true,
  competitorAnalysis: true,
  tags: true,
});

// Export all schema types for TypeScript inference
export type StaffFormData = z.infer<typeof staffSchema>;
export type OpportunityFormData = z.infer<typeof opportunitySchema>;
export type AdvancedOpportunityFormData = z.infer<typeof advancedOpportunitySchema>;
export type LeadFormData = z.infer<typeof leadSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;