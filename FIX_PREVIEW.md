# TypeScript Fix Preview for advanced-form-example.tsx

## Changes to be Made

### 1. Import Changes
**BEFORE:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
```

**AFTER:**
```typescript
import { useZodForm } from '@/hooks/use-validation';
// Remove: import { useForm } from 'react-hook-form';
// Remove: import { zodResolver } from '@hookform/resolvers/zod';
```

### 2. Form Hook Initialization 
**BEFORE (Line 106-114):**
```typescript
const form = useForm<LeadFormData>({
  resolver: zodResolver(leadFormSchema),
  mode: 'onChange',
  defaultValues: {
    hasExistingSystem: false,
    needsTraining: false,
    marketingConsent: false,
  },
});
```

**AFTER:**
```typescript
const form = useZodForm(leadFormSchema, {
  hasExistingSystem: false,
  needsTraining: false,
  marketingConsent: false,
});
```

### 3. ValidatedInput onChange Handler Fix
**BEFORE (Lines 263-267, 270-274, etc.):**
```typescript
<ValidatedInput
  {...form.register('firstName')}
  name="firstName"
  label="First Name"
  error={form.getFieldError('firstName')}
  required
/>
```

**AFTER:**
```typescript
<ValidatedInput
  name="firstName"
  label="First Name"
  value={form.watch('firstName') || ''}
  onChange={(value) => form.setValue('firstName', value)}
  onBlur={() => form.trigger('firstName')}
  error={form.getFieldError('firstName')}
  required
/>
```

### 4. ValidatedTextarea onChange Handler Fix
**BEFORE (Lines 401-409, 432-439):**
```typescript
<ValidatedTextarea
  {...form.register('description')}
  name="description"
  label="Project Description"
  error={form.getFieldError('description')}
  required
  placeholder="Please describe your project requirements..."
  rows={4}
/>
```

**AFTER:**
```typescript
<ValidatedTextarea
  name="description"
  label="Project Description"
  value={form.watch('description') || ''}
  onChange={(value) => form.setValue('description', value)}
  onBlur={() => form.trigger('description')}
  error={form.getFieldError('description')}
  required
  placeholder="Please describe your project requirements..."
  rows={4}
/>
```

## Summary of Changes

### ✅ Issues Fixed:
1. **Missing getFieldError method** - useZodForm provides this method
2. **onChange type mismatch** - Custom onChange handlers match ValidatedInput expectations
3. **Form validation integration** - Maintains Zod schema validation
4. **Type safety** - Full TypeScript compatibility

### 📋 Fields to Update:
- firstName (line 263)
- lastName (line 270) 
- email (line 280)
- phone (line 288)
- companyName (line 307)
- jobTitle (line 314)
- industry (line 338)
- description (line 401)
- existingSystemDetails (line 432)

### 🔄 No Changes Needed:
- ValidatedSelect components (already use correct pattern)
- Checkbox inputs (use standard register)
- Form submission logic
- Validation schema
- Auto-save functionality
- Conditional fields logic

## Expected Results
After these changes:
- ✅ All TypeScript errors resolved
- ✅ Form functionality preserved
- ✅ Validation system intact
- ✅ Type safety maintained
- ✅ Performance unchanged