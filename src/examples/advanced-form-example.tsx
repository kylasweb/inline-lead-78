import React from 'react';
import { z } from 'zod';
import {
  ValidatedInput,
  ValidatedSelect,
  ValidatedTextarea,
  MultiStepForm,
  FormSection,
  AutoSaveIndicator,
  FormProgressTracker,
  ConditionalField,
  useAutoSave,
  useFormPersistence,
  useConditionalFields,
  useFormAccessibility,
  type FormStep,
} from '@/components/forms';
import { useZodForm } from '@/hooks/use-validation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

// Example schema for a comprehensive lead form
const leadFormSchema = z.object({
  // Basic Information
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  
  // Company Information
  companyName: z.string().min(1, 'Company name is required'),
  jobTitle: z.string().optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+'], {
    required_error: 'Please select company size'
  }),
  industry: z.string().min(1, 'Industry is required'),
  
  // Project Details
  projectType: z.enum(['new-project', 'existing-optimization', 'consultation'], {
    required_error: 'Please select project type'
  }),
  budget: z.enum(['under-10k', '10k-50k', '50k-100k', '100k+'], {
    required_error: 'Please select budget range'
  }),
  timeline: z.enum(['asap', '1-3-months', '3-6-months', '6-12-months', 'planning-phase'], {
    required_error: 'Please select timeline'
  }),
  description: z.string().min(10, 'Please provide at least 10 characters'),
  
  // Conditional fields
  hasExistingSystem: z.boolean().default(false),
  existingSystemDetails: z.string().optional(),
  needsTraining: z.boolean().default(false),
  trainingType: z.enum(['basic', 'advanced', 'custom']).optional(),
  
  // Marketing
  hearAboutUs: z.enum(['search', 'social', 'referral', 'event', 'other']).optional(),
  marketingConsent: z.boolean().default(false),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

// Define form steps for progress tracking
const formSteps: FormStep[] = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Basic contact details',
    fields: ['firstName', 'lastName', 'email', 'phone'],
  },
  {
    id: 'company',
    title: 'Company Details',
    description: 'Information about your organization',
    fields: ['companyName', 'jobTitle', 'companySize', 'industry'],
  },
  {
    id: 'project',
    title: 'Project Information',
    description: 'Details about your project needs',
    fields: ['projectType', 'budget', 'timeline', 'description'],
  },
  {
    id: 'additional',
    title: 'Additional Options',
    description: 'Optional preferences and requirements',
    fields: ['hasExistingSystem', 'existingSystemDetails', 'needsTraining', 'trainingType'],
    optional: true,
  },
  {
    id: 'marketing',
    title: 'How did you hear about us?',
    description: 'Help us improve our outreach',
    fields: ['hearAboutUs', 'marketingConsent'],
    optional: true,
  },
];

export function AdvancedFormExample() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize form with validation
  const form = useZodForm(leadFormSchema, {
    hasExistingSystem: false,
    needsTraining: false,
    marketingConsent: false,
  });

  const { control, watch, handleSubmit, formState: { errors } } = form;

  // Auto-save functionality
  const autoSave = useAutoSave({
    form,
    saveInterval: 30000, // Save every 30 seconds
    debounceDelay: 2000, // Debounce user input by 2 seconds
    onSave: async (data) => {
      // Simulate API call to save draft
      console.log('Auto-saving form data:', data);
      // In real app, send to your API
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onError: (error) => {
      toast.error(`Auto-save failed: ${error.message}`);
    },
  });

  // Form persistence (local storage)
  const persistence = useFormPersistence({
    form,
    key: 'lead-form',
    autoSave: true,
    autoLoad: true,
    onLoad: (data) => {
      toast.success('Previous form data restored');
    },
  });

  // Conditional fields logic
  const conditionalFields = useConditionalFields({
    control,
    fields: {
      existingSystemDetails: {
        rules: [
          { field: 'hasExistingSystem', operator: 'eq', value: true }
        ],
      },
      trainingType: {
        rules: [
          { field: 'needsTraining', operator: 'eq', value: true }
        ],
      },
    },
  });

  // Accessibility features
  const accessibility = useFormAccessibility(form, {
    announceErrors: true,
    announceSuccess: true,
    focusFirstError: true,
  });

  // Watch conditional field values
  const hasExistingSystem = watch('hasExistingSystem');
  const needsTraining = watch('needsTraining');

  // Handle form submission
  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API submission
      console.log('Submitting form:', data);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear persisted data on successful submission
      await persistence.clearPersisted();
      
      toast.success('Lead submitted successfully!');
      accessibility.announceSuccess('Form submitted successfully');
      
      // Reset form or redirect
      form.reset();
      setCurrentStep(0);
      
    } catch (error) {
      toast.error('Failed to submit form');
      accessibility.announceError('Form submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    const currentStepFields = formSteps[currentStep].fields;
    return currentStepFields.every(field => {
      const value = watch(field as keyof LeadFormData);
      const error = errors[field as keyof LeadFormData];
      return value !== undefined && value !== '' && !error;
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Advanced Lead Capture Form</CardTitle>
              <CardDescription>
                Comprehensive form with auto-save, conditional fields, and accessibility features
              </CardDescription>
            </div>
            <AutoSaveIndicator
              status={autoSave.status}
              lastSaved={autoSave.lastSaved}
              error={autoSave.error}
              compact
            />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Tracker */}
          <FormProgressTracker
            steps={formSteps}
            currentStep={currentStep}
            errors={errors}
            values={watch()}
            onStepClick={setCurrentStep}
            allowStepNavigation={true}
            variant="horizontal"
          />

          {/* Form Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Step 1: Personal Information */}
            {currentStep === 0 && (
              <FormSection
                title="Personal Information"
                description="Please provide your contact details"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ValidatedInput
                    name="firstName"
                    label="First Name"
                    value={form.watch('firstName') || ''}
                    onChange={(value) => form.setValue('firstName', value)}
                    onBlur={() => form.trigger('firstName')}
                    error={form.getFieldError('firstName')}
                    required
                  />
                  <ValidatedInput
                    name="lastName"
                    label="Last Name"
                    value={form.watch('lastName') || ''}
                    onChange={(value) => form.setValue('lastName', value)}
                    onBlur={() => form.trigger('lastName')}
                    error={form.getFieldError('lastName')}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ValidatedInput
                    name="email"
                    label="Email Address"
                    type="email"
                    value={form.watch('email') || ''}
                    onChange={(value) => form.setValue('email', value)}
                    onBlur={() => form.trigger('email')}
                    error={form.getFieldError('email')}
                    required
                  />
                  <ValidatedInput
                    name="phone"
                    label="Phone Number"
                    type="tel"
                    value={form.watch('phone') || ''}
                    onChange={(value) => form.setValue('phone', value)}
                    onBlur={() => form.trigger('phone')}
                    error={form.getFieldError('phone')}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </FormSection>
            )}

            {/* Step 2: Company Information */}
            {currentStep === 1 && (
              <FormSection
                title="Company Details"
                description="Tell us about your organization"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ValidatedInput
                    name="companyName"
                    label="Company Name"
                    value={form.watch('companyName') || ''}
                    onChange={(value) => form.setValue('companyName', value)}
                    onBlur={() => form.trigger('companyName')}
                    error={form.getFieldError('companyName')}
                    required
                  />
                  <ValidatedInput
                    name="jobTitle"
                    label="Job Title"
                    value={form.watch('jobTitle') || ''}
                    onChange={(value) => form.setValue('jobTitle', value)}
                    onBlur={() => form.trigger('jobTitle')}
                    error={form.getFieldError('jobTitle')}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ValidatedSelect
                    name="companySize"
                    label="Company Size"
                    value={watch('companySize')}
                    onChange={(value) => form.setValue('companySize', value as any)}
                    error={form.getFieldError('companySize')}
                    required
                    options={[
                      { value: '1-10', label: '1-10 employees' },
                      { value: '11-50', label: '11-50 employees' },
                      { value: '51-200', label: '51-200 employees' },
                      { value: '201-1000', label: '201-1000 employees' },
                      { value: '1000+', label: '1000+ employees' },
                    ]}
                  />
                  <ValidatedInput
                    name="industry"
                    label="Industry"
                    value={form.watch('industry') || ''}
                    onChange={(value) => form.setValue('industry', value)}
                    onBlur={() => form.trigger('industry')}
                    error={form.getFieldError('industry')}
                    required
                  />
                </div>
              </FormSection>
            )}

            {/* Step 3: Project Information */}
            {currentStep === 2 && (
              <FormSection
                title="Project Information"
                description="Details about your project requirements"
              >
                <ValidatedSelect
                  name="projectType"
                  label="Project Type"
                  value={watch('projectType')}
                  onChange={(value) => form.setValue('projectType', value as any)}
                  error={form.getFieldError('projectType')}
                  required
                  options={[
                    { value: 'new-project', label: 'New Project Development' },
                    { value: 'existing-optimization', label: 'Existing System Optimization' },
                    { value: 'consultation', label: 'Consultation Only' },
                  ]}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ValidatedSelect
                    name="budget"
                    label="Budget Range"
                    value={watch('budget')}
                    onChange={(value) => form.setValue('budget', value as any)}
                    error={form.getFieldError('budget')}
                    required
                    options={[
                      { value: 'under-10k', label: 'Under $10,000' },
                      { value: '10k-50k', label: '$10,000 - $50,000' },
                      { value: '50k-100k', label: '$50,000 - $100,000' },
                      { value: '100k+', label: '$100,000+' },
                    ]}
                  />
                  <ValidatedSelect
                    name="timeline"
                    label="Timeline"
                    value={watch('timeline')}
                    onChange={(value) => form.setValue('timeline', value as any)}
                    error={form.getFieldError('timeline')}
                    required
                    options={[
                      { value: 'asap', label: 'ASAP' },
                      { value: '1-3-months', label: '1-3 months' },
                      { value: '3-6-months', label: '3-6 months' },
                      { value: '6-12-months', label: '6-12 months' },
                      { value: 'planning-phase', label: 'Still planning' },
                    ]}
                  />
                </div>
                
                <ValidatedTextarea
                  name="description"
                  label="Project Description"
                  value={form.watch('description') || ''}
                  onChange={(value) => form.setValue('description', value)}
                  onBlur={() => form.trigger('description')}
                  error={form.getFieldError('description')}
                  required
                  placeholder="Please describe your project requirements, goals, and any specific features you need..."
                  rows={4}
                />
              </FormSection>
            )}

            {/* Step 4: Additional Options (Conditional) */}
            {currentStep === 3 && (
              <FormSection
                title="Additional Options"
                description="Optional preferences and requirements"
              >
                <div className="space-y-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...form.register('hasExistingSystem')}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium">
                      I have an existing system that needs integration
                    </span>
                  </label>

                  <ConditionalField condition={hasExistingSystem}>
                    <ValidatedTextarea
                      name="existingSystemDetails"
                      label="Existing System Details"
                      value={form.watch('existingSystemDetails') || ''}
                      onChange={(value) => form.setValue('existingSystemDetails', value)}
                      onBlur={() => form.trigger('existingSystemDetails')}
                      error={form.getFieldError('existingSystemDetails')}
                      placeholder="Please describe your existing system, technologies used, and integration requirements..."
                      rows={3}
                    />
                  </ConditionalField>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...form.register('needsTraining')}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium">
                      I need training for my team
                    </span>
                  </label>

                  <ConditionalField condition={needsTraining}>
                    <ValidatedSelect
                      name="trainingType"
                      label="Training Type"
                      value={watch('trainingType')}
                      onChange={(value) => form.setValue('trainingType', value as any)}
                      error={form.getFieldError('trainingType')}
                      options={[
                        { value: 'basic', label: 'Basic Usage Training' },
                        { value: 'advanced', label: 'Advanced Features Training' },
                        { value: 'custom', label: 'Custom Training Program' },
                      ]}
                    />
                  </ConditionalField>
                </div>
              </FormSection>
            )}

            {/* Step 5: Marketing */}
            {currentStep === 4 && (
              <FormSection
                title="How did you hear about us?"
                description="Help us improve our outreach (optional)"
              >
                <ValidatedSelect
                  name="hearAboutUs"
                  label="How did you hear about us?"
                  value={watch('hearAboutUs')}
                  onChange={(value) => form.setValue('hearAboutUs', value as any)}
                  error={form.getFieldError('hearAboutUs')}
                  options={[
                    { value: 'search', label: 'Search Engine' },
                    { value: 'social', label: 'Social Media' },
                    { value: 'referral', label: 'Referral' },
                    { value: 'event', label: 'Event/Conference' },
                    { value: 'other', label: 'Other' },
                  ]}
                />

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...form.register('marketingConsent')}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600">
                    I consent to receiving marketing communications about relevant services and updates
                  </span>
                </label>
              </FormSection>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                Previous
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => autoSave.saveNow()}
                  disabled={autoSave.status === 'saving'}
                >
                  Save Draft
                </Button>

                {currentStep < formSteps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceed()}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting || !canProceed()}
                    className="min-w-32"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Lead'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Form State Debug Panel (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <h4 className="font-medium mb-2">Form State</h4>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify({
                    currentStep,
                    isValid: form.formState.isValid,
                    isDirty: form.formState.isDirty,
                    isSubmitting,
                  }, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Auto-save Status</h4>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify({
                    status: autoSave.status,
                    lastSaved: autoSave.lastSaved?.toLocaleTimeString(),
                    hasPersistedData: persistence.hasPersistedData,
                  }, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Conditional Fields</h4>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify({
                    hasExistingSystem,
                    needsTraining,
                    existingSystemVisible: conditionalFields.isFieldVisible('existingSystemDetails'),
                    trainingTypeVisible: conditionalFields.isFieldVisible('trainingType'),
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdvancedFormExample;