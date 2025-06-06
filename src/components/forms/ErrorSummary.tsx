import * as React from "react";
import { AlertCircle, X, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface FormError {
  field?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  code?: string;
}

export interface ErrorSummaryProps {
  errors: FormError[];
  title?: string;
  variant?: 'default' | 'destructive';
  showErrorCount?: boolean;
  dismissible?: boolean;
  scrollable?: boolean;
  maxHeight?: number;
  onDismiss?: () => void;
  onErrorClick?: (field: string) => void;
  className?: string;
  headerClassName?: string;
  listClassName?: string;
  itemClassName?: string;
  id?: string;
}

const ErrorSummary = React.forwardRef<HTMLDivElement, ErrorSummaryProps>(
  ({
    errors,
    title = "Please fix the following errors:",
    variant = 'destructive',
    showErrorCount = true,
    dismissible = false,
    scrollable = true,
    maxHeight = 300,
    onDismiss,
    onErrorClick,
    className,
    headerClassName,
    listClassName,
    itemClassName,
    id,
    ...props
  }, ref) => {
    const generatedId = React.useId();
    const summaryId = id || generatedId;

    // Group errors by type
    const errorsByType = React.useMemo(() => {
      return errors.reduce((acc, error) => {
        const type = error.type || 'error';
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(error);
        return acc;
      }, {} as Record<string, FormError[]>);
    }, [errors]);

    // Get icon for error type
    const getIconForType = (type: string) => {
      switch (type) {
        case 'warning':
          return <AlertTriangle className="h-4 w-4" />;
        case 'info':
          return <Info className="h-4 w-4" />;
        default:
          return <AlertCircle className="h-4 w-4" />;
      }
    };

    // Get variant for error type
    const getVariantForType = (type: string): 'default' | 'destructive' => {
      switch (type) {
        case 'warning':
          return 'default';
        case 'info':
          return 'default';
        default:
          return 'destructive';
      }
    };

    // Handle error item click
    const handleErrorClick = React.useCallback((error: FormError) => {
      if (error.field && onErrorClick) {
        onErrorClick(error.field);
      }
    }, [onErrorClick]);

    // Don't render if no errors
    if (errors.length === 0) {
      return null;
    }

    const totalErrors = errors.length;
    const errorCount = errorsByType.error?.length || 0;
    const warningCount = errorsByType.warning?.length || 0;
    const infoCount = errorsByType.info?.length || 0;

    return (
      <Alert
        ref={ref}
        id={summaryId}
        variant={variant}
        className={cn("error-summary", className)}
        role="alert"
        aria-live="polite"
        {...props}
      >
        <AlertCircle className="h-4 w-4" />
        
        {/* Header */}
        <div className={cn("flex items-start justify-between gap-2", headerClassName)}>
          <div className="flex-1 min-w-0">
            <AlertTitle className="mb-1">
              {title}
              {showErrorCount && (
                <span className="ml-2 text-sm font-normal opacity-80">
                  ({totalErrors} {totalErrors === 1 ? 'error' : 'errors'})
                </span>
              )}
            </AlertTitle>
            
            {/* Error type counts */}
            {(errorCount > 0 || warningCount > 0 || infoCount > 0) && (
              <div className="flex flex-wrap gap-3 text-xs opacity-80 mb-2">
                {errorCount > 0 && (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errorCount} error{errorCount !== 1 ? 's' : ''}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {warningCount} warning{warningCount !== 1 ? 's' : ''}
                  </span>
                )}
                {infoCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {infoCount} info
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Dismiss button */}
          {dismissible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0 hover:bg-transparent opacity-60 hover:opacity-100"
              aria-label="Dismiss errors"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Error List */}
        <AlertDescription className="mt-2">
          <div className={cn("error-list", listClassName)}>
            {scrollable && totalErrors > 5 ? (
              <ScrollArea 
                className="w-full pr-4" 
                style={{ maxHeight: `${maxHeight}px` }}
              >
                <ErrorList 
                  errorsByType={errorsByType}
                  onErrorClick={handleErrorClick}
                  itemClassName={itemClassName}
                />
              </ScrollArea>
            ) : (
              <ErrorList 
                errorsByType={errorsByType}
                onErrorClick={handleErrorClick}
                itemClassName={itemClassName}
              />
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }
);

// Internal component for rendering error list
interface ErrorListProps {
  errorsByType: Record<string, FormError[]>;
  onErrorClick: (error: FormError) => void;
  itemClassName?: string;
}

const ErrorList: React.FC<ErrorListProps> = ({ 
  errorsByType, 
  onErrorClick, 
  itemClassName 
}) => {
  return (
    <div className="space-y-3">
      {Object.entries(errorsByType).map(([type, typeErrors]) => (
        <div key={type} className="space-y-1">
          {typeErrors.length > 1 && (
            <div className="text-xs font-medium opacity-75 uppercase tracking-wide">
              {type}s ({typeErrors.length})
            </div>
          )}
          
          <ul className="space-y-1">
            {typeErrors.map((error, index) => {
              const isClickable = Boolean(error.field);
              
              return (
                <li key={`${type}-${index}`}>
                  <div
                    className={cn(
                      "flex items-start gap-2 text-sm p-2 rounded-md transition-colors duration-200",
                      {
                        "cursor-pointer hover:bg-white/10": isClickable,
                        "cursor-default": !isClickable,
                        "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800": type === 'error',
                        "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800": type === 'warning',
                        "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800": type === 'info',
                      },
                      itemClassName
                    )}
                    onClick={() => isClickable && onErrorClick(error)}
                    role={isClickable ? "button" : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onErrorClick(error);
                      }
                    }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {type === 'warning' ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : type === 'info' ? (
                        <Info className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        {error.field && (
                          <span className="text-xs uppercase tracking-wide opacity-75 mr-2">
                            {error.field}:
                          </span>
                        )}
                        {error.message}
                      </div>
                      
                      {error.code && (
                        <div className="text-xs opacity-60 mt-1">
                          Code: {error.code}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

ErrorSummary.displayName = "ErrorSummary";

export { ErrorSummary };