import { useCallback, useEffect, useRef, useState } from 'react';
import { type FieldValues, type UseFormReturn } from 'react-hook-form';
import {
  announceToScreenReader,
  createFieldLabels,
  focusManager,
  liveRegionManager,
  prefersReducedMotion,
  isHighContrastMode,
  type AriaAttributes,
} from '@/lib/accessibility-utils';

export interface AccessibilityOptions<T extends FieldValues = FieldValues> {
  form?: UseFormReturn<T>;
  announceErrors?: boolean;
  announceSuccess?: boolean;
  announceChanges?: boolean;
  focusFirstError?: boolean;
  manageFocus?: boolean;
  keyboardNavigation?: boolean;
  announceDelay?: number;
  liveRegion?: string;
  errorRegion?: string;
}

export interface AccessibilityResult {
  // Announcement functions
  announceError: (message: string) => void;
  announceSuccess: (message: string) => void;
  announceChange: (message: string) => void;
  announceCustom: (message: string, priority?: 'polite' | 'assertive') => void;
  
  // Focus management
  saveFocus: () => void;
  restoreFocus: () => void;
  focusFirstError: () => boolean;
  focusElement: (element: HTMLElement) => void;
  
  // Field labeling
  getFieldProps: (fieldName: string, options?: {
    label?: string;
    description?: string;
    required?: boolean;
    error?: string;
  }) => {
    id: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    'aria-required'?: boolean;
    'aria-invalid'?: boolean;
  };
  
  // Keyboard navigation
  handleKeyDown: (event: KeyboardEvent) => boolean;
  
  // State
  isHighContrast: boolean;
  reduceMotion: boolean;
  isUsingKeyboard: boolean;
  
  // Utilities
  createAriaAttributes: (options: AriaAttributes) => AriaAttributes;
}

export function useAccessibility<T extends FieldValues = FieldValues>({
  form,
  announceErrors = true,
  announceSuccess = true,
  announceChanges = false,
  focusFirstError: autoFocusFirstError = true,
  manageFocus = true,
  keyboardNavigation = true,
  announceDelay = 100,
  liveRegion = 'form-announcements',
  errorRegion = 'form-errors',
}: AccessibilityOptions<T> = {}): AccessibilityResult {
  
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isUsingKeyboard, setIsUsingKeyboard] = useState(false);
  
  const fieldIds = useRef<Map<string, string>>(new Map());
  const previousErrors = useRef<Record<string, string>>({});
  
  // Initialize accessibility detection
  useEffect(() => {
    setIsHighContrast(isHighContrastMode());
    setReduceMotion(prefersReducedMotion());
    
    // Listen for high contrast changes
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const handleHighContrastChange = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
    highContrastQuery.addListener(handleHighContrastChange);
    
    // Listen for reduced motion changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    motionQuery.addListener(handleMotionChange);
    
    // Keyboard navigation detection
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setIsUsingKeyboard(true);
        document.body.classList.add('keyboard-navigation');
      }
    };
    
    const handleMouseDown = () => {
      setIsUsingKeyboard(false);
      document.body.classList.remove('keyboard-navigation');
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      highContrastQuery.removeListener(handleHighContrastChange);
      motionQuery.removeListener(handleMotionChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
  
  // Monitor form errors and announce them
  useEffect(() => {
    if (!form || !announceErrors) return;
    
    const { formState } = form;
    const currentErrors = formState.errors;
    
    // Check for new errors
    Object.entries(currentErrors).forEach(([field, error]) => {
      const errorMessage = typeof error?.message === 'string' ? error.message : 'Invalid value';
      const previousError = previousErrors.current[field];
      
      if (errorMessage !== previousError) {
        // Delay announcement to avoid overwhelming screen readers
        setTimeout(() => {
          liveRegionManager.announce(errorRegion, `Error in ${field}: ${errorMessage}`, 0);
        }, announceDelay);
      }
    });
    
    // Update previous errors
    previousErrors.current = Object.fromEntries(
      Object.entries(currentErrors).map(([field, error]) => [
        field,
        typeof error?.message === 'string' ? error.message : 'Invalid value'
      ])
    );
    
    // Focus first error if enabled
    if (autoFocusFirstError && Object.keys(currentErrors).length > 0) {
      setTimeout(() => {
        focusManager.focusFirstError();
      }, announceDelay);
    }
  }, [form, announceErrors, autoFocusFirstError, announceDelay, errorRegion]);
  
  // Announcement functions
  const announceError = useCallback((message: string) => {
    liveRegionManager.announce(errorRegion, message);
    if (announceErrors) {
      announceToScreenReader(`Error: ${message}`, 'assertive');
    }
  }, [announceErrors, errorRegion]);
  
  const announceSuccessFunc = useCallback((message: string) => {
    if (announceSuccess) {
      liveRegionManager.announce(liveRegion, message);
      announceToScreenReader(`Success: ${message}`, 'polite');
    }
  }, [announceSuccess, liveRegion]);
  
  const announceChange = useCallback((message: string) => {
    if (announceChanges) {
      liveRegionManager.announce(liveRegion, message);
    }
  }, [announceChanges, liveRegion]);
  
  const announceCustom = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const region = priority === 'assertive' ? errorRegion : liveRegion;
    liveRegionManager.announce(region, message);
    announceToScreenReader(message, priority);
  }, [liveRegion, errorRegion]);
  
  // Focus management functions
  const saveFocus = useCallback(() => {
    if (manageFocus) {
      focusManager.saveFocus();
    }
  }, [manageFocus]);
  
  const restoreFocus = useCallback(() => {
    if (manageFocus) {
      focusManager.restoreFocus();
    }
  }, [manageFocus]);
  
  const focusFirstErrorField = useCallback((): boolean => {
    return focusManager.focusFirstError();
  }, []);
  
  const focusElement = useCallback((element: HTMLElement) => {
    if (manageFocus) {
      element.focus();
      element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    }
  }, [manageFocus, reduceMotion]);
  
  // Generate or get field ID
  const getFieldId = useCallback((fieldName: string): string => {
    if (!fieldIds.current.has(fieldName)) {
      fieldIds.current.set(fieldName, `field-${fieldName}-${Math.random().toString(36).substr(2, 9)}`);
    }
    return fieldIds.current.get(fieldName)!;
  }, []);
  
  // Get field props with proper ARIA attributes
  const getFieldProps = useCallback((
    fieldName: string,
    options: {
      label?: string;
      description?: string;
      required?: boolean;
      error?: string;
    } = {}
  ) => {
    const fieldId = getFieldId(fieldName);
    const { label, description, required = false, error } = options;
    
    const labelProps = createFieldLabels(
      fieldId,
      label || fieldName,
      description,
      error
    );
    
    return {
      id: fieldId,
      'aria-label': label,
      ...labelProps,
      'aria-required': required,
    };
  }, [getFieldId]);
  
  // Keyboard navigation handler
  const handleKeyDown = useCallback((event: KeyboardEvent): boolean => {
    if (!keyboardNavigation) return false;
    
    const target = event.target as HTMLElement;
    
    // Handle form-specific keyboard shortcuts
    switch (event.key) {
      case 'Escape': {
        // Close modals, dropdowns, etc.
        const openElements = document.querySelectorAll('[aria-expanded="true"]');
        if (openElements.length > 0) {
          event.preventDefault();
          (openElements[0] as HTMLElement).click();
          return true;
        }
        break;
      }
        
      case 'F6': {
        // Move to next section (accessibility standard)
        event.preventDefault();
        const sections = document.querySelectorAll('[role="region"], section, main, aside');
        const currentIndex = Array.from(sections).findIndex(section =>
          section.contains(target)
        );
        const nextSection = sections[currentIndex + 1] || sections[0];
        if (nextSection) {
          (nextSection as HTMLElement).focus();
        }
        return true;
      }
        
      case 'F7': {
        // Move to previous section
        event.preventDefault();
        const allSections = document.querySelectorAll('[role="region"], section, main, aside');
        const currentIdx = Array.from(allSections).findIndex(section =>
          section.contains(target)
        );
        const prevSection = allSections[currentIdx - 1] || allSections[allSections.length - 1];
        if (prevSection) {
          (prevSection as HTMLElement).focus();
        }
        return true;
      }
        
      default:
        return false;
    }
    
    return false;
  }, [keyboardNavigation]);
  
  // Create ARIA attributes helper
  const createAriaAttributes = useCallback((options: AriaAttributes): AriaAttributes => {
    const attributes: AriaAttributes = { ...options };
    
    // Apply high contrast adjustments if needed
    if (isHighContrast) {
      // High contrast mode specific adjustments
      if (attributes['aria-live']) {
        // Make announcements more prominent in high contrast
        attributes['aria-live'] = 'assertive';
      }
    }
    
    return attributes;
  }, [isHighContrast]);
  
  // Initialize live regions if they don't exist
  useEffect(() => {
    liveRegionManager.createRegion(liveRegion, 'polite');
    liveRegionManager.createRegion(errorRegion, 'assertive');
  }, [liveRegion, errorRegion]);
  
  return {
    // Announcement functions
    announceError,
    announceSuccess: announceSuccessFunc,
    announceChange,
    announceCustom,
    
    // Focus management
    saveFocus,
    restoreFocus,
    focusFirstError: focusFirstErrorField,
    focusElement,
    
    // Field props
    getFieldProps,
    
    // Keyboard navigation
    handleKeyDown,
    
    // State
    isHighContrast,
    reduceMotion,
    isUsingKeyboard,
    
    // Utilities
    createAriaAttributes,
  };
}

// Specialized hook for form accessibility
export function useFormAccessibility<T extends FieldValues = FieldValues>(
  form: UseFormReturn<T>,
  options: Omit<AccessibilityOptions<T>, 'form'> = {}
) {
  return useAccessibility({ ...options, form });
}

// Hook for managing live announcements
export function useLiveAnnouncements() {
  const announcePolite = useCallback((message: string) => {
    announceToScreenReader(message, 'polite');
  }, []);
  
  const announceAssertive = useCallback((message: string) => {
    announceToScreenReader(message, 'assertive');
  }, []);
  
  const announceFormChange = useCallback((fieldName: string, newValue: string) => {
    announcePolite(`${fieldName} changed to ${newValue}`);
  }, [announcePolite]);
  
  const announceValidationError = useCallback((fieldName: string, error: string) => {
    announceAssertive(`Error in ${fieldName}: ${error}`);
  }, [announceAssertive]);
  
  const announceFormSubmission = useCallback((success: boolean, message?: string) => {
    if (success) {
      announcePolite(message || 'Form submitted successfully');
    } else {
      announceAssertive(message || 'Form submission failed');
    }
  }, [announcePolite, announceAssertive]);
  
  return {
    announcePolite,
    announceAssertive,
    announceFormChange,
    announceValidationError,
    announceFormSubmission,
  };
}

// Hook for keyboard navigation in lists/grids
export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  itemSelector: string = '[role="option"], [role="menuitem"], [role="gridcell"]',
  options: {
    wrap?: boolean;
    orientation?: 'horizontal' | 'vertical' | 'both';
    onActivate?: (element: HTMLElement) => void;
  } = {}
) {
  const { wrap = true, orientation = 'vertical', onActivate } = options;
  const [currentIndex, setCurrentIndex] = useState(-1);
  const itemsRef = useRef<HTMLElement[]>([]);
  
  // Update items list
  const updateItems = useCallback(() => {
    if (containerRef.current) {
      itemsRef.current = Array.from(containerRef.current.querySelectorAll(itemSelector));
    }
  }, [containerRef, itemSelector]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    updateItems();
    const items = itemsRef.current;
    if (items.length === 0) return false;
    
    let newIndex = currentIndex;
    let handled = false;
    
    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = wrap ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1);
          handled = true;
        }
        break;
        
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = wrap ? (currentIndex - 1 + items.length) % items.length : Math.max(currentIndex - 1, 0);
          handled = true;
        }
        break;
        
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = wrap ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1);
          handled = true;
        }
        break;
        
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = wrap ? (currentIndex - 1 + items.length) % items.length : Math.max(currentIndex - 1, 0);
          handled = true;
        }
        break;
        
      case 'Home':
        newIndex = 0;
        handled = true;
        break;
        
      case 'End':
        newIndex = items.length - 1;
        handled = true;
        break;
        
      case 'Enter':
      case ' ':
        if (currentIndex >= 0 && items[currentIndex]) {
          event.preventDefault();
          onActivate?.(items[currentIndex]);
          return true;
        }
        break;
    }
    
    if (handled && newIndex !== currentIndex) {
      event.preventDefault();
      setCurrentIndex(newIndex);
      items[newIndex]?.focus();
      return true;
    }
    
    return false;
  }, [currentIndex, orientation, wrap, onActivate, updateItems]);
  
  return {
    currentIndex,
    setCurrentIndex,
    handleKeyDown,
    updateItems,
  };
}