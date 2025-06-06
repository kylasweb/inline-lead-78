import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  required?: boolean;
  variant?: 'default' | 'card' | 'bordered' | 'minimal';
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  onToggleCollapse?: (collapsed: boolean) => void;
  id?: string;
}

const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({
    title,
    description,
    children,
    collapsible = false,
    defaultCollapsed = false,
    required = false,
    variant = 'default',
    icon,
    badge,
    actions,
    className,
    headerClassName,
    contentClassName,
    titleClassName,
    descriptionClassName,
    onToggleCollapse,
    id,
    ...props
  }, ref) => {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
    const generatedId = React.useId();
    const sectionId = id || generatedId;

    // Handle collapse toggle
    const handleToggleCollapse = React.useCallback(() => {
      const newCollapsed = !isCollapsed;
      setIsCollapsed(newCollapsed);
      onToggleCollapse?.(newCollapsed);
    }, [isCollapsed, onToggleCollapse]);

    // Determine section styling based on variant
    const sectionStyles = cn(
      "form-section transition-all duration-200",
      {
        // Default variant - minimal styling
        "space-y-4": variant === 'default',
        
        // Card variant - elevated with background
        "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm": variant === 'card',
        
        // Bordered variant - simple border
        "border border-gray-200 dark:border-gray-700 rounded-lg p-4": variant === 'bordered',
        
        // Minimal variant - no styling
        "": variant === 'minimal',
      },
      className
    );

    // Header styling
    const headerStyles = cn(
      "form-section-header",
      {
        "mb-4": (title || description) && variant !== 'minimal',
        "mb-6": (title || description) && variant === 'card',
        "mb-3": (title || description) && variant === 'bordered',
        "mb-2": (title || description) && variant === 'minimal',
        "cursor-pointer": collapsible,
      },
      headerClassName
    );

    // Title styling
    const titleStyles = cn(
      "form-section-title font-semibold transition-colors duration-200",
      {
        "text-lg text-gray-900 dark:text-gray-100": variant === 'card',
        "text-base text-gray-800 dark:text-gray-200": variant === 'bordered',
        "text-base text-gray-900 dark:text-gray-100": variant === 'default',
        "text-sm font-medium text-gray-700 dark:text-gray-300": variant === 'minimal',
        "hover:text-blue-600 dark:hover:text-blue-400": collapsible,
      },
      titleClassName
    );

    // Description styling
    const descriptionStyles = cn(
      "form-section-description text-sm text-gray-600 dark:text-gray-400 mt-1",
      descriptionClassName
    );

    // Content styling
    const contentStyles = cn(
      "form-section-content transition-all duration-200 space-y-4",
      {
        "hidden": isCollapsed,
        "animate-in slide-in-from-top-1": !isCollapsed && collapsible,
      },
      contentClassName
    );

    return (
      <div
        ref={ref}
        id={sectionId}
        className={sectionStyles}
        {...props}
      >
        {/* Header */}
        {(title || description || collapsible || actions) && (
          <div className={headerStyles}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Title Row */}
                {title && (
                  <div className="flex items-center gap-2 mb-1">
                    {/* Icon */}
                    {icon && (
                      <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                        {icon}
                      </div>
                    )}

                    {/* Collapsible Title */}
                    {collapsible ? (
                      <Button
                        variant="ghost"
                        onClick={handleToggleCollapse}
                        className="h-auto p-0 font-semibold text-left justify-start hover:bg-transparent"
                        aria-expanded={!isCollapsed}
                        aria-controls={`${sectionId}-content`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={titleStyles}>{title}</span>
                          {required && <span className="text-red-500" aria-label="required">*</span>}
                          {isCollapsed ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4" />
                          )}
                        </div>
                      </Button>
                    ) : (
                      /* Non-collapsible Title */
                      <h3 className={titleStyles}>
                        {title}
                        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
                      </h3>
                    )}

                    {/* Badge */}
                    {badge && (
                      <div className="flex-shrink-0">
                        {badge}
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                {description && (
                  <p className={descriptionStyles}>
                    {description}
                  </p>
                )}
              </div>

              {/* Actions */}
              {actions && !collapsible && (
                <div className="flex-shrink-0">
                  {actions}
                </div>
              )}
            </div>

            {/* Separator for card and bordered variants */}
            {(variant === 'card' || variant === 'bordered') && (title || description) && (
              <Separator className="mt-4" />
            )}
          </div>
        )}

        {/* Content */}
        <div
          id={`${sectionId}-content`}
          className={contentStyles}
          aria-hidden={isCollapsed}
        >
          {children}
        </div>
      </div>
    );
  }
);

FormSection.displayName = "FormSection";

export { FormSection };