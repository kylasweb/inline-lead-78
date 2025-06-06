import * as React from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export interface Step {
  id: string;
  title: string;
  description?: string;
  optional?: boolean;
  component: React.ReactNode;
}

export interface MultiStepFormProps {
  steps: Step[];
  currentStep?: number;
  onStepChange?: (step: number) => void;
  onNext?: (currentStep: number) => Promise<boolean> | boolean;
  onPrevious?: (currentStep: number) => void;
  onSubmit?: () => Promise<void> | void;
  isValidating?: boolean;
  isSubmitting?: boolean;
  showProgress?: boolean;
  showStepNumbers?: boolean;
  allowStepNavigation?: boolean;
  variant?: 'default' | 'card' | 'wizard';
  submitLabel?: string;
  nextLabel?: string;
  previousLabel?: string;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  progressClassName?: string;
  children?: React.ReactNode;
}

const MultiStepForm = React.forwardRef<HTMLDivElement, MultiStepFormProps>(
  ({
    steps,
    currentStep = 0,
    onStepChange,
    onNext,
    onPrevious,
    onSubmit,
    isValidating = false,
    isSubmitting = false,
    showProgress = true,
    showStepNumbers = true,
    allowStepNavigation = false,
    variant = 'default',
    submitLabel = "Submit",
    nextLabel = "Next",
    previousLabel = "Previous",
    className,
    headerClassName,
    contentClassName,
    footerClassName,
    progressClassName,
    children,
    ...props
  }, ref) => {
    const [internalStep, setInternalStep] = React.useState(currentStep);
    
    const activeStep = currentStep !== undefined ? currentStep : internalStep;
    const currentStepData = steps[activeStep];
    const isFirstStep = activeStep === 0;
    const isLastStep = activeStep === steps.length - 1;
    const progress = ((activeStep + 1) / steps.length) * 100;

    // Handle step navigation
    const handleStepClick = React.useCallback((stepIndex: number) => {
      if (!allowStepNavigation || stepIndex === activeStep) return;
      
      setInternalStep(stepIndex);
      onStepChange?.(stepIndex);
    }, [allowStepNavigation, activeStep, onStepChange]);

    // Handle next step
    const handleNext = React.useCallback(async () => {
      if (isLastStep) {
        await onSubmit?.();
        return;
      }

      const canProceed = await onNext?.(activeStep);
      if (canProceed !== false) {
        const nextStep = activeStep + 1;
        setInternalStep(nextStep);
        onStepChange?.(nextStep);
      }
    }, [activeStep, isLastStep, onNext, onSubmit, onStepChange]);

    // Handle previous step
    const handlePrevious = React.useCallback(() => {
      if (isFirstStep) return;
      
      const prevStep = activeStep - 1;
      setInternalStep(prevStep);
      onPrevious?.(activeStep);
      onStepChange?.(prevStep);
    }, [activeStep, isFirstStep, onPrevious, onStepChange]);

    // Form styling based on variant
    const formStyles = cn(
      "multi-step-form",
      {
        "space-y-6": variant === 'default',
        "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm": variant === 'card',
        "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-6": variant === 'wizard',
      },
      className
    );

    // Header styling
    const headerStyles = cn(
      "multi-step-form-header",
      {
        "mb-6": variant === 'default' || variant === 'wizard',
        "p-6 pb-0": variant === 'card',
      },
      headerClassName
    );

    // Content styling
    const contentStyles = cn(
      "multi-step-form-content",
      {
        "": variant === 'default',
        "p-6": variant === 'card',
        "": variant === 'wizard',
      },
      contentClassName
    );

    // Footer styling
    const footerStyles = cn(
      "multi-step-form-footer",
      {
        "mt-6": variant === 'default' || variant === 'wizard',
        "p-6 pt-0": variant === 'card',
      },
      footerClassName
    );

    return (
      <div ref={ref} className={formStyles} {...props}>
        {/* Header with Step Navigation and Progress */}
        <div className={headerStyles}>
          {/* Step Navigation */}
          <div className="mb-4">
            <nav aria-label="Form progress">
              <ol className="flex items-center space-x-2 overflow-x-auto pb-2">
                {steps.map((step, index) => {
                  const isActive = index === activeStep;
                  const isCompleted = index < activeStep;
                  const isClickable = allowStepNavigation && index <= activeStep;

                  return (
                    <li key={step.id} className="flex items-center flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStepClick(index)}
                        disabled={!isClickable}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium",
                          {
                            "bg-blue-600 text-white": isActive,
                            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200": isCompleted,
                            "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300": !isActive && !isCompleted,
                            "hover:bg-blue-50 dark:hover:bg-blue-900/20": isClickable && !isActive,
                            "cursor-pointer": isClickable,
                            "cursor-default": !isClickable,
                          }
                        )}
                        aria-current={isActive ? "step" : undefined}
                      >
                        {/* Step Number/Icon */}
                        <div className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                          {
                            "bg-white text-blue-600": isActive,
                            "bg-green-600 text-white": isCompleted,
                            "bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300": !isActive && !isCompleted,
                          }
                        )}>
                          {isCompleted ? (
                            <Check className="w-3 h-3" />
                          ) : showStepNumbers ? (
                            index + 1
                          ) : null}
                        </div>

                        {/* Step Title */}
                        <div className="text-left">
                          <div className="font-medium">{step.title}</div>
                          {step.optional && (
                            <div className="text-xs opacity-75">Optional</div>
                          )}
                        </div>
                      </button>

                      {/* Separator */}
                      {index < steps.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-gray-400 mx-2 flex-shrink-0" />
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          {/* Progress Bar */}
          {showProgress && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Step {activeStep + 1} of {steps.length}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(progress)}% complete
                </span>
              </div>
              <Progress 
                value={progress} 
                className={cn("h-2", progressClassName)} 
              />
            </div>
          )}

          {/* Current Step Info */}
          {currentStepData && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {currentStepData.title}
              </h2>
              {currentStepData.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {currentStepData.description}
                </p>
              )}
            </div>
          )}

          <Separator />
        </div>

        {/* Step Content */}
        <div className={contentStyles}>
          {currentStepData?.component}
          {children}
        </div>

        {/* Footer with Navigation */}
        <div className={footerStyles}>
          <Separator className="mb-4" />
          
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep || isValidating || isSubmitting}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              {previousLabel}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleNext}
                disabled={isValidating || isSubmitting}
                className="flex items-center gap-2"
              >
                {isLastStep ? (
                  isSubmitting ? "Submitting..." : submitLabel
                ) : (
                  <>
                    {isValidating ? "Validating..." : nextLabel}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

MultiStepForm.displayName = "MultiStepForm";

export { MultiStepForm };
export type { Step as MultiStepFormStep };