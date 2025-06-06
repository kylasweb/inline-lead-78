import * as React from "react";
import { cn } from "@/lib/utils";

export interface ConditionalFieldProps {
  condition: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  animationType?: 'none' | 'fade' | 'slide' | 'scale';
  duration?: number;
  className?: string;
  keepInDOM?: boolean;
  onShow?: () => void;
  onHide?: () => void;
  id?: string;
}

const ConditionalField = React.forwardRef<HTMLDivElement, ConditionalFieldProps>(
  ({
    condition,
    children,
    fallback,
    animationType = 'fade',
    duration = 200,
    className,
    keepInDOM = false,
    onShow,
    onHide,
    id,
    ...props
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(condition);
    const [shouldRender, setShouldRender] = React.useState(condition);
    const timeoutRef = React.useRef<NodeJS.Timeout>();
    const previousCondition = React.useRef(condition);

    // Handle condition changes
    React.useEffect(() => {
      if (condition !== previousCondition.current) {
        previousCondition.current = condition;

        if (condition) {
          // Show
          setShouldRender(true);
          onShow?.();
          
          // Small delay to ensure DOM is rendered before animation
          setTimeout(() => {
            setIsVisible(true);
          }, 10);
        } else {
          // Hide
          setIsVisible(false);
          onHide?.();
          
          // Wait for animation to complete before removing from DOM
          if (!keepInDOM && animationType !== 'none') {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
              setShouldRender(false);
            }, duration);
          } else if (!keepInDOM) {
            setShouldRender(false);
          }
        }
      }
    }, [condition, duration, keepInDOM, animationType, onShow, onHide]);

    // Cleanup timeout on unmount
    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    // Animation styles based on type
    const getAnimationStyles = React.useCallback(() => {
      const baseStyles = {
        transition: animationType !== 'none' ? `all ${duration}ms ease-in-out` : undefined,
      };

      if (animationType === 'none') {
        return baseStyles;
      }

      switch (animationType) {
        case 'fade':
          return {
            ...baseStyles,
            opacity: isVisible ? 1 : 0,
          };
        
        case 'slide':
          return {
            ...baseStyles,
            opacity: isVisible ? 1 : 0,
            transform: isVisible 
              ? 'translateY(0)' 
              : 'translateY(-10px)',
          };
        
        case 'scale':
          return {
            ...baseStyles,
            opacity: isVisible ? 1 : 0,
            transform: isVisible 
              ? 'scale(1)' 
              : 'scale(0.95)',
            transformOrigin: 'top left',
          };
        
        default:
          return baseStyles;
      }
    }, [animationType, duration, isVisible]);

    // Container styles
    const containerStyles = cn(
      "conditional-field transition-all duration-200",
      {
        "hidden": !shouldRender && !keepInDOM,
        "invisible": keepInDOM && !isVisible,
        "visible": keepInDOM && isVisible,
      },
      className
    );

    // Don't render anything if condition is false and we shouldn't keep in DOM
    if (!shouldRender && !keepInDOM) {
      return fallback ? <>{fallback}</> : null;
    }

    return (
      <div
        ref={ref}
        id={id}
        className={containerStyles}
        style={getAnimationStyles()}
        aria-hidden={!condition}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ConditionalField.displayName = "ConditionalField";

// Higher-order component for conditional rendering with multiple conditions
export interface ConditionalFieldGroupProps {
  conditions: Array<{
    when: boolean;
    render: React.ReactNode;
    id?: string;
  }>;
  defaultRender?: React.ReactNode;
  animationType?: 'none' | 'fade' | 'slide' | 'scale';
  duration?: number;
  className?: string;
  exclusive?: boolean; // Only show first matching condition
}

const ConditionalFieldGroup = React.forwardRef<HTMLDivElement, ConditionalFieldGroupProps>(
  ({
    conditions,
    defaultRender,
    animationType = 'fade',
    duration = 200,
    className,
    exclusive = false,
    ...props
  }, ref) => {
    const activeConditions = exclusive 
      ? conditions.slice(0, 1).filter(condition => condition.when)
      : conditions.filter(condition => condition.when);

    const hasActiveConditions = activeConditions.length > 0;

    return (
      <div ref={ref} className={cn("conditional-field-group space-y-2", className)} {...props}>
        {activeConditions.map((condition, index) => (
          <ConditionalField
            key={condition.id || index}
            condition={condition.when}
            animationType={animationType}
            duration={duration}
          >
            {condition.render}
          </ConditionalField>
        ))}
        
        {!hasActiveConditions && defaultRender && (
          <ConditionalField
            condition={!hasActiveConditions}
            animationType={animationType}
            duration={duration}
          >
            {defaultRender}
          </ConditionalField>
        )}
      </div>
    );
  }
);

ConditionalFieldGroup.displayName = "ConditionalFieldGroup";

// Hook for managing conditional field state
export function useConditionalField(
  condition: boolean,
  options: {
    onShow?: () => void;
    onHide?: () => void;
    delay?: number;
  } = {}
) {
  const [isVisible, setIsVisible] = React.useState(condition);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (options.delay && options.delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(condition);
        if (condition) {
          options.onShow?.();
        } else {
          options.onHide?.();
        }
      }, options.delay);
    } else {
      setIsVisible(condition);
      if (condition) {
        options.onShow?.();
      } else {
        options.onHide?.();
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [condition, options]);

  return {
    isVisible,
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
    toggle: () => setIsVisible(prev => !prev),
  };
}

export { ConditionalField, ConditionalFieldGroup };