import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Loader2, Save, Clock } from "lucide-react";
import { type AutoSaveStatus } from "@/hooks/use-auto-save";

export interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSaved?: Date | null;
  error?: Error | null;
  className?: string;
  showText?: boolean;
  showTimestamp?: boolean;
  compact?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'inline';
}

const getStatusConfig = (status: AutoSaveStatus) => {
  switch (status) {
    case 'idle':
      return {
        icon: Save,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/10',
        text: 'Ready to save',
        ariaLabel: 'Auto-save is ready'
      };
    case 'saving':
      return {
        icon: Loader2,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        text: 'Saving...',
        ariaLabel: 'Auto-saving in progress',
        animate: true
      };
    case 'saved':
      return {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        text: 'Saved',
        ariaLabel: 'Auto-save completed successfully'
      };
    case 'error':
      return {
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        text: 'Save failed',
        ariaLabel: 'Auto-save failed'
      };
    default:
      return {
        icon: Save,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/10',
        text: 'Unknown',
        ariaLabel: 'Auto-save status unknown'
      };
  }
};

const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const AutoSaveIndicator = React.forwardRef<
  HTMLDivElement,
  AutoSaveIndicatorProps
>(({
  status,
  lastSaved,
  error,
  className,
  showText = true,
  showTimestamp = true,
  compact = false,
  position = 'inline',
  ...props
}, ref) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  const [currentTime, setCurrentTime] = React.useState(new Date());

  // Update current time every minute to keep timestamps fresh
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const timestampText = lastSaved ? formatTimestamp(lastSaved) : null;

  const positionClasses = {
    'top-left': 'fixed top-4 left-4 z-50',
    'top-right': 'fixed top-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'inline': ''
  };

  return (
    <div
      ref={ref}
      className={cn(
        "auto-save-indicator",
        "flex items-center gap-2 px-3 py-2 rounded-md border transition-all duration-200",
        config.bgColor,
        config.color,
        compact && "px-2 py-1 text-sm",
        position !== 'inline' && positionClasses[position],
        position !== 'inline' && "shadow-lg border-border/20",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={config.ariaLabel}
      {...props}
    >
      <Icon
        size={compact ? 14 : 16}
        className={cn(
          "flex-shrink-0",
          config.animate && "animate-spin"
        )}
        aria-hidden="true"
      />
      
      {showText && !compact && (
        <span className="font-medium text-sm">
          {config.text}
        </span>
      )}
      
      {status === 'error' && error && (
        <span className="text-xs text-red-500 max-w-48 truncate" title={error.message}>
          {error.message}
        </span>
      )}
      
      {showTimestamp && lastSaved && status === 'saved' && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock size={12} aria-hidden="true" />
          <span>{timestampText}</span>
        </div>
      )}
    </div>
  );
});

AutoSaveIndicator.displayName = "AutoSaveIndicator";

// Floating auto-save indicator that can be used anywhere
export interface FloatingAutoSaveProps extends AutoSaveIndicatorProps {
  show?: boolean;
  hideDelay?: number;
  onHide?: () => void;
}

export const FloatingAutoSave: React.FC<FloatingAutoSaveProps> = ({
  show = true,
  hideDelay = 3000,
  onHide,
  status,
  ...props
}) => {
  const [isVisible, setIsVisible] = React.useState(show);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    setIsVisible(show);
    
    if (show && status === 'saved' && hideDelay > 0) {
      // Auto-hide after delay for success status
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        onHide?.();
      }, hideDelay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [show, status, hideDelay, onHide]);

  if (!isVisible) return null;

  return (
    <AutoSaveIndicator
      status={status}
      position="bottom-right"
      className={cn(
        "transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
      {...props}
    />
  );
};

// Compact status badge for form headers
export const AutoSaveStatusBadge: React.FC<{
  status: AutoSaveStatus;
  className?: string;
}> = ({ status, className }) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        config.bgColor,
        config.color,
        className
      )}
      role="status"
      aria-label={config.ariaLabel}
    >
      <Icon 
        size={12} 
        className={cn(config.animate && "animate-spin")}
        aria-hidden="true"
      />
      {config.text}
    </div>
  );
};

// Hook for managing auto-save indicator state
export function useAutoSaveIndicator(
  status: AutoSaveStatus,
  options: {
    showFloating?: boolean;
    hideSuccessAfter?: number;
    position?: FloatingAutoSaveProps['position'];
  } = {}
) {
  const {
    showFloating = false,
    hideSuccessAfter = 3000,
    position = 'bottom-right'
  } = options;

  const [showIndicator, setShowIndicator] = React.useState(false);

  React.useEffect(() => {
    if (status === 'saving' || status === 'error') {
      setShowIndicator(true);
    } else if (status === 'saved') {
      setShowIndicator(true);
      // Auto-hide success after delay
      const timeout = setTimeout(() => {
        setShowIndicator(false);
      }, hideSuccessAfter);
      
      return () => clearTimeout(timeout);
    }
  }, [status, hideSuccessAfter]);

  const hideIndicator = React.useCallback(() => {
    setShowIndicator(false);
  }, []);

  const IndicatorComponent = React.useMemo(() => {
    if (!showFloating) return null;
    
    return (
      <FloatingAutoSave
        status={status}
        show={showIndicator}
        position={position}
        onHide={hideIndicator}
      />
    );
  }, [showFloating, status, showIndicator, position, hideIndicator]);

  return {
    showIndicator,
    hideIndicator,
    IndicatorComponent
  };
}

export default AutoSaveIndicator;