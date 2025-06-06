import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWatch, type Control, type FieldValues, type Path } from 'react-hook-form';

export type ConditionalOperator = 'eq' | 'neq' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startswith' | 'endswith' | 'regex' | 'truthy' | 'falsy';

export interface ConditionalRule<T extends FieldValues = FieldValues> {
  field: Path<T>;
  operator: ConditionalOperator;
  value?: unknown;
  values?: unknown[];
}

export interface ConditionalConfig<T extends FieldValues = FieldValues> {
  rules: ConditionalRule<T>[];
  operator?: 'and' | 'or';
  dependencies?: Path<T>[];
}

export interface ConditionalFieldState {
  isVisible: boolean;
  isRequired: boolean;
  isDisabled: boolean;
  validationRules?: Record<string, unknown>;
}

export interface UseConditionalFieldsOptions<T extends FieldValues = FieldValues> {
  control: Control<T>;
  fields: Record<string, ConditionalConfig<T>>;
  onFieldChange?: (fieldName: string, state: ConditionalFieldState) => void;
  debounceMs?: number;
}

export interface ConditionalFieldsResult<T extends FieldValues = FieldValues> {
  fieldStates: Record<string, ConditionalFieldState>;
  isFieldVisible: (fieldName: string) => boolean;
  isFieldRequired: (fieldName: string) => boolean;
  isFieldDisabled: (fieldName: string) => boolean;
  getFieldValidationRules: (fieldName: string) => Record<string, unknown>;
  evaluateCondition: (config: ConditionalConfig<T>) => boolean;
  updateFieldConfig: (fieldName: string, config: ConditionalConfig<T>) => void;
  removeField: (fieldName: string) => void;
}

// Helper function to evaluate a single rule
function evaluateRule(fieldValue: unknown, rule: ConditionalRule): boolean {
  const { operator, value, values } = rule;

  switch (operator) {
    case 'eq':
      return fieldValue === value;
    
    case 'neq':
      return fieldValue !== value;
    
    case 'in':
      return Array.isArray(values) && values.includes(fieldValue);
    
    case 'nin':
      return Array.isArray(values) && !values.includes(fieldValue);
    
    case 'gt':
      return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue > value;
    
    case 'gte':
      return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue >= value;
    
    case 'lt':
      return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue < value;
    
    case 'lte':
      return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue <= value;
    
    case 'contains':
      return typeof fieldValue === 'string' && typeof value === 'string' && fieldValue.includes(value);
    
    case 'startswith':
      return typeof fieldValue === 'string' && typeof value === 'string' && fieldValue.startsWith(value);
    
    case 'endswith':
      return typeof fieldValue === 'string' && typeof value === 'string' && fieldValue.endsWith(value);
    
    case 'regex':
      if (typeof fieldValue === 'string' && value instanceof RegExp) {
        return value.test(fieldValue);
      }
      if (typeof fieldValue === 'string' && typeof value === 'string') {
        try {
          const regex = new RegExp(value);
          return regex.test(fieldValue);
        } catch {
          return false;
        }
      }
      return false;
    
    case 'truthy':
      return Boolean(fieldValue);
    
    case 'falsy':
      return !fieldValue;
    
    default:
      return false;
  }
}

// Helper function to get all field dependencies from a config
function getFieldDependencies<T extends FieldValues>(config: ConditionalConfig<T>): Path<T>[] {
  const dependencies = new Set<Path<T>>();
  
  // Add explicit dependencies
  if (config.dependencies) {
    config.dependencies.forEach(dep => dependencies.add(dep));
  }
  
  // Add fields referenced in rules
  config.rules.forEach(rule => {
    dependencies.add(rule.field);
  });
  
  return Array.from(dependencies);
}

export function useConditionalFields<T extends FieldValues = FieldValues>({
  control,
  fields: initialFields,
  onFieldChange,
  debounceMs = 100,
}: UseConditionalFieldsOptions<T>): ConditionalFieldsResult<T> {
  const [fields, setFields] = useState(initialFields);
  const [fieldStates, setFieldStates] = useState<Record<string, ConditionalFieldState>>({});
  const debounceRef = useRef<NodeJS.Timeout>();
  const previousStatesRef = useRef<Record<string, ConditionalFieldState>>({});

  // Get all unique field dependencies
  const allDependencies = useMemo(() => {
    const deps = new Set<Path<T>>();
    Object.values(fields).forEach(config => {
      getFieldDependencies(config).forEach(dep => deps.add(dep));
    });
    return Array.from(deps);
  }, [fields]);

  // Watch all dependency fields
  const watchedValues = useWatch({
    control,
    name: allDependencies,
  });

  // Create a map of field values for easy lookup
  const fieldValues = useMemo(() => {
    const values: Record<string, unknown> = {};
    allDependencies.forEach((field, index) => {
      values[field] = Array.isArray(watchedValues) ? watchedValues[index] : watchedValues;
    });
    return values;
  }, [allDependencies, watchedValues]);

  // Function to evaluate a conditional configuration
  const evaluateCondition = useCallback((config: ConditionalConfig<T>): boolean => {
    const { rules, operator = 'and' } = config;
    
    if (rules.length === 0) return true;

    const results = rules.map(rule => {
      const fieldValue = fieldValues[rule.field];
      return evaluateRule(fieldValue, rule as ConditionalRule);
    });

    return operator === 'and' 
      ? results.every(Boolean)
      : results.some(Boolean);
  }, [fieldValues]);

  // Function to calculate field state based on conditions
  const calculateFieldState = useCallback((fieldName: string, config: ConditionalConfig<T>): ConditionalFieldState => {
    const isVisible = evaluateCondition(config);
    
    // You can extend this to support conditional requirements and disabled states
    return {
      isVisible,
      isRequired: isVisible, // Default: required if visible
      isDisabled: false,
      validationRules: isVisible ? {} : undefined,
    };
  }, [evaluateCondition]);

  // Update field states when dependencies change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const newStates: Record<string, ConditionalFieldState> = {};
      
      Object.entries(fields).forEach(([fieldName, config]) => {
        newStates[fieldName] = calculateFieldState(fieldName, config);
      });

      // Check if states have actually changed
      const hasChanged = Object.keys(newStates).some(fieldName => {
        const prev = previousStatesRef.current[fieldName];
        const current = newStates[fieldName];
        
        return !prev || 
          prev.isVisible !== current.isVisible ||
          prev.isRequired !== current.isRequired ||
          prev.isDisabled !== current.isDisabled;
      });

      if (hasChanged) {
        setFieldStates(newStates);
        
        // Notify about field changes
        if (onFieldChange) {
          Object.entries(newStates).forEach(([fieldName, state]) => {
            const prevState = previousStatesRef.current[fieldName];
            if (!prevState || 
                prevState.isVisible !== state.isVisible ||
                prevState.isRequired !== state.isRequired ||
                prevState.isDisabled !== state.isDisabled) {
              onFieldChange(fieldName, state);
            }
          });
        }
        
        previousStatesRef.current = newStates;
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fields, fieldValues, calculateFieldState, onFieldChange, debounceMs]);

  // Helper functions
  const isFieldVisible = useCallback((fieldName: string): boolean => {
    return fieldStates[fieldName]?.isVisible ?? true;
  }, [fieldStates]);

  const isFieldRequired = useCallback((fieldName: string): boolean => {
    return fieldStates[fieldName]?.isRequired ?? false;
  }, [fieldStates]);

  const isFieldDisabled = useCallback((fieldName: string): boolean => {
    return fieldStates[fieldName]?.isDisabled ?? false;
  }, [fieldStates]);

  const getFieldValidationRules = useCallback((fieldName: string): Record<string, unknown> => {
    return fieldStates[fieldName]?.validationRules ?? {};
  }, [fieldStates]);

  const updateFieldConfig = useCallback((fieldName: string, config: ConditionalConfig<T>) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: config,
    }));
  }, []);

  const removeField = useCallback((fieldName: string) => {
    setFields(prev => {
      const { [fieldName]: removed, ...rest } = prev;
      return rest;
    });
    setFieldStates(prev => {
      const { [fieldName]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  return {
    fieldStates,
    isFieldVisible,
    isFieldRequired,
    isFieldDisabled,
    getFieldValidationRules,
    evaluateCondition,
    updateFieldConfig,
    removeField,
  };
}

// Additional hook for simpler use cases
export function useConditionalField<T extends FieldValues = FieldValues>(
  control: Control<T>,
  fieldName: string,
  config: ConditionalConfig<T>
) {
  const result = useConditionalFields({
    control,
    fields: { [fieldName]: config },
  });

  return {
    isVisible: result.isFieldVisible(fieldName),
    isRequired: result.isFieldRequired(fieldName),
    isDisabled: result.isFieldDisabled(fieldName),
    validationRules: result.getFieldValidationRules(fieldName),
    state: result.fieldStates[fieldName],
  };
}
