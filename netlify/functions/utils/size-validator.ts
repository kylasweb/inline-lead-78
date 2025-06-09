import { HandlerEvent, HandlerContext, HandlerResponse } from './api-utils';
import { SIZE_LIMITS } from './blob-size-utils';

/**
 * Middleware function to validate request size
 * @param handler The Netlify function handler to wrap
 * @param maxSize Maximum allowed request size in bytes (defaults to 6MB)
 * @returns A new handler function with size validation
 */
export function validateRequestSize(
  handler: (event: HandlerEvent, context: HandlerContext) => Promise<HandlerResponse>,
  maxSize: number = SIZE_LIMITS.MAX_PAYLOAD
): (event: HandlerEvent, context: HandlerContext) => Promise<HandlerResponse> {
  return async (event, context): Promise<HandlerResponse> => {
    // Check if the request has a body
    if (event.body) {
      const contentLength = event.headers['content-length'];
      const declaredSize = contentLength ? parseInt(contentLength, 10) : 0;
      
      // If Content-Length header exists and exceeds limit
      if (declaredSize && declaredSize > maxSize) {
        console.warn(`Request size too large: ${declaredSize} bytes (max: ${maxSize})`);
        return {
          statusCode: 413, // Payload Too Large
          body: JSON.stringify({
            error: 'Payload too large',
            message: `Request exceeds the maximum size of ${Math.round(maxSize / 1024 / 1024)}MB. Please use a smaller request size.`,
            details: {
              requestSize: declaredSize,
              maxSize: maxSize,
              sizeMB: Math.round(declaredSize / 1024 / 1024 * 100) / 100
            }
          })
        };
      }
      
      // Double check actual body size
      const actualSize = Buffer.from(event.body).length;
      if (actualSize > maxSize) {
        console.warn(`Request body too large: ${actualSize} bytes (max: ${maxSize})`);
        return {
          statusCode: 413,
          body: JSON.stringify({
            error: 'Payload too large',
            message: `Request exceeds the maximum size of ${Math.round(maxSize / 1024 / 1024)}MB. Please use a smaller request size.`,
            details: {
              requestSize: actualSize,
              maxSize: maxSize,
              sizeMB: Math.round(actualSize / 1024 / 1024 * 100) / 100
            }
          })
        };
      }
    }
    
    // If size check passes, continue to the handler
    return handler(event, context);
  };
}

/**
 * Check if an object is too large for direct storage
 * @param obj Object to check
 * @returns True if object exceeds any size limits
 */
export function isObjectTooLarge(obj: any): boolean {
  try {
    const serialized = JSON.stringify(obj);
    return serialized.length > SIZE_LIMITS.CHUNK_SIZE;
  } catch (error) {
    console.error('Error checking object size:', error);
    return true; // Assume too large if we can't serialize
  }
}

/**
 * Utility to split a large batch operation into smaller chunks
 * @param items Array of items to process
 * @param batchSize Maximum number of items per batch
 * @param processBatch Function to process each batch
 * @returns Combined results from all batches
 */
export async function processBatches<T, R>(
  items: T[],
  batchSize: number,
  processBatch: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processBatch(batch);
    results.push(...batchResults);
  }
  
  return results;
}
