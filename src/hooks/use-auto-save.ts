import { useCallback, useEffect, useRef, useState } from 'react';
import { type FieldValues, type UseFormReturn } from 'react-hook-form';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface AutoSaveOptions<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  saveInterval?: number; // milliseconds
  debounceDelay?: number; // milliseconds
  onSave: (data: T) => Promise<void> | void;
  onError?: (error: Error) => void;
  enabled?: boolean;
  saveOnBlur?: boolean;
  saveOnChange?: boolean;
  excludeFields?: (keyof T)[];
  includeFields?: (keyof T)[];
  transformData?: (data: T) => T;
  validateBeforeSave?: boolean;
}

export interface AutoSaveResult {
  status: AutoSaveStatus;
  lastSaved: Date | null;
  error: Error | null;
  saveNow: () => Promise<void>;
  reset: () => void;
  enable: () => void;
  disable: () => void;
  isEnabled: boolean;
}

export function useAutoSave<T extends FieldValues = FieldValues>({
  form,
  saveInterval = 30000, // 30 seconds default
  debounceDelay = 1000, // 1 second default
  onSave,
  onError,
  enabled = true,
  saveOnBlur = true,
  saveOnChange = true,
  excludeFields = [],
  includeFields,
  transformData,
  validateBeforeSave = true,
}: AutoSaveOptions<T>): AutoSaveResult {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isEnabled, setIsEnabled] = useState(enabled);

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastSavedDataRef = useRef<string>('');
  const isSavingRef = useRef(false);

  const { watch, getValues, trigger } = form;

  // Helper function to filter data based on include/exclude fields
  const filterData = useCallback((data: T): Partial<T> => {
    if (includeFields && includeFields.length > 0) {
      const filtered: Partial<T> = {};
      includeFields.forEach(field => {
        if (field in data) {
          (filtered as any)[field] = data[field];
        }
      });
      return filtered;
    }

    if (excludeFields.length > 0) {
      const filtered = { ...data };
      excludeFields.forEach(field => {
        delete filtered[field];
      });
      return filtered;
    }

    return data;
  }, [includeFields, excludeFields]);

  // Check if data has changed since last save
  const hasDataChanged = useCallback((currentData: T): boolean => {
    const filteredData = filterData(currentData);
    const transformedData = transformData ? transformData(filteredData as T) : filteredData;
    const currentDataString = JSON.stringify(transformedData);
    return currentDataString !== lastSavedDataRef.current;
  }, [filterData, transformData]);

  // Perform the actual save operation
  const performSave = useCallback(async (): Promise<void> => {
    if (isSavingRef.current || !isEnabled) return;

    try {
      isSavingRef.current = true;
      setStatus('saving');
      setError(null);

      const currentData = getValues();
      
      // Validate before saving if required
      if (validateBeforeSave) {
        const isValid = await trigger();
        if (!isValid) {
          throw new Error('Form validation failed');
        }
      }

      // Check if data has actually changed
      if (!hasDataChanged(currentData)) {
        setStatus('saved');
        return;
      }

      const filteredData = filterData(currentData);
      const dataToSave = transformData ? transformData(filteredData as T) : filteredData;

      await onSave(dataToSave as T);

      // Update last saved data reference
      lastSavedDataRef.current = JSON.stringify(dataToSave);
      setLastSaved(new Date());
      setStatus('saved');

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Save failed');
      setError(error);
      setStatus('error');
      onError?.(error);
    } finally {
      isSavingRef.current = false;
    }
  }, [getValues, trigger, validateBeforeSave, hasDataChanged, filterData, transformData, onSave, onError, isEnabled]);

  // Debounced save function
  const debouncedSave = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      performSave();
    }, debounceDelay);
  }, [performSave, debounceDelay]);

  // Manual save function
  const saveNow = useCallback(async (): Promise<void> => {
    // Clear any pending debounced saves
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    await performSave();
  }, [performSave]);

  // Reset function
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setLastSaved(null);
    lastSavedDataRef.current = '';
  }, []);

  // Enable/disable functions
  const enable = useCallback(() => setIsEnabled(true), []);
  const disable = useCallback(() => setIsEnabled(false), []);

  // Watch for form changes and trigger debounced save
  useEffect(() => {
    if (!isEnabled || !saveOnChange) return;

    const subscription = watch((data) => {
      if (hasDataChanged(data as T)) {
        debouncedSave();
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, hasDataChanged, debouncedSave, isEnabled, saveOnChange]);

  // Set up periodic auto-save
  useEffect(() => {
    if (!isEnabled || saveInterval <= 0) return;

    intervalRef.current = setInterval(() => {
      const currentData = getValues();
      if (hasDataChanged(currentData)) {
        performSave();
      }
    }, saveInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isEnabled, saveInterval, getValues, hasDataChanged, performSave]);

  // Save on window blur/beforeunload if enabled
  useEffect(() => {
    if (!isEnabled || !saveOnBlur) return;

    const handleBlur = () => {
      const currentData = getValues();
      if (hasDataChanged(currentData)) {
        // Use synchronous save for blur events
        performSave();
      }
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const currentData = getValues();
      if (hasDataChanged(currentData)) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isEnabled, saveOnBlur, getValues, hasDataChanged, performSave]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    status,
    lastSaved,
    error,
    saveNow,
    reset,
    enable,
    disable,
    isEnabled,
  };
}

// Hook for managing draft versions
export interface DraftOptions<T extends FieldValues = FieldValues> {
  key: string;
  form: UseFormReturn<T>;
  autoSave?: boolean;
  saveInterval?: number;
  maxDrafts?: number;
  onDraftSaved?: (draft: T, timestamp: Date) => void;
  onDraftLoaded?: (draft: T, timestamp: Date) => void;
}

export interface DraftResult<T extends FieldValues = FieldValues> {
  saveDraft: () => void;
  loadDraft: (timestamp?: Date) => boolean;
  deleteDraft: (timestamp?: Date) => void;
  getDrafts: () => Array<{ data: T; timestamp: Date }>;
  hasDrafts: boolean;
  lastDraftTime: Date | null;
}

export function useDraftManager<T extends FieldValues = FieldValues>({
  key,
  form,
  autoSave = true,
  saveInterval = 60000, // 1 minute
  maxDrafts = 5,
  onDraftSaved,
  onDraftLoaded,
}: DraftOptions<T>): DraftResult<T> {
  const [hasDrafts, setHasDrafts] = useState(false);
  const [lastDraftTime, setLastDraftTime] = useState<Date | null>(null);

  const getDraftKey = useCallback((timestamp?: Date) => {
    const time = timestamp || new Date();
    return `draft:${key}:${time.getTime()}`;
  }, [key]);

  const getDrafts = useCallback((): Array<{ data: T; timestamp: Date }> => {
    const drafts: Array<{ data: T; timestamp: Date }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey?.startsWith(`draft:${key}:`)) {
        try {
          const data = JSON.parse(localStorage.getItem(storageKey) || '');
          const timestamp = new Date(parseInt(storageKey.split(':')[2]));
          drafts.push({ data, timestamp });
        } catch (error) {
          // Invalid draft, remove it
          localStorage.removeItem(storageKey);
        }
      }
    }

    return drafts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [key]);

  const saveDraft = useCallback(() => {
    const data = form.getValues();
    const timestamp = new Date();
    const draftKey = getDraftKey(timestamp);

    try {
      localStorage.setItem(draftKey, JSON.stringify(data));
      
      // Clean up old drafts
      const drafts = getDrafts();
      if (drafts.length > maxDrafts) {
        const draftsToRemove = drafts.slice(maxDrafts);
        draftsToRemove.forEach(draft => {
          localStorage.removeItem(getDraftKey(draft.timestamp));
        });
      }

      setLastDraftTime(timestamp);
      setHasDrafts(true);
      onDraftSaved?.(data, timestamp);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [form, getDraftKey, getDrafts, maxDrafts, onDraftSaved]);

  const loadDraft = useCallback((timestamp?: Date): boolean => {
    try {
      let draftToLoad;
      
      if (timestamp) {
        const draftKey = getDraftKey(timestamp);
        const data = localStorage.getItem(draftKey);
        if (data) {
          draftToLoad = { data: JSON.parse(data), timestamp };
        }
      } else {
        // Load most recent draft
        const drafts = getDrafts();
        draftToLoad = drafts[0];
      }

      if (draftToLoad) {
        form.reset(draftToLoad.data);
        onDraftLoaded?.(draftToLoad.data, draftToLoad.timestamp);
        return true;
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    
    return false;
  }, [form, getDraftKey, getDrafts, onDraftLoaded]);

  const deleteDraft = useCallback((timestamp?: Date) => {
    if (timestamp) {
      const draftKey = getDraftKey(timestamp);
      localStorage.removeItem(draftKey);
    } else {
      // Delete all drafts for this key
      const drafts = getDrafts();
      drafts.forEach(draft => {
        localStorage.removeItem(getDraftKey(draft.timestamp));
      });
    }

    const remainingDrafts = getDrafts();
    setHasDrafts(remainingDrafts.length > 0);
    setLastDraftTime(remainingDrafts.length > 0 ? remainingDrafts[0].timestamp : null);
  }, [getDraftKey, getDrafts]);

  // Auto-save draft
  useEffect(() => {
    if (!autoSave || saveInterval <= 0) return;

    const interval = setInterval(saveDraft, saveInterval);
    return () => clearInterval(interval);
  }, [autoSave, saveInterval, saveDraft]);

  // Check for existing drafts on mount
  useEffect(() => {
    const drafts = getDrafts();
    setHasDrafts(drafts.length > 0);
    setLastDraftTime(drafts.length > 0 ? drafts[0].timestamp : null);
  }, [getDrafts]);

  return {
    saveDraft,
    loadDraft,
    deleteDraft,
    getDrafts,
    hasDrafts,
    lastDraftTime,
  };
}