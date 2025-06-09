/**
 * Utilities for handling Netlify Blob size limitations
 */
import { deflateSync, inflateSync } from 'zlib';

// Size constants (in bytes)
export const SIZE_LIMITS = {
  // Maximum payload size for Netlify Functions (6MB)
  MAX_PAYLOAD: 6 * 1024 * 1024,
  // Target chunk size for large objects (1MB)
  CHUNK_SIZE: 1 * 1024 * 1024,
  // Warning threshold (4MB)
  WARNING_THRESHOLD: 4 * 1024 * 1024,
  // Default compression threshold (10KB)
  COMPRESSION_THRESHOLD: 10 * 1024,
};

// Add auto-chunking configuration
export const CHUNKING_CONFIG = {
  // Always use chunking (even for smaller objects)
  ALWAYS_CHUNK: true,
  // Reduced chunk size for better reliability (500KB instead of 1MB)
  SAFE_CHUNK_SIZE: 500 * 1024,
  // Use compression for all objects above this size
  ALWAYS_COMPRESS_ABOVE: 50 * 1024,
  // Maximum retries for blob operations
  MAX_RETRIES: 3,
  // Delay between retries (ms)
  RETRY_DELAY: 500,
};

/**
 * Calculate the size of a serialized object
 */
export function getSerializedSize(obj: any): number {
  try {
    const serialized = JSON.stringify(obj);
    return serialized.length;
  } catch (error) {
    console.error('Error calculating object size:', error);
    // Return a large number to trigger size limit handling
    return SIZE_LIMITS.MAX_PAYLOAD + 1;
  }
}

/**
 * Compress data using zlib deflate
 */
export function compressData(data: string): Buffer {
  try {
    return deflateSync(data);
  } catch (error) {
    console.error('Compression error:', error);
    throw new Error('Failed to compress data');
  }
}

/**
 * Decompress data using zlib inflate
 */
export function decompressData(compressed: Buffer): string {
  try {
    return inflateSync(compressed).toString();
  } catch (error) {
    console.error('Decompression error:', error);
    throw new Error('Failed to decompress data');
  }
}

/**
 * Split large objects into chunks for storage
 * Always uses ultra-small request sizes to avoid Netlify Blobs errors
 */
export async function storeInChunks<T>(
  store: any, 
  id: string, 
  data: T, 
  metadataPrefix: string = '_meta'
): Promise<void> {
  const serialized = JSON.stringify(data);
  const totalSize = serialized.length;
  
  // Always use compression regardless of size
  const compressed = compressData(serialized);
  console.log(`Compressing object ${id} from ${totalSize} bytes to ${compressed.length} bytes`);
  
  // Use extremely small chunks (25KB) to ensure reliability
  const ULTRA_SMALL_CHUNK = 25 * 1024; // 25KB chunks
  
  if (compressed.length <= ULTRA_SMALL_CHUNK) {
    // If compressed data is small enough, store it directly
    await withRetry(async () => {
      await store.set(`${id}_compressed`, compressed, { type: 'buffer' });
    }, 5, `store compressed data for ${id}`);
    
    await withRetry(async () => {
      await store.set(`${metadataPrefix}_${id}`, JSON.stringify({
        type: 'compressed',
        createdAt: new Date().toISOString(),
        originalSize: totalSize,
        compressedSize: compressed.length
      }));
    }, 5, `store metadata for ${id}`);
    
    return;
  }
  
  // Chunk the compressed data into ultra-small pieces
  const chunks = [];
  for (let i = 0; i < compressed.length; i += ULTRA_SMALL_CHUNK) {
    chunks.push(compressed.slice(i, i + ULTRA_SMALL_CHUNK));
  }
  
  console.log(`Splitting compressed object (${compressed.length} bytes) into ${chunks.length} tiny chunks of ${ULTRA_SMALL_CHUNK} bytes each`);
  
  // Store metadata with retry
  const metadata = {
    type: 'compressed_chunked',
    createdAt: new Date().toISOString(),
    originalSize: totalSize,
    compressedSize: compressed.length,
    chunks: chunks.length,
    chunkSize: ULTRA_SMALL_CHUNK,
    objectId: id
  };
  
  await withRetry(async () => {
    await store.set(`${metadataPrefix}_${id}`, JSON.stringify(metadata));
  }, 5, `store metadata for ${id}`);
  
  // Store all chunks with retry and small delays between operations
  for (let i = 0; i < chunks.length; i++) {
    const chunkData = chunks[i];
    await withRetry(async () => {
      await store.set(`${id}_chunk_${i}`, chunkData, { type: 'buffer' });
    }, 5, `store chunk ${i} for ${id}`);
    
    // Add a small delay between chunks to prevent rate limiting
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  console.log(`Successfully stored ${chunks.length} tiny chunks for object ${id}`);
}

/**
 * Retrieve chunked data from blob storage with retry for better reliability
 */
export async function getFromChunks<T>(
  store: any,
  id: string,
  metadataPrefix: string = '_meta'
): Promise<T | null> {
  // First check if direct object exists
  try {
    let directObject = null;
    try {
      directObject = await withRetry(async () => {
        return await store.get(id, { type: 'json' });
      }, 5, `get direct object ${id}`);
    } catch (error) {
      // Object may be stored in chunks or compressed, continue
    }
    
    if (directObject) {
      return directObject as T;
    }
  } catch (error) {
    // Continue to other storage methods
  }

  // Check for metadata
  try {
    let metadataStr = null;
    try {
      metadataStr = await withRetry(async () => {
        return await store.get(`${metadataPrefix}_${id}`, { type: 'text' });
      }, 5, `get metadata for ${id}`);
    } catch (error) {
      console.warn(`Failed to get metadata for ${id}:`, error);
    }
    
    if (!metadataStr) {
      return null;
    }

    const metadata = JSON.parse(metadataStr);

    // Handle compressed data (single chunk)
    if (metadata.type === 'compressed') {
      const compressed = await withRetry(async () => {
        return await store.get(`${id}_compressed`, { type: 'buffer' });
      }, 5, `get compressed data for ${id}`);
      
      if (!compressed) {
        return null;
      }

      const decompressed = decompressData(compressed);
      return JSON.parse(decompressed) as T;
    }
    
    // Handle compressed chunked data (new approach with ultra-small chunks)
    if (metadata.type === 'compressed_chunked') {
      const { chunks } = metadata;
      const chunkBuffers = [];

      console.log(`Retrieving ${chunks} ultra-small chunks for ${id}`);
      
      // Serial retrieval with retries
      for (let i = 0; i < chunks; i++) {
        try {
          const chunk = await withRetry(async () => {
            return await store.get(`${id}_chunk_${i}`, { type: 'buffer' });
          }, 5, `get chunk ${i} for ${id}`);
          
          chunkBuffers.push(chunk);
        } catch (error) {
          console.error(`Failed to get chunk ${i} for ${id}:`, error);
          throw error;
        }
      }
      
      // Combine all buffer chunks
      const combinedLength = chunkBuffers.reduce((acc, chunk) => acc + chunk.length, 0);
      const fullBuffer = Buffer.alloc(combinedLength);
      let offset = 0;
      
      for (const chunk of chunkBuffers) {
        chunk.copy(fullBuffer, offset);
        offset += chunk.length;
      }
      
      // Decompress and parse
      const decompressed = decompressData(fullBuffer);
      return JSON.parse(decompressed) as T;
    }

    // Handle regular chunked data (old approach)
    if (metadata.type === 'chunked') {
      const { chunks } = metadata;
      const chunkData = [];

      // Serial retrieval with retries
      for (let i = 0; i < chunks; i++) {
        try {
          const chunk = await withRetry(async () => {
            return await store.get(`${id}_chunk_${i}`, { type: 'text' });
          }, 5, `get chunk ${i} for ${id}`);
          
          chunkData.push(chunk);
        } catch (error) {
          console.error(`Failed to get chunk ${i} for ${id}:`, error);
          throw error;
        }
      }

      const fullData = chunkData.join('');
      return JSON.parse(fullData) as T;
    }

    console.warn('Unknown metadata type:', metadata.type);
    return null;
  } catch (error) {
    console.error(`Error retrieving chunked data for ${id}:`, error);
    return null;
  }
}

/**
 * Delete chunked data including all chunks and metadata with retries
 */
export async function deleteChunkedData(
  store: any,
  id: string,
  metadataPrefix: string = '_meta'
): Promise<boolean> {
  try {
    // First try to get metadata to determine storage type
    let metadataStr = null;
    try {
      metadataStr = await withRetry(async () => {
        return await store.get(`${metadataPrefix}_${id}`, { type: 'text' });
      }, CHUNKING_CONFIG.MAX_RETRIES, `get metadata for deletion of ${id}`);
    } catch (error) {
      // If we can't get metadata, try direct deletion
    }

    if (metadataStr) {
      const metadata = JSON.parse(metadataStr);      if (metadata.type === 'compressed') {
        // Delete compressed data with retry
        await withRetry(async () => {
          await store.delete(`${id}_compressed`);
        }, CHUNKING_CONFIG.MAX_RETRIES, `delete compressed data for ${id}`);
        
        await withRetry(async () => {
          await store.delete(`${metadataPrefix}_${id}`);
        }, CHUNKING_CONFIG.MAX_RETRIES, `delete metadata for ${id}`);
      } else if (metadata.type === 'compressed_chunked') {
        // Delete all ultra-small chunks with retry
        const { chunks } = metadata;
        console.log(`Deleting ${chunks} ultra-small chunks for ${id}`);
        
        // Delete chunks one by one
        for (let i = 0; i < chunks; i++) {
          await withRetry(async () => {
            await store.delete(`${id}_chunk_${i}`);
          }, CHUNKING_CONFIG.MAX_RETRIES, `delete ultra-small chunk ${i} for ${id}`);
          
          // Add a small delay between chunk deletions to prevent rate limiting
          if (i < chunks - 1) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        
        // Delete metadata
        await withRetry(async () => {
          await store.delete(`${metadataPrefix}_${id}`);
        }, CHUNKING_CONFIG.MAX_RETRIES, `delete metadata for ${id}`);
      } else if (metadata.type === 'chunked') {
        // Delete all chunks with retry
        const { chunks } = metadata;
        
        // Delete chunks one by one
        for (let i = 0; i < chunks; i++) {
          await withRetry(async () => {
            await store.delete(`${id}_chunk_${i}`);
          }, CHUNKING_CONFIG.MAX_RETRIES, `delete chunk ${i} for ${id}`);
        }

        // Delete metadata
        await withRetry(async () => {
          await store.delete(`${metadataPrefix}_${id}`);
        }, CHUNKING_CONFIG.MAX_RETRIES, `delete metadata for ${id}`);
      }

      return true;
    } else {
      // Try to delete the direct object
      await withRetry(async () => {
        await store.delete(id);
      }, CHUNKING_CONFIG.MAX_RETRIES, `delete direct object ${id}`);
      return true;
    }
  } catch (error) {
    console.error(`Error deleting chunked data for ${id}:`, error);
    return false;
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = CHUNKING_CONFIG.MAX_RETRIES,
  label: string = 'operation'
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const isRequestSizeError = error.message?.includes('smaller request size');

      if (isRequestSizeError && attempt < maxRetries) {
        console.log(
          `Request size error on ${label}, retry ${attempt}/${maxRetries} after ${CHUNKING_CONFIG.RETRY_DELAY}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, CHUNKING_CONFIG.RETRY_DELAY * attempt));
        continue;
      }

      console.error(`Failed ${label} (attempt ${attempt}/${maxRetries}):`, error);

      if (attempt < maxRetries) {
        console.log(`Retrying ${label} in ${CHUNKING_CONFIG.RETRY_DELAY}ms...`);
        await new Promise((resolve) => setTimeout(resolve, CHUNKING_CONFIG.RETRY_DELAY * attempt));
      }
    }
  }

  throw lastError || new Error(`Failed ${label} after ${maxRetries} attempts`);
}
