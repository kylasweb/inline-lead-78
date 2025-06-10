// Enhanced API utilities with better error handling for JSON parsing issues

// Detect if we're running in a development environment
export const isDevelopment = import.meta.env.DEV || 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1';

// Get the base API URL based on environment
export const getApiBaseUrl = () => {
  if (isDevelopment) {
    // For development, use mock API instead of Netlify Functions
    return '/api';
  }
  return '/.netlify/functions';
};

// Normalize API paths for development or production
export const normalizeApiPath = (url: string) => {
  if (isDevelopment && url.startsWith('/.netlify/functions')) {
    // Convert Netlify function paths to local API paths in development
    return url.replace('/.netlify/functions', '/api');
  }
  return url;
};

/**
 * Safely parse JSON response with better error handling
 * @param response Fetch Response object
 */
export async function safeParseResponse<T>(response: Response): Promise<{ 
  data: T | null; 
  success: boolean; 
  error?: string; 
  statusCode: number;
}> {
  const statusCode = response.status;
  
  // Handle empty responses
  try {
    const responseText = await response.text();
    
    // Empty response check
    if (!responseText || responseText.trim() === '') {
      return { 
        data: null, 
        success: response.ok, 
        error: response.ok ? undefined : 'Empty response from server',
        statusCode
      };
    }
    
    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      return {
        data: data.data || data, // Handle API wrapper format
        success: response.ok,
        error: !response.ok ? (data.error || `Server error: ${response.statusText}`) : undefined,
        statusCode
      };
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError, 'Raw response:', responseText);
      return {
        data: null,
        success: false,
        error: `Invalid JSON response: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`,
        statusCode
      };
    }
  } catch (error) {
    console.error('Error while reading response text:', error);
    return {
      data: null,
      success: false,
      error: 'Failed to read server response',
      statusCode
    };
  }
}

// Import the mock API handler
import { handleMockApiRequest } from './mock-api';

/**
 * Safer fetch API with better error handling
 */
export async function safeFetch<T>(url: string, options?: RequestInit): Promise<{ 
  data: T | null; 
  success: boolean; 
  error?: string; 
  statusCode: number;
}> {  try {
    // Handle API calls based on environment
    let response: Response;
    
    // Normalize the URL path based on the environment
    const normalizedUrl = normalizeApiPath(url);
    
    if (isDevelopment) {
      console.log('🧪 Using mock API for development');
      response = await handleMockApiRequest(normalizedUrl, options);
    } else {
      response = await fetch(normalizedUrl, options);
    }
    
    return await safeParseResponse<T>(response);
  } catch (error) {
    console.error('Network error during fetch:', error);
    return {
      data: null,
      success: false,
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      statusCode: 0 // 0 typically indicates a network error
    };
  }
}
