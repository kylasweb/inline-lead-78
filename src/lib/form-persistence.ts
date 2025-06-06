import { type FieldValues } from 'react-hook-form';

export interface FormPersistenceOptions {
  key: string;
  storage?: 'localStorage' | 'sessionStorage' | 'indexedDB';
  encrypt?: boolean;
  compress?: boolean;
  expiration?: number; // milliseconds
  version?: string;
}

export interface PersistedData<T = any> {
  data: T;
  timestamp: number;
  version?: string;
  checksum?: string;
}

export interface FormPersistenceManager<T extends FieldValues = FieldValues> {
  save: (data: T, options?: Partial<FormPersistenceOptions>) => Promise<boolean>;
  load: () => Promise<T | null>;
  remove: () => Promise<boolean>;
  exists: () => Promise<boolean>;
  isExpired: () => Promise<boolean>;
  getMetadata: () => Promise<{ timestamp: number; version?: string; size: number } | null>;
  clear: () => Promise<boolean>;
}

// Simple checksum function for data integrity
function simpleChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

// Simple compression using run-length encoding for JSON
function compressJson(data: string): string {
  return JSON.stringify(data).replace(/(.)\1+/g, (match, char) => {
    return `${char}*${match.length}`;
  });
}

function decompressJson(data: string): string {
  const parsed = JSON.parse(data);
  return parsed.replace(/(.)\*(\d+)/g, (match, char, count) => {
    return char.repeat(parseInt(count, 10));
  });
}

// Simple encryption (XOR cipher - not secure, just obfuscation)
function simpleEncrypt(data: string, key: string = 'form-data'): string {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(
      data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(result);
}

function simpleDecrypt(data: string, key: string = 'form-data'): string {
  const decoded = atob(data);
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(
      decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
}

// IndexedDB helper functions
class IndexedDBHelper {
  private dbName = 'FormPersistence';
  private version = 1;
  private storeName = 'forms';

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  async get(key: string): Promise<any> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.value);
    });
  }

  async set(key: string, value: any): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ key, value });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  async clear(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Main form persistence manager
export function createFormPersistenceManager<T extends FieldValues = FieldValues>(
  options: FormPersistenceOptions
): FormPersistenceManager<T> {
  const {
    key,
    storage = 'localStorage',
    encrypt = false,
    compress = false,
    expiration,
    version = '1.0',
  } = options;

  const indexedDB = storage === 'indexedDB' ? new IndexedDBHelper() : null;

  const getStorageKey = () => `form:${key}`;

  const getStorage = () => {
    if (storage === 'sessionStorage') return sessionStorage;
    if (storage === 'localStorage') return localStorage;
    return null; // IndexedDB handled separately
  };

  const processData = (data: T): string => {
    const persistedData: PersistedData<T> = {
      data,
      timestamp: Date.now(),
      version,
    };

    let jsonString = JSON.stringify(persistedData);
    
    if (compress) {
      jsonString = compressJson(jsonString);
    }
    
    if (encrypt) {
      jsonString = simpleEncrypt(jsonString, key);
    }
    
    // Add checksum for integrity
    persistedData.checksum = simpleChecksum(jsonString);
    
    return JSON.stringify(persistedData);
  };

  const unprocessData = (rawData: string): T | null => {
    try {
      let data = rawData;
      
      if (encrypt) {
        data = simpleDecrypt(data, key);
      }
      
      if (compress) {
        data = decompressJson(data);
      }
      
      const persistedData: PersistedData<T> = JSON.parse(data);
      
      // Verify checksum if present
      if (persistedData.checksum) {
        const expectedChecksum = simpleChecksum(data);
        if (expectedChecksum !== persistedData.checksum) {
          console.warn('Form data checksum mismatch, data may be corrupted');
        }
      }
      
      // Check expiration
      if (expiration && Date.now() - persistedData.timestamp > expiration) {
        return null;
      }
      
      return persistedData.data;
    } catch (error) {
      console.error('Failed to unprocess form data:', error);
      return null;
    }
  };

  const save = async (data: T, overrideOptions?: Partial<FormPersistenceOptions>): Promise<boolean> => {
    try {
      const processedData = processData(data);
      const storageKey = getStorageKey();

      if (storage === 'indexedDB' && indexedDB) {
        await indexedDB.set(storageKey, processedData);
      } else {
        const storageInstance = getStorage();
        if (storageInstance) {
          storageInstance.setItem(storageKey, processedData);
        } else {
          throw new Error('Storage not available');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to save form data:', error);
      return false;
    }
  };

  const load = async (): Promise<T | null> => {
    try {
      const storageKey = getStorageKey();
      let rawData: string | null = null;

      if (storage === 'indexedDB' && indexedDB) {
        rawData = await indexedDB.get(storageKey);
      } else {
        const storageInstance = getStorage();
        if (storageInstance) {
          rawData = storageInstance.getItem(storageKey);
        }
      }

      if (!rawData) return null;
      
      return unprocessData(rawData);
    } catch (error) {
      console.error('Failed to load form data:', error);
      return null;
    }
  };

  const remove = async (): Promise<boolean> => {
    try {
      const storageKey = getStorageKey();

      if (storage === 'indexedDB' && indexedDB) {
        await indexedDB.delete(storageKey);
      } else {
        const storageInstance = getStorage();
        if (storageInstance) {
          storageInstance.removeItem(storageKey);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to remove form data:', error);
      return false;
    }
  };

  const exists = async (): Promise<boolean> => {
    try {
      const storageKey = getStorageKey();

      if (storage === 'indexedDB' && indexedDB) {
        return await indexedDB.has(storageKey);
      } else {
        const storageInstance = getStorage();
        if (storageInstance) {
          return storageInstance.getItem(storageKey) !== null;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to check form data existence:', error);
      return false;
    }
  };

  const isExpired = async (): Promise<boolean> => {
    if (!expiration) return false;
    
    try {
      const data = await load();
      return data === null; // If load returns null due to expiration, it's expired
    } catch (error) {
      return true; // Consider it expired if we can't check
    }
  };

  const getMetadata = async (): Promise<{ timestamp: number; version?: string; size: number } | null> => {
    try {
      const storageKey = getStorageKey();
      let rawData: string | null = null;

      if (storage === 'indexedDB' && indexedDB) {
        rawData = await indexedDB.get(storageKey);
      } else {
        const storageInstance = getStorage();
        if (storageInstance) {
          rawData = storageInstance.getItem(storageKey);
        }
      }

      if (!rawData) return null;

      const persistedData: PersistedData = JSON.parse(rawData);
      
      return {
        timestamp: persistedData.timestamp,
        version: persistedData.version,
        size: new Blob([rawData]).size,
      };
    } catch (error) {
      console.error('Failed to get form data metadata:', error);
      return null;
    }
  };

  const clear = async (): Promise<boolean> => {
    try {
      if (storage === 'indexedDB' && indexedDB) {
        await indexedDB.clear();
      } else {
        const storageInstance = getStorage();
        if (storageInstance) {
          // Clear all form data for this storage
          const keysToRemove: string[] = [];
          for (let i = 0; i < storageInstance.length; i++) {
            const key = storageInstance.key(i);
            if (key?.startsWith('form:')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => storageInstance.removeItem(key));
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to clear form data:', error);
      return false;
    }
  };

  return {
    save,
    load,
    remove,
    exists,
    isExpired,
    getMetadata,
    clear,
  };
}

// Utility function to migrate data between storage types
export async function migrateFormData<T extends FieldValues = FieldValues>(
  fromManager: FormPersistenceManager<T>,
  toManager: FormPersistenceManager<T>
): Promise<boolean> {
  try {
    const data = await fromManager.load();
    if (data) {
      const success = await toManager.save(data);
      if (success) {
        await fromManager.remove();
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Failed to migrate form data:', error);
    return false;
  }
}

// Utility function to get storage usage
export function getStorageUsage(storage: 'localStorage' | 'sessionStorage' = 'localStorage'): {
  used: number;
  remaining: number;
  total: number;
} {
  const storageInstance = storage === 'localStorage' ? localStorage : sessionStorage;
  
  let used = 0;
  for (let i = 0; i < storageInstance.length; i++) {
    const key = storageInstance.key(i);
    if (key) {
      const value = storageInstance.getItem(key);
      if (value) {
        used += key.length + value.length;
      }
    }
  }
  
  // Approximate storage limits (in characters)
  const total = storage === 'localStorage' ? 10 * 1024 * 1024 : 5 * 1024 * 1024; // 10MB for localStorage, 5MB for sessionStorage
  const remaining = Math.max(0, total - used);
  
  return { used, remaining, total };
}