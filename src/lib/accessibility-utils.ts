import { type RefObject } from 'react';

export type AriaRole = 
  | 'alert' | 'alertdialog' | 'application' | 'article' | 'banner' | 'button'
  | 'cell' | 'checkbox' | 'columnheader' | 'combobox' | 'complementary'
  | 'contentinfo' | 'definition' | 'dialog' | 'directory' | 'document'
  | 'feed' | 'figure' | 'form' | 'grid' | 'gridcell' | 'group' | 'heading'
  | 'img' | 'link' | 'list' | 'listbox' | 'listitem' | 'log' | 'main'
  | 'marquee' | 'math' | 'menu' | 'menubar' | 'menuitem' | 'menuitemcheckbox'
  | 'menuitemradio' | 'navigation' | 'none' | 'note' | 'option' | 'presentation'
  | 'progressbar' | 'radio' | 'radiogroup' | 'region' | 'row' | 'rowgroup'
  | 'rowheader' | 'scrollbar' | 'search' | 'searchbox' | 'separator'
  | 'slider' | 'spinbutton' | 'status' | 'switch' | 'tab' | 'table'
  | 'tablist' | 'tabpanel' | 'term' | 'textbox' | 'timer' | 'toolbar'
  | 'tooltip' | 'tree' | 'treegrid' | 'treeitem';

export interface AriaAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean | 'mixed';
  'aria-disabled'?: boolean;
  'aria-hidden'?: boolean;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-controls'?: string;
  'aria-owns'?: string;
  'aria-flowto'?: string;
  'aria-activedescendant'?: string;
  'aria-level'?: number;
  'aria-setsize'?: number;
  'aria-posinset'?: number;
  'aria-multiline'?: boolean;
  'aria-multiselectable'?: boolean;
  'aria-orientation'?: 'horizontal' | 'vertical';
  'aria-readonly'?: boolean;
  'aria-sort'?: 'ascending' | 'descending' | 'none' | 'other';
  'aria-valuemax'?: number;
  'aria-valuemin'?: number;
  'aria-valuenow'?: number;
  'aria-valuetext'?: string;
  role?: AriaRole;
}

// Generate unique IDs for form elements
let idCounter = 0;
export function generateId(prefix: string = 'form-element'): string {
  return `${prefix}-${++idCounter}`;
}

// Announce messages to screen readers
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite',
  timeout: number = 5000
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.style.cssText = `
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `;
  
  document.body.appendChild(announcement);
  
  // Small delay to ensure screen readers pick up the change
  setTimeout(() => {
    announcement.textContent = message;
  }, 100);
  
  // Remove after timeout
  setTimeout(() => {
    if (announcement.parentNode) {
      announcement.parentNode.removeChild(announcement);
    }
  }, timeout);
}

// Focus management utilities
export class FocusManager {
  private focusStack: HTMLElement[] = [];
  private tabbableSelector = [
    'a[href]:not([disabled])',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input[type="text"]:not([disabled])',
    'input[type="radio"]:not([disabled])',
    'input[type="checkbox"]:not([disabled])',
    'input[type="submit"]:not([disabled])',
    'input[type="button"]:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"]):not([disabled])',
    '[contenteditable="true"]:not([disabled])'
  ].join(',');

  // Get all focusable elements within a container
  getFocusableElements(container: HTMLElement = document.body): HTMLElement[] {
    const elements = container.querySelectorAll(this.tabbableSelector);
    return Array.from(elements).filter(element => {
      return this.isVisible(element as HTMLElement) && !this.isDisabled(element as HTMLElement);
    }) as HTMLElement[];
  }

  // Check if element is visible
  private isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    );
  }

  // Check if element is disabled
  private isDisabled(element: HTMLElement): boolean {
    return element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true';
  }

  // Focus trap within a container
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Focus first element initially
    firstElement.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  // Save current focus and focus a new element
  saveFocus(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      this.focusStack.push(activeElement);
    }
  }

  // Restore previously saved focus
  restoreFocus(): void {
    const elementToFocus = this.focusStack.pop();
    if (elementToFocus && document.contains(elementToFocus)) {
      elementToFocus.focus();
    }
  }

  // Focus first error field in a form
  focusFirstError(container: HTMLElement = document.body): boolean {
    const errorElements = container.querySelectorAll('[aria-invalid="true"], .error input, .error textarea, .error select');
    const firstError = errorElements[0] as HTMLElement;
    
    if (firstError) {
      firstError.focus();
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    }
    
    return false;
  }
}

// Keyboard navigation utilities
export class KeyboardNavigationManager {
  private currentIndex = 0;
  private items: HTMLElement[] = [];

  constructor(private container: HTMLElement, private itemSelector: string) {
    this.updateItems();
  }

  updateItems(): void {
    this.items = Array.from(this.container.querySelectorAll(this.itemSelector));
  }

  handleKeyDown(event: KeyboardEvent): boolean {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveToNext();
        return true;
      
      case 'ArrowUp':
        event.preventDefault();
        this.moveToPrevious();
        return true;
      
      case 'Home':
        event.preventDefault();
        this.moveToFirst();
        return true;
      
      case 'End':
        event.preventDefault();
        this.moveToLast();
        return true;
      
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.activateCurrent();
        return true;
      
      default:
        return false;
    }
  }

  private moveToNext(): void {
    this.currentIndex = (this.currentIndex + 1) % this.items.length;
    this.focusCurrent();
  }

  private moveToPrevious(): void {
    this.currentIndex = this.currentIndex === 0 ? this.items.length - 1 : this.currentIndex - 1;
    this.focusCurrent();
  }

  private moveToFirst(): void {
    this.currentIndex = 0;
    this.focusCurrent();
  }

  private moveToLast(): void {
    this.currentIndex = this.items.length - 1;
    this.focusCurrent();
  }

  private focusCurrent(): void {
    if (this.items[this.currentIndex]) {
      this.items[this.currentIndex].focus();
    }
  }

  private activateCurrent(): void {
    if (this.items[this.currentIndex]) {
      this.items[this.currentIndex].click();
    }
  }
}

// High contrast mode detection
export function isHighContrastMode(): boolean {
  // Create a test element to detect high contrast mode
  const testElement = document.createElement('div');
  testElement.style.cssText = `
    position: absolute;
    left: -9999px;
    background-color: rgb(31, 32, 33);
    color: rgb(255, 255, 255);
  `;
  
  document.body.appendChild(testElement);
  
  const computedStyle = window.getComputedStyle(testElement);
  const isHighContrast = (
    computedStyle.backgroundColor !== 'rgb(31, 32, 33)' ||
    computedStyle.color !== 'rgb(255, 255, 255)'
  );
  
  document.body.removeChild(testElement);
  return isHighContrast;
}

// Reduced motion detection
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Color contrast checking
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // Calculate relative luminance
    const getRGB = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * getRGB(r) + 0.7152 * getRGB(g) + 0.0722 * getRGB(b);
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

export function isContrastSufficient(color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean {
  const ratio = getContrastRatio(color1, color2);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
}

// Form field labeling utilities
export function createFieldLabels(fieldId: string, label: string, description?: string, errorMessage?: string): {
  labelId: string;
  descriptionId?: string;
  errorId?: string;
  'aria-labelledby': string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
} {
  const labelId = `${fieldId}-label`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = errorMessage ? `${fieldId}-error` : undefined;
  
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ');
  
  return {
    labelId,
    descriptionId,
    errorId,
    'aria-labelledby': labelId,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': !!errorMessage,
  };
}

// Skip link utilities
export function createSkipLinks(targets: Array<{ id: string; label: string }>): HTMLElement {
  const skipLinksContainer = document.createElement('div');
  skipLinksContainer.className = 'skip-links';
  skipLinksContainer.style.cssText = `
    position: absolute;
    top: -40px;
    left: 6px;
    background: white;
    color: black;
    padding: 8px;
    z-index: 1000;
    text-decoration: none;
    border: 2px solid black;
  `;
  
  targets.forEach(target => {
    const link = document.createElement('a');
    link.href = `#${target.id}`;
    link.textContent = target.label;
    link.style.cssText = `
      display: block;
      margin-bottom: 4px;
      color: black;
      text-decoration: underline;
    `;
    
    link.addEventListener('focus', () => {
      skipLinksContainer.style.top = '6px';
    });
    
    link.addEventListener('blur', () => {
      skipLinksContainer.style.top = '-40px';
    });
    
    skipLinksContainer.appendChild(link);
  });
  
  return skipLinksContainer;
}

// ARIA live region manager
export class LiveRegionManager {
  private regions: Map<string, HTMLElement> = new Map();

  createRegion(id: string, level: 'polite' | 'assertive' = 'polite'): HTMLElement {
    const existing = this.regions.get(id);
    if (existing) return existing;
    
    const region = document.createElement('div');
    region.id = id;
    region.setAttribute('aria-live', level);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    region.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    
    document.body.appendChild(region);
    this.regions.set(id, region);
    
    return region;
  }

  announce(regionId: string, message: string, clearAfter: number = 5000): void {
    const region = this.regions.get(regionId);
    if (!region) return;
    
    region.textContent = message;
    
    if (clearAfter > 0) {
      setTimeout(() => {
        region.textContent = '';
      }, clearAfter);
    }
  }

  clear(regionId: string): void {
    const region = this.regions.get(regionId);
    if (region) {
      region.textContent = '';
    }
  }

  remove(regionId: string): void {
    const region = this.regions.get(regionId);
    if (region && region.parentNode) {
      region.parentNode.removeChild(region);
      this.regions.delete(regionId);
    }
  }

  removeAll(): void {
    this.regions.forEach((region, id) => {
      this.remove(id);
    });
  }
}

// Singleton instance
export const liveRegionManager = new LiveRegionManager();
export const focusManager = new FocusManager();

// Hook for managing focus restoration
export function useFocusRestore() {
  return {
    save: () => focusManager.saveFocus(),
    restore: () => focusManager.restoreFocus(),
  };
}

// Utility to check if user is using keyboard navigation
export function detectKeyboardNavigation(): boolean {
  let isUsingKeyboard = false;
  
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      isUsingKeyboard = true;
      document.body.classList.add('keyboard-navigation');
    }
  });
  
  document.addEventListener('mousedown', () => {
    isUsingKeyboard = false;
    document.body.classList.remove('keyboard-navigation');
  });
  
  return isUsingKeyboard;
}

// Initialize accessibility features
export function initializeAccessibility(): void {
  // Add keyboard navigation detection
  detectKeyboardNavigation();
  
  // Add high contrast detection
  if (isHighContrastMode()) {
    document.body.classList.add('high-contrast');
  }
  
  // Add reduced motion detection
  if (prefersReducedMotion()) {
    document.body.classList.add('reduced-motion');
  }
  
  // Create global live regions
  liveRegionManager.createRegion('form-announcements', 'polite');
  liveRegionManager.createRegion('form-errors', 'assertive');
}