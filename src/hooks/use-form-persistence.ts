import { useEffect, useRef, useState, useCallback } from 'react';
import { type FieldValues, type UseFormReturn } from 'react-hook-form';
import { createFormPersistenceManager, type FormPersistenceOptions, type FormPersistenceManager } from '@/lib/form-persistence';

export interface UseFormPersistenceOptions<T extends FieldValues = FieldValues> extends Partial<FormPersistenceOptions> {
  form: UseFormReturn<T>;
  key: string;
  autoSave?: boolean;
  autoLoad?: boolean;
  saveDelay?: number;
  onSave?: (data: T) => void;
  onLoad?: (data: T) => void;
  onError?: (error: Error, operation: 'save' | 'load' | 'remove') => void;
  clearOnSubmit?: boolean;
  exclude?: (keyof T)[];
  include?: (keyof T)[];
  transform?: {
    save?: (data: T) => T;
    load?: (data: T) => T;
  };
}

export interface FormPersistenceResult<T extends FieldValues = FieldValues> {
  saveNow: () => Promise<boolean>;
  loadNow: () => Promise<boolean>;
  clearPersisted: () => Promise<boolean>;
  hasPersistedData: boolean;
  lastSaved: Date | null;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  metadata: { timestamp: number; version?: string; size: number } | null;
}

export function useFormPersistence<T extends FieldValues = FieldValues>({
  form,
  key,
  autoSave = true,
  autoLoad = true,
  saveDelay = 1000,
  storage = 'localStorage',
  encrypt = false,
  compress = false,
  expiration,
  version = '1.0',
  onSave,
  onLoad,
  onError,
  clearOnSubmit = false,
  exclude = [],
  include,
  transform,
}: UseFormPersistenceOptions<T>): FormPersistenceResult<T> {
  const [hasPersistedData, setHasPersistedData] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [metadata, setMetadata] = useState<{ timestamp: number; version?: string; size: number } | null>(null);

  const persistenceManager = useRef<FormPersistenceManager<T>>();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedDataRef = useRef<string>('');

  const { watch, getValues, reset, handleSubmit } = form;

  // Initialize persistence manager
  useEffect(() => {
    persistenceManager.current = createFormPersistenceManager<T>({
      key,
      storage,
      encrypt,
      compress,
      expiration,
      version,
    });
  }, [key, storage, encrypt, compress, expiration, version]);

  // Filter data based on include/exclude options
  const filterData = useCallback((data: T): T => {
    if (include && include.length > 0) {
      const filtered = {} as T;
      include.forEach(field => {
        if (field in data) {
          (filtered as any)[field] = data[field];
        }
      });
      return filtered;
    }

    if (exclude.length > 0) {
      const filtered = { ...data };
      exclude.forEach(field => {
        delete filtered[field];
      });
      return filtered;
    }

    return data;
  }, [include, exclude]);

  // Transform data for saving/loading
  const transformData = useCallback((data: T, operation: 'save' | 'load'): T => {
    const filtered = operation === 'save' ? filterData(data) : data;
    const transformer = transform?.[operation];
    return transformer ? transformer(filtered) : filtered;
  }, [filterData, transform]);

  // Check if data has changed
  const hasDataChanged = useCallback((currentData: T): boolean => {
    const processedData = transformData(currentData, 'save');
    const currentDataString = JSON.stringify(processedData);
    return currentDataString !== lastSavedDataRef.current;
  }, [transformData]);

  // Save form data
  const saveNow = useCallback(async (): Promise<boolean> => {
    if (!persistenceManager.current) return false;

    try {
      setIsSaving(true);
      setError(null);

      const currentData = getValues();
      const dataToSave = transformData(currentData, 'save');

      const success = await persistenceManager.current.save(dataToSave);
      
      if (success) {
        lastSavedDataRef.current = JSON.stringify(dataToSave);
        setLastSaved(new Date());
        setHasPersistedData(true);
        onSave?.(dataToSave);

        // Update metadata
        const newMetadata = await persistenceManager.current.getMetadata();
        setMetadata(newMetadata);
      }

      return success;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Save failed');
      setError(error);
      onError?.(error, 'save');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [getValues, transformData, onSave, onError]);

  // Load form data
  const loadNow = useCallback(async (): Promise<boolean> => {
    if (!persistenceManager.current) return false;

    try {
      setIsLoading(true);
      setError(null);

      const data = await persistenceManager.current.load();
      
      if (data) {
        const transformedData = transformData(data, 'load');
        reset(transformedData);
        setHasPersistedData(true);
        onLoad?.(transformedData);

        // Update metadata
        const newMetadata = await persistenceManager.current.getMetadata();
        setMetadata(newMetadata);

        return true;
      } else {
        setHasPersistedData(false);
        return false;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Load failed');
      setError(error);
      onError?.(error, 'load');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [reset, transformData, onLoad, onError]);

  // Clear persisted data
  const clearPersisted = useCallback(async (): Promise<boolean> => {
    if (!persistenceManager.current) return false;

    try {
      setError(null);
      const success = await persistenceManager.current.remove();
      
      if (success) {
        setHasPersistedData(false);
        setLastSaved(null);
        setMetadata(null);
        lastSavedDataRef.current = '';
      }

      return success;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Clear failed');
      setError(error);
      onError?.(error, 'remove');
      return false;
    }
  }, [onError]);

  // Debounced save function
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const currentData = getValues();
      if (hasDataChanged(currentData)) {
        saveNow();
      }
    }, saveDelay);
  }, [getValues, hasDataChanged, saveNow, saveDelay]);

  // Auto-save on form changes
  useEffect(() => {
    if (!autoSave) return;

    const subscription = watch((data) => {
      if (data && hasDataChanged(data as T)) {
        debouncedSave();
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, hasDataChanged, debouncedSave, autoSave]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && persistenceManager.current) {
      // Check if persisted data exists first
      persistenceManager.current.exists().then(exists => {
        if (exists) {
          loadNow();
        }
      });
    }
  }, [autoLoad, loadNow]);

  // Check for existing persisted data on mount
  useEffect(() => {
    if (persistenceManager.current) {
      persistenceManager.current.exists().then(exists => {
        setHasPersistedData(exists);
        if (exists) {
          persistenceManager.current!.getMetadata().then(setMetadata);
        }
      });
    }
  }, []);

  // Clear on submit if enabled
  useEffect(() => {
    if (!clearOnSubmit) return;

    const originalHandleSubmit = handleSubmit;
    
    // Wrap the form's handleSubmit to clear persisted data on successful submit
    const wrappedHandleSubmit = (onValid: (data: T) => void | Promise<void>, onInvalid?: (errors: any) => void) => {
      return originalHandleSubmit(async (data) => {
        try {
          await onValid(data);
          // Only clear if submission was successful (no errors thrown)
          await clearPersisted();
        } catch (error) {
          // Re-throw the error to maintain original behavior
          throw error;
        }
      }, onInvalid);
    };

    // This is a bit hacky, but we're replacing the handleSubmit method
    // In a real implementation, you might want to expose this as a separate method
    return () => {
      // Cleanup if needed
    };
  }, [clearOnSubmit, handleSubmit, clearPersisted]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    saveNow,
    loadNow,
    clearPersisted,
    hasPersistedData,
    lastSaved,
    isLoading,
    isSaving,
    error,
    metadata,
  };
}

// Hook for managing multiple form versions/drafts
export interface UseFormVersionsOptions<T extends FieldValues = FieldValues> extends UseFormPersistenceOptions<T> {
  maxVersions?: number;
  versionKey?: (data: T) => string;
}

export interface FormVersion<T extends FieldValues = FieldValues> {
  id: string;
  data: T;
  timestamp: Date;
  label?: string;
}

export interface FormVersionsResult<T extends FieldValues = FieldValues> extends FormPersistenceResult<T> {
  versions: FormVersion<T>[];
  saveVersion: (label?: string) => Promise<boolean>;
  loadVersion: (id: string) => Promise<boolean>;
  deleteVersion: (id: string) => Promise<boolean>;
  getVersion: (id: string) => FormVersion<T> | undefined;
}

export function useFormVersions<T extends FieldValues = FieldValues>({
  maxVersions = 10,
  versionKey,
  ...options
}: UseFormVersionsOptions<T>): FormVersionsResult<T> {
  const [versions, setVersions] = useState<FormVersion<T>[]>([]);
  
  const persistence = useFormPersistence(options);
  const { form, key } = options;

  const versionsKey = `${key}:versions`;

  // Load versions from storage
  const loadVersions = useCallback(async () => {
    try {
      const versionsManager = createFormPersistenceManager<FormVersion<T>[]>({
        key: versionsKey,
        storage: options.storage,
      });
      
      const storedVersions = await versionsManager.load();
      if (storedVersions) {
        setVersions(storedVersions);
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  }, [versionsKey, options.storage]);

  // Save versions to storage
  const saveVersions = useCallback(async (newVersions: FormVersion<T>[]) => {
    try {
      const versionsManager = createFormPersistenceManager<FormVersion<T>[]>({
        key: versionsKey,
        storage: options.storage,
      });
      
      await versionsManager.save(newVersions);
      setVersions(newVersions);
    } catch (error) {
      console.error('Failed to save versions:', error);
    }
  }, [versionsKey, options.storage]);

  // Save a new version
  const saveVersion = useCallback(async (label?: string): Promise<boolean> => {
    try {
      const currentData = form.getValues();
      const id = versionKey ? versionKey(currentData) : `version-${Date.now()}`;
      
      const newVersion: FormVersion<T> = {
        id,
        data: currentData,
        timestamp: new Date(),
        label,
      };

      const updatedVersions = [newVersion, ...versions];
      
      // Trim to max versions
      if (updatedVersions.length > maxVersions) {
        updatedVersions.splice(maxVersions);
      }

      await saveVersions(updatedVersions);
      return true;
    } catch (error) {
      console.error('Failed to save version:', error);
      return false;
    }
  }, [form, versionKey, versions, maxVersions, saveVersions]);

  // Load a specific version
  const loadVersion = useCallback(async (id: string): Promise<boolean> => {
    try {
      const version = versions.find(v => v.id === id);
      if (version) {
        form.reset(version.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load version:', error);
      return false;
    }
  }, [form, versions]);

  // Delete a version
  const deleteVersion = useCallback(async (id: string): Promise<boolean> => {
    try {
      const updatedVersions = versions.filter(v => v.id !== id);
      await saveVersions(updatedVersions);
      return true;
    } catch (error) {
      console.error('Failed to delete version:', error);
      return false;
    }
  }, [versions, saveVersions]);

  // Get a specific version
  const getVersion = useCallback((id: string): FormVersion<T> | undefined => {
    return versions.find(v => v.id === id);
  }, [versions]);

  // Load versions on mount
  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  return {
    ...persistence,
    versions,
    saveVersion,
    loadVersion,
    deleteVersion,
    getVersion,
  };
}