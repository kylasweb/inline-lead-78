import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Circle, AlertCircle, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { type FieldValues, type FieldErrors } from "react-hook-form";

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: string[];
  optional?: boolean;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

export interface FormProgressState {
  currentStep: number;
  completedSteps: Set<number>;
  stepValidation: Record<number, boolean>;
  fieldProgress: Record<string, boolean>;
  totalProgress: number;
  isComplete: boolean;
}

export interface FormProgressTrackerProps {
  steps: FormStep[];
  currentStep?: number;
  errors?: FieldErrors<FieldValues>;
  values?: FieldValues;
  onStepClick?: (stepIndex: number) => void;
  allowStepNavigation?: boolean;
  showFieldProgress?: boolean;
  showOverallProgress?: boolean;
  variant?: 'horizontal' | 'vertical' | 'compact';
  className?: string;
}

const calculateFieldProgress = (fields: string[], values: FieldValues = {}, errors: FieldErrors = {}): {
  completed: number;
  total: number;
  hasErrors: boolean;
} => {
  let completed = 0;
  let hasErrors = false;

  fields.forEach(field => {
    const value = values[field];
    const hasError = !!errors[field];
    
    if (hasError) {
      hasErrors = true;
    }
    
    // Consider field completed if it has a truthy value and no errors
    if (value !== undefined && value !== null && value !== '' && !hasError) {
      completed++;
    }
  });

  return {
    completed,
    total: fields.length,
    hasErrors
  };
};

const calculateOverallProgress = (steps: FormStep[], values: FieldValues = {}, errors: FieldErrors = {}): FormProgressState => {
  let totalFields = 0;
  let completedFields = 0;
  const completedSteps = new Set<number>();
  const stepValidation: Record<number, boolean> = {};
  const fieldProgress: Record<string, boolean> = {};

  steps.forEach((step, index) => {
    const progress = calculateFieldProgress(step.fields, values, errors);
    totalFields += progress.total;
    completedFields += progress.completed;
    
    // Mark step as completed if all required fields are filled without errors
    const isStepComplete = progress.completed === progress.total && !progress.hasErrors;
    if (isStepComplete) {
      completedSteps.add(index);
    }
    
    stepValidation[index] = !progress.hasErrors;
    
    // Track individual field progress
    step.fields.forEach(field => {
      const value = values[field];
      const hasError = !!errors[field];
      fieldProgress[field] = value !== undefined && value !== null && value !== '' && !hasError;
    });
  });

  const totalProgress = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
  const isComplete = completedSteps.size === steps.length;

  return {
    currentStep: 0, // This will be overridden by the prop
    completedSteps,
    stepValidation,
    fieldProgress,
    totalProgress,
    isComplete
  };
};

export const FormProgressTracker = React.forwardRef<
  HTMLDivElement,
  FormProgressTrackerProps
>(({
  steps,
  currentStep = 0,
  errors = {},
  values = {},
  onStepClick,
  allowStepNavigation = false,
  showFieldProgress = true,
  showOverallProgress = true,
  variant = 'horizontal',
  className,
  ...props
}, ref) => {
  
  const progressState = React.useMemo(() => {
    const state = calculateOverallProgress(steps, values, errors);
    return { ...state, currentStep };
  }, [steps, values, errors, currentStep]);

  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'pending' | 'error' => {
    if (progressState.completedSteps.has(stepIndex)) {
      return 'completed';
    }
    if (stepIndex === currentStep) {
      return progressState.stepValidation[stepIndex] ? 'current' : 'error';
    }
    return 'pending';
  };

  const getStepIcon = (step: FormStep, status: string, index: number) => {
    if (status === 'completed') {
      return <Check size={16} className="text-white" />;
    }
    if (status === 'error') {
      return <AlertCircle size={16} className="text-white" />;
    }
    if (step.icon) {
      const Icon = step.icon;
      return <Icon size={16} className="text-current" />;
    }
    return <span className="text-sm font-medium">{index + 1}</span>;
  };

  const renderHorizontalStep = (step: FormStep, index: number) => {
    const status = getStepStatus(index);
    const progress = calculateFieldProgress(step.fields, values, errors);
    const isClickable = allowStepNavigation && (status === 'completed' || index <= currentStep);

    const stepClasses = cn(
      "flex flex-col items-center text-center transition-all duration-200",
      isClickable && "cursor-pointer hover:opacity-80",
      !isClickable && "cursor-default"
    );

    const indicatorClasses = cn(
      "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 mb-2",
      {
        'bg-green-500 border-green-500 text-white': status === 'completed',
        'bg-blue-500 border-blue-500 text-white': status === 'current' && progressState.stepValidation[index],
        'bg-red-500 border-red-500 text-white': status === 'error',
        'bg-white border-gray-300 text-gray-500': status === 'pending'
      }
    );

    return (
      <div key={step.id} className="flex items-center">
        <div
          className={stepClasses}
          onClick={() => isClickable && onStepClick?.(index)}
          role={isClickable ? "button" : undefined}
          tabIndex={isClickable ? 0 : -1}
          aria-label={`Step ${index + 1}: ${step.title}`}
          aria-current={index === currentStep ? "step" : undefined}
        >
          <div className={indicatorClasses}>
            {getStepIcon(step, status, index)}
          </div>
          
          <div className="min-w-0">
            <h4 className={cn(
              "text-sm font-medium truncate",
              status === 'current' ? 'text-blue-600' : 'text-gray-700'
            )}>
              {step.title}
            </h4>
            
            {step.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {step.description}
              </p>
            )}
            
            {showFieldProgress && (
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs text-gray-500">
                  {progress.completed}/{progress.total}
                </span>
                {step.optional && (
                  <Badge variant="secondary" className="text-xs">
                    Optional
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        
        {index < steps.length - 1 && (
          <ArrowRight 
            size={16} 
            className="mx-4 text-gray-400 flex-shrink-0" 
            aria-hidden="true"
          />
        )}
      </div>
    );
  };

  const renderVerticalStep = (step: FormStep, index: number) => {
    const status = getStepStatus(index);
    const progress = calculateFieldProgress(step.fields, values, errors);
    const isClickable = allowStepNavigation && (status === 'completed' || index <= currentStep);

    const stepClasses = cn(
      "flex items-start gap-4 p-4 rounded-lg border transition-all duration-200",
      {
        'border-green-200 bg-green-50': status === 'completed',
        'border-blue-200 bg-blue-50': status === 'current',
        'border-red-200 bg-red-50': status === 'error',
        'border-gray-200 bg-gray-50': status === 'pending'
      },
      isClickable && "cursor-pointer hover:shadow-md",
      !isClickable && "cursor-default"
    );

    const indicatorClasses = cn(
      "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 flex-shrink-0",
      {
        'bg-green-500 border-green-500 text-white': status === 'completed',
        'bg-blue-500 border-blue-500 text-white': status === 'current' && progressState.stepValidation[index],
        'bg-red-500 border-red-500 text-white': status === 'error',
        'bg-white border-gray-300 text-gray-500': status === 'pending'
      }
    );

    return (
      <div key={step.id} className="relative">
        <div
          className={stepClasses}
          onClick={() => isClickable && onStepClick?.(index)}
          role={isClickable ? "button" : undefined}
          tabIndex={isClickable ? 0 : -1}
          aria-label={`Step ${index + 1}: ${step.title}`}
          aria-current={index === currentStep ? "step" : undefined}
        >
          <div className={indicatorClasses}>
            {getStepIcon(step, status, index)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className={cn(
                "text-sm font-medium",
                status === 'current' ? 'text-blue-600' : 'text-gray-700'
              )}>
                {step.title}
              </h4>
              
              {showFieldProgress && (
                <div className="flex items-center gap-2">
                  {step.optional && (
                    <Badge variant="secondary" className="text-xs">
                      Optional
                    </Badge>
                  )}
                  <span className="text-xs text-gray-500">
                    {progress.completed}/{progress.total}
                  </span>
                </div>
              )}
            </div>
            
            {step.description && (
              <p className="text-xs text-gray-500">
                {step.description}
              </p>
            )}
            
            {showFieldProgress && progress.total > 0 && (
              <div className="mt-2">
                <Progress 
                  value={(progress.completed / progress.total) * 100} 
                  className="h-1"
                />
              </div>
            )}
          </div>
        </div>
        
        {index < steps.length - 1 && (
          <div 
            className="absolute left-8 top-16 w-0.5 h-4 bg-gray-300" 
            aria-hidden="true"
          />
        )}
      </div>
    );
  };

  const renderCompactStep = (step: FormStep, index: number) => {
    const status = getStepStatus(index);
    const isClickable = allowStepNavigation && (status === 'completed' || index <= currentStep);

    const stepClasses = cn(
      "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200",
      {
        'bg-green-500 border-green-500 text-white': status === 'completed',
        'bg-blue-500 border-blue-500 text-white': status === 'current',
        'bg-red-500 border-red-500 text-white': status === 'error',
        'bg-white border-gray-300 text-gray-500': status === 'pending'
      },
      isClickable && "cursor-pointer hover:scale-110",
      !isClickable && "cursor-default"
    );

    return (
      <div key={step.id} className="flex items-center">
        <div
          className={stepClasses}
          onClick={() => isClickable && onStepClick?.(index)}
          role={isClickable ? "button" : undefined}
          tabIndex={isClickable ? 0 : -1}
          aria-label={`Step ${index + 1}: ${step.title}`}
          aria-current={index === currentStep ? "step" : undefined}
          title={step.title}
        >
          {getStepIcon(step, status, index)}
        </div>
        
        {index < steps.length - 1 && (
          <div className="w-8 h-0.5 bg-gray-300 mx-1" aria-hidden="true" />
        )}
      </div>
    );
  };

  return (
    <div
      ref={ref}
      className={cn("form-progress-tracker", className)}
      role="progressbar"
      aria-valuenow={progressState.totalProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Form progress: ${Math.round(progressState.totalProgress)}% complete`}
      {...props}
    >
      {showOverallProgress && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Overall Progress
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progressState.totalProgress)}%
            </span>
          </div>
          <Progress value={progressState.totalProgress} className="h-2" />
        </div>
      )}
      
      <div className={cn(
        "steps-container",
        {
          'flex items-center justify-between': variant === 'horizontal',
          'space-y-2': variant === 'vertical',
          'flex items-center justify-center': variant === 'compact'
        }
      )}>
        {steps.map((step, index) => {
          switch (variant) {
            case 'vertical':
              return renderVerticalStep(step, index);
            case 'compact':
              return renderCompactStep(step, index);
            default:
              return renderHorizontalStep(step, index);
          }
        })}
      </div>
      
      {progressState.isComplete && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <Check size={16} />
            <span className="text-sm font-medium">
              Form completed successfully!
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

FormProgressTracker.displayName = "FormProgressTracker";

export default FormProgressTracker;