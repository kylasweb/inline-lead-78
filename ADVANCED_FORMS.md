# Advanced Form System Documentation

This documentation covers the comprehensive form system built for the inline-lead application, featuring validation, auto-save, accessibility, conditional fields, and more.

## 🚀 **VS Code Extensions for Enhanced Development**

To maximize productivity when working with this form system, install these essential VS Code extensions:

1. **[ES7+ React/Redux/React-Native snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)** - React component snippets:
   ```bash
   ext install dsznajder.es7-react-js-snippets
   ```

2. **[Auto Rename Tag](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag)** - Automatically rename paired HTML/JSX tags:
   ```bash
   ext install formulahendry.auto-rename-tag
   ```

3. **[TypeScript Importer](https://marketplace.visualstudio.com/items?itemName=pmneo.tsimporter)** - Auto import TypeScript modules:
   ```bash
   ext install pmneo.tsimporter
   ```

4. **[Bracket Pair Colorizer 2](https://marketplace.visualstudio.com/items?itemName=CoenraadS.bracket-pair-colorizer-2)** - Colorize matching brackets:
   ```bash
   ext install CoenraadS.bracket-pair-colorizer-2
   ```

5. **[Error Lens](https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens)** - Highlight errors inline:
   ```bash
   ext install usernamehw.errorlens
   ```

**⚙️ VS Code Settings for Optimal Experience:**
```json
{
  "typescript.preferences.completeFunctionCalls": true,
  "typescript.suggest.autoImports": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## Overview

The advanced form system provides:

- ✅ **Validation** - Zod schema validation with real-time feedback
- 💾 **Auto-save** - Automatic draft saving with customizable intervals
- 🔄 **Form Persistence** - Save/restore form data across sessions
- ♿ **Accessibility** - WCAG compliant with screen reader support
- 🔀 **Conditional Fields** - Show/hide fields based on form values
- 📊 **Progress Tracking** - Visual progress indicators for multi-step forms
- 🎯 **Error Management** - Comprehensive error handling and display
- 📱 **Responsive Design** - Mobile-first responsive components

## Architecture

```
src/
├── components/forms/           # Form components
│   ├── ValidatedInput.tsx     # Input with validation
│   ├── ValidatedSelect.tsx    # Select with validation
│   ├── ValidatedTextarea.tsx  # Textarea with validation
│   ├── ValidatedNumberInput.tsx # Number input with validation
│   ├── ValidatedDatePicker.tsx # Date picker with validation
│   ├── FormSection.tsx        # Form section wrapper
│   ├── MultiStepForm.tsx      # Multi-step form container
│   ├── ConditionalField.tsx   # Conditional field wrapper
│   ├── ErrorSummary.tsx       # Error summary component
│   ├── AutoSaveIndicator.tsx  # Auto-save status indicator
│   ├── FormProgressTracker.tsx # Progress tracking component
│   └── index.ts              # Exports
├── hooks/                     # Form-related hooks
│   ├── use-validation.ts      # Validation utilities
│   ├── use-conditional-fields.ts # Conditional field logic
│   ├── use-auto-save.ts       # Auto-save functionality
│   ├── use-form-persistence.ts # Form persistence
│   └── use-accessibility.ts   # Accessibility features
├── lib/                       # Utilities
│   ├── validation/            # Validation schemas & utils
│   ├── form-persistence.ts    # Persistence utilities
│   └── accessibility-utils.ts # Accessibility utilities
└── types/                     # TypeScript definitions
    └── validation.ts          # Validation types
```

## Core Components

### ValidatedInput

Basic input component with integrated validation and accessibility features.

```tsx
import { ValidatedInput } from '@/components/forms';

<ValidatedInput
  name="email"
  label="Email Address"
  type="email"
  required
  placeholder="Enter your email"
  description="We'll never share your email"
/>
```

**Features:**
- Real-time validation feedback
- Accessibility attributes (aria-label, aria-describedby)
- Error state styling
- Support for all HTML input types

### ValidatedSelect

Select component with validation and accessibility support.

```tsx
import { ValidatedSelect } from '@/components/forms';

<ValidatedSelect
  name="country"
  label="Country"
  required
  options={[
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
  ]}
  placeholder="Select a country"
/>
```

### FormSection

Semantic section wrapper with proper heading hierarchy.

```tsx
import { FormSection } from '@/components/forms';

<FormSection
  title="Personal Information"
  description="Please provide your contact details"
>
  {/* Form fields */}
</FormSection>
```

### ConditionalField

Show/hide fields based on conditions with smooth animations.

```tsx
import { ConditionalField } from '@/components/forms';
import { useWatch } from 'react-hook-form';

const hasAccount = useWatch({ name: 'hasAccount' });

<ConditionalField
  condition={hasAccount}
  animationType="slide"
  duration={300}
>
  <ValidatedInput
    name="accountNumber"
    label="Account Number"
  />
</ConditionalField>
```

## Advanced Hooks

### useAutoSave

Automatically save form data with customizable intervals and error handling.

```tsx
import { useAutoSave } from '@/hooks/use-auto-save';

const autoSave = useAutoSave({
  form,
  saveInterval: 30000, // Save every 30 seconds
  debounceDelay: 2000, // Debounce user input
  onSave: async (data) => {
    await api.saveDraft(data);
  },
  onError: (error) => {
    toast.error(`Auto-save failed: ${error.message}`);
  },
});

// Status: 'idle' | 'saving' | 'saved' | 'error'
console.log(autoSave.status);
```

### useFormPersistence

Persist form data to localStorage/sessionStorage with encryption support.

```tsx
import { useFormPersistence } from '@/hooks/use-form-persistence';

const persistence = useFormPersistence({
  form,
  key: 'contact-form',
  storage: 'localStorage',
  autoSave: true,
  autoLoad: true,
  encrypt: true, // Optional encryption
  onLoad: (data) => {
    toast.success('Previous form data restored');
  },
});

// Manual operations
await persistence.saveNow();
await persistence.loadNow();
await persistence.clearPersisted();
```

### useConditionalFields

Manage complex conditional field logic with validation rules.

```tsx
import { useConditionalFields } from '@/hooks/use-conditional-fields';

const conditionalFields = useConditionalFields({
  control,
  fields: {
    companyDetails: {
      rules: [
        { field: 'accountType', operator: 'eq', value: 'business' }
      ],
    },
    vatNumber: {
      rules: [
        { field: 'accountType', operator: 'eq', value: 'business' },
        { field: 'country', operator: 'in', values: ['DE', 'FR', 'IT'] }
      ],
      operator: 'and', // All rules must match
    },
  },
});

const isCompanyVisible = conditionalFields.isFieldVisible('companyDetails');
const isVatRequired = conditionalFields.isFieldRequired('vatNumber');
```

### useAccessibility

Comprehensive accessibility features for forms.

```tsx
import { useAccessibility } from '@/hooks/use-accessibility';

const accessibility = useAccessibility({
  form,
  announceErrors: true,
  announceSuccess: true,
  focusFirstError: true,
  keyboardNavigation: true,
});

// Get proper field attributes
const fieldProps = accessibility.getFieldProps('email', {
  label: 'Email Address',
  description: 'Enter a valid email',
  required: true,
  error: errors.email?.message,
});

// Manual announcements
accessibility.announceError('Form validation failed');
accessibility.announceSuccess('Form submitted successfully');
```

## Advanced Components

### AutoSaveIndicator

Visual indicator for auto-save status with multiple display modes.

```tsx
import { AutoSaveIndicator, FloatingAutoSave } from '@/components/forms';

// Inline indicator
<AutoSaveIndicator
  status={autoSave.status}
  lastSaved={autoSave.lastSaved}
  error={autoSave.error}
  showTimestamp={true}
/>

// Floating indicator
<FloatingAutoSave
  status={autoSave.status}
  position="bottom-right"
  hideDelay={3000}
/>
```

### FormProgressTracker

Track and visualize form completion progress.

```tsx
import { FormProgressTracker } from '@/components/forms';

const steps = [
  {
    id: 'personal',
    title: 'Personal Info',
    fields: ['firstName', 'lastName', 'email'],
  },
  {
    id: 'company',
    title: 'Company Details',
    fields: ['companyName', 'jobTitle'],
    optional: true,
  },
];

<FormProgressTracker
  steps={steps}
  currentStep={currentStep}
  errors={errors}
  values={watch()}
  onStepClick={setCurrentStep}
  allowStepNavigation={true}
  variant="horizontal" // 'horizontal' | 'vertical' | 'compact'
/>
```

## Usage Examples

### Basic Contact Form

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ValidatedInput,
  ValidatedTextarea,
  FormSection,
  useAutoSave,
  useAccessibility,
} from '@/components/forms';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  message: z.string().min(10, 'Message too short'),
});

function ContactForm() {
  const form = useForm({
    resolver: zodResolver(contactSchema),
    mode: 'onChange',
  });

  const autoSave = useAutoSave({
    form,
    onSave: async (data) => api.saveDraft(data),
  });

  const accessibility = useAccessibility({ form });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection title="Contact Information">
        <ValidatedInput name="name" label="Full Name" required />
        <ValidatedInput name="email" label="Email" type="email" required />
        <ValidatedTextarea name="message" label="Message" required rows={4} />
      </FormSection>
      
      <AutoSaveIndicator
        status={autoSave.status}
        lastSaved={autoSave.lastSaved}
      />
      
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### Multi-Step Form with Conditional Fields

```tsx
import {
  MultiStepForm,
  FormProgressTracker,
  ConditionalField,
  useConditionalFields,
} from '@/components/forms';

function AdvancedForm() {
  const form = useForm({ resolver: zodResolver(schema) });
  const [currentStep, setCurrentStep] = useState(0);

  const conditionalFields = useConditionalFields({
    control: form.control,
    fields: {
      businessDetails: {
        rules: [{ field: 'customerType', operator: 'eq', value: 'business' }],
      },
    },
  });

  const steps = [
    // Step definitions...
  ];

  return (
    <div>
      <FormProgressTracker
        steps={steps}
        currentStep={currentStep}
        errors={form.formState.errors}
        values={form.watch()}
      />
      
      <MultiStepForm
        currentStep={currentStep}
        onStepChange={setCurrentStep}
      >
        <MultiStepForm.Step>
          <ValidatedSelect
            name="customerType"
            label="Customer Type"
            options={[
              { value: 'individual', label: 'Individual' },
              { value: 'business', label: 'Business' },
            ]}
          />
          
          <ConditionalField
            condition={conditionalFields.isFieldVisible('businessDetails')}
          >
            <ValidatedInput
              name="companyName"
              label="Company Name"
              required={conditionalFields.isFieldRequired('businessDetails')}
            />
          </ConditionalField>
        </MultiStepForm.Step>
        
        {/* More steps... */}
      </MultiStepForm>
    </div>
  );
}
```

## Best Practices

### 1. Schema Design

Use Zod for comprehensive validation:

```tsx
const userSchema = z.object({
  email: z.string().email('Invalid email format'),
  age: z.number().min(18, 'Must be 18 or older'),
  preferences: z.object({
    newsletter: z.boolean().default(false),
    notifications: z.enum(['none', 'email', 'sms']),
  }),
});
```

### 2. Error Handling

Implement comprehensive error boundaries:

```tsx
import { ErrorSummary } from '@/components/forms';

<ErrorSummary
  errors={Object.values(errors)}
  title="Please fix the following errors:"
  showCount={true}
  onErrorClick={(fieldName) => {
    // Focus the field with error
    form.setFocus(fieldName);
  }}
/>
```

### 3. Accessibility

Always provide proper labels and descriptions:

```tsx
<ValidatedInput
  name="password"
  label="Password"
  type="password"
  description="Must be at least 8 characters with numbers and symbols"
  required
  aria-describedby="password-requirements"
/>
```

### 4. Performance

Use debounced validation for better UX:

```tsx
import { useDebouncedValidation } from '@/hooks/use-validation';

const debouncedValidation = useDebouncedValidation({
  form,
  delay: 500, // Wait 500ms after user stops typing
  fields: ['email', 'username'], // Only for specific fields
});
```

## Testing

### Unit Testing Components

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ValidatedInput } from '@/components/forms';

test('validates email input', async () => {
  const onSubmit = jest.fn();
  
  render(
    <form onSubmit={onSubmit}>
      <ValidatedInput
        name="email"
        label="Email"
        type="email"
        required
      />
      <button type="submit">Submit</button>
    </form>
  );
  
  const input = screen.getByLabelText('Email');
  fireEvent.change(input, { target: { value: 'invalid-email' } });
  
  expect(screen.getByText('Invalid email')).toBeInTheDocument();
});
```

### Integration Testing

```tsx
test('auto-save functionality', async () => {
  const mockSave = jest.fn();
  
  render(<FormWithAutoSave onSave={mockSave} />);
  
  // Type in form
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'John Doe' }
  });
  
  // Wait for debounced save
  await waitFor(() => {
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'John Doe' })
    );
  }, { timeout: 3000 });
});
```

## API Reference

### Component Props

#### ValidatedInput
```tsx
interface ValidatedInputProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  required?: boolean;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}
```

#### ConditionalField
```tsx
interface ConditionalFieldProps {
  condition: boolean;
  children: React.ReactNode;
  animationType?: 'none' | 'fade' | 'slide' | 'scale';
  duration?: number;
  onShow?: () => void;
  onHide?: () => void;
}
```

### Hook Options

#### useAutoSave
```tsx
interface AutoSaveOptions {
  form: UseFormReturn;
  saveInterval?: number; // milliseconds
  debounceDelay?: number; // milliseconds
  onSave: (data: any) => Promise<void>;
  onError?: (error: Error) => void;
  enabled?: boolean;
  excludeFields?: string[];
}
```

## Migration Guide

### From v1 to v2

1. **Update imports**: The form components now use a unified import structure
2. **Validation**: Replace manual validation with Zod schemas
3. **Accessibility**: Update form fields to use new accessibility props
4. **Auto-save**: Replace manual save logic with `useAutoSave` hook

### Breaking Changes

- `FormField` renamed to `ValidatedInput`
- `control` prop is now managed internally
- Error handling moved to hook-based system

## Troubleshooting

### Common Issues

1. **TypeScript errors with form types**
   ```tsx
   // Fix: Explicitly type your form data
   type FormData = z.infer<typeof schema>;
   const form = useForm<FormData>({ ... });
   ```

2. **Auto-save not triggering**
   ```tsx
   // Fix: Ensure form is properly configured
   const form = useForm({ mode: 'onChange' }); // Enable change detection
   ```

3. **Conditional fields not updating**
   ```tsx
   // Fix: Use watch() to trigger re-renders
   const watchedValue = watch('triggerField');
   ```

## Contributing

1. Follow the established patterns for component creation
2. Add comprehensive TypeScript types
3. Include accessibility features by default
4. Write unit and integration tests
5. Update documentation for new features

For questions or issues, refer to the project's GitHub repository or contact the development team.