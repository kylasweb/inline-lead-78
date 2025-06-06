import * as React from "react";
import { type FieldValues, type Control } from "react-hook-form";
import { cn } from "@/lib/utils";
import {
  useConditionalFields,
  type ConditionalConfig,
  type ConditionalFieldState,
  type ConditionalOperator
} from "@/hooks/use-conditional-fields";
import { useAccessibility } from "@/hooks/use-accessibility";
import { ConditionalField } from "./ConditionalField";
import { FormSection, type FormSectionProps } from "./FormSection";

export interface ConditionalFormSectionProps<T extends FieldValues = FieldValues> 
  extends Omit<FormSectionProps, 'children'> {
  control: Control<T>;
  fields: Record<string, ConditionalConfig<T>>;
  children: (fieldStates: Record<string, ConditionalFieldState>) => React.ReactNode;
  onFieldStateChange?: (fieldName: string, state: ConditionalFieldState) => void;
  announceChanges?: boolean;
  debounceMs?: number;
  animationType?: 'none' | 'fade' | 'slide' | 'scale';
  animationDuration?: number;
  className?: string;
}

export const ConditionalFormSection = React.forwardRef<
  HTMLDivElement,
  ConditionalFormSectionProps
>(
  <T extends FieldValues = FieldValues>({
    control,
    fields,
    children,
    onFieldStateChange,
    announceChanges = true,
    debounceMs = 100,
    animationType = 'fade',
    animationDuration = 200,
    className,
    title,
    description,
    ...props
  }: ConditionalFormSectionProps<T>, ref: React.ForwardedRef<HTMLDivElement>) => {
    
    const { announceChange } = useAccessibility({
      announceChanges,
    });

    // Use the conditional fields hook
    const {
      fieldStates,
      isFieldVisible,
      isFieldRequired,
      isFieldDisabled,
    } = useConditionalFields({
      control,
      fields,
      onFieldChange: (fieldName, state) => {
        onFieldStateChange?.(fieldName, state);
        
        if (announceChanges) {
          const status = state.isVisible ? 'shown' : 'hidden';
          announceChange(`Field ${fieldName} is now ${status}`);
        }
      },
      debounceMs,
    });

    // Track visible field count for announcements
    const visibleFieldCount = React.useMemo(() => {
      return Object.values(fieldStates).filter(state => state.isVisible).length;
    }, [fieldStates]);

    const previousVisibleCount = React.useRef(visibleFieldCount);

    // Announce when field count changes significantly
    React.useEffect(() => {
      if (announceChanges && Math.abs(visibleFieldCount - previousVisibleCount.current) > 1) {
        announceChange(`${visibleFieldCount} fields are now visible`);
      }
      previousVisibleCount.current = visibleFieldCount;
    }, [visibleFieldCount, announceChanges, announceChange]);

    return (
      <FormSection
        ref={ref}
        title={title}
        description={description}
        className={cn("conditional-form-section", className)}
        {...props}
      >
        <div className="conditional-fields-container space-y-4">
          {React.Children.map(
            typeof children === 'function' ? children(fieldStates) : children,
            (child, index) => {
              if (!React.isValidElement(child)) return child;

              // Check if this child has a field name we can track
              const fieldName = child.props?.name || child.props?.fieldName;
              
              if (fieldName && fields[fieldName]) {
                const isVisible = isFieldVisible(fieldName);
                const isRequired = isFieldRequired(fieldName);
                const isDisabled = isFieldDisabled(fieldName);

                return (
                  <ConditionalField
                    key={fieldName}
                    condition={isVisible}
                    animationType={animationType}
                    duration={animationDuration}
                    onShow={() => {
                      if (announceChanges) {
                        announceChange(`${fieldName} field is now visible`);
                      }
                    }}
                    onHide={() => {
                      if (announceChanges) {
                        announceChange(`${fieldName} field is now hidden`);
                      }
                    }}
                  >
                    {React.cloneElement(child, {
                      ...child.props,
                      required: isRequired,
                      disabled: isDisabled,
                      'aria-hidden': !isVisible,
                    })}
                  </ConditionalField>
                );
              }

              return child;
            }
          )}
        </div>
      </FormSection>
    );
  }
);

ConditionalFormSection.displayName = "ConditionalFormSection";

// Higher-order component for easier conditional form creation
export interface ConditionalFormBuilderProps<T extends FieldValues = FieldValues> {
  control: Control<T>;
  className?: string;
  announceChanges?: boolean;
}

export interface ConditionalFieldDefinition<T extends FieldValues = FieldValues> {
  name: keyof T;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  condition: ConditionalConfig<T>;
  section?: string;
}

export function ConditionalFormBuilder<T extends FieldValues = FieldValues>({
  control,
  className,
  announceChanges = true,
}: ConditionalFormBuilderProps<T>) {
  const [fieldDefinitions, setFieldDefinitions] = React.useState<ConditionalFieldDefinition<T>[]>([]);
  const [sections, setSections] = React.useState<Record<string, { title?: string; description?: string }>>({});

  const addField = React.useCallback((definition: ConditionalFieldDefinition<T>) => {
    setFieldDefinitions(prev => [...prev, definition]);
  }, []);

  const removeField = React.useCallback((fieldName: keyof T) => {
    setFieldDefinitions(prev => prev.filter(def => def.name !== fieldName));
  }, []);

  const addSection = React.useCallback((
    sectionName: string, 
    config: { title?: string; description?: string }
  ) => {
    setSections(prev => ({ ...prev, [sectionName]: config }));
  }, []);

  const getFieldsBySection = React.useCallback(() => {
    const grouped: Record<string, ConditionalFieldDefinition<T>[]> = {};
    
    fieldDefinitions.forEach(field => {
      const section = field.section || 'default';
      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push(field);
    });
    
    return grouped;
  }, [fieldDefinitions]);

  const renderSection = React.useCallback((
    sectionName: string, 
    fields: ConditionalFieldDefinition<T>[]
  ) => {
    const sectionConfig = sections[sectionName];
    const fieldsConfig = Object.fromEntries(
      fields.map(field => [field.name as string, field.condition])
    );

    return (
      <ConditionalFormSection
        key={sectionName}
        control={control as Control<FieldValues>}
        fields={fieldsConfig as Record<string, ConditionalConfig<FieldValues>>}
        title={sectionConfig?.title}
        description={sectionConfig?.description}
        announceChanges={announceChanges}
      >
        {(fieldStates) => (
          <>
            {fields.map(field => {
              const Component = field.component;
              const isVisible = fieldStates[field.name as string]?.isVisible ?? true;
              
              return (
                <ConditionalField
                  key={field.name as string}
                  condition={isVisible}
                >
                  <Component
                    name={field.name}
                    {...field.props}
                  />
                </ConditionalField>
              );
            })}
          </>
        )}
      </ConditionalFormSection>
    );
  }, [control, sections, announceChanges]);

  const render = React.useCallback(() => {
    const groupedFields = getFieldsBySection();
    
    return (
      <div className={cn("conditional-form-builder", className)}>
        {Object.entries(groupedFields).map(([sectionName, fields]) =>
          renderSection(sectionName, fields)
        )}
      </div>
    );
  }, [getFieldsBySection, renderSection, className]);

  return {
    addField,
    removeField,
    addSection,
    render,
    fieldDefinitions,
    sections,
  };
}

// Utility component for conditional field groups with complex logic
export interface ConditionalFieldGroupProps<T extends FieldValues = FieldValues> {
  control: Control<T>;
  children: React.ReactNode;
  conditions: Array<{
    when: ConditionalConfig<T>;
    show: string[]; // field names to show
    hide?: string[]; // field names to hide
    require?: string[]; // field names to make required
    disable?: string[]; // field names to disable
  }>;
  mode?: 'any' | 'all'; // Whether any or all conditions must be met
  className?: string;
}

export function ConditionalFieldGroup<T extends FieldValues = FieldValues>({
  control,
  children,
  conditions,
  mode = 'any',
  className,
}: ConditionalFieldGroupProps<T>) {
  
  // Create a combined config for all conditions
  const combinedFields = React.useMemo(() => {
    const fields: Record<string, ConditionalConfig<T>> = {};
    
    conditions.forEach((condition, index) => {
      const conditionKey = `condition-${index}`;
      
      // Add show fields
      condition.show.forEach(fieldName => {
        if (!fields[fieldName]) {
          fields[fieldName] = {
            rules: [],
            operator: mode === 'any' ? 'or' : 'and',
          };
        }
        fields[fieldName].rules.push(...condition.when.rules);
      });
      
      // Add hide fields (with negated conditions)
      condition.hide?.forEach(fieldName => {
        if (!fields[fieldName]) {
          fields[fieldName] = {
            rules: [],
            operator: mode === 'any' ? 'and' : 'or', // Flip for hiding
          };
        }
        // Add negated rules for hiding
        const negatedRules = condition.when.rules.map(rule => ({
          ...rule,
          operator: (rule.operator === 'eq' ? 'neq' :
                   rule.operator === 'neq' ? 'eq' :
                   rule.operator === 'in' ? 'nin' :
                   rule.operator === 'nin' ? 'in' :
                   rule.operator === 'truthy' ? 'falsy' :
                   rule.operator === 'falsy' ? 'truthy' :
                   rule.operator) as ConditionalOperator
        }));
        fields[fieldName].rules.push(...negatedRules);
      });
    });
    
    return fields;
  }, [conditions, mode]);

  return (
    <ConditionalFormSection
      control={control as Control<FieldValues>}
      fields={combinedFields as Record<string, ConditionalConfig<FieldValues>>}
      className={cn("conditional-field-group", className)}
    >
      {() => children}
    </ConditionalFormSection>
  );
}

export { ConditionalFormSection as default };