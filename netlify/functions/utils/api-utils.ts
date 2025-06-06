// Netlify Functions types (compatible without @netlify/functions package)
export interface HandlerEvent {
  httpMethod: string;
  path: string;
  headers: Record<string, string>;
  queryStringParameters: Record<string, string> | null;
  body: string | null;
  isBase64Encoded: boolean;
}

export interface HandlerContext {
  callbackWaitsForEmptyEventLoop: boolean;
  functionName: string;
  functionVersion: string;
  invokedFunctionArn: string;
  memoryLimitInMB: string;
  awsRequestId: string;
  logGroupName: string;
  logStreamName: string;
  getRemainingTimeInMillis(): number;
}

export interface HandlerResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
  isBase64Encoded?: boolean;
}

// CORS headers for all API responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Standard API response format
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Create standardized API response
export const createResponse = <T>(
  statusCode: number,
  body: ApiResponse<T>,
  additionalHeaders: Record<string, string> = {}
): HandlerResponse => ({
  statusCode,
  headers: {
    ...corsHeaders,
    'Content-Type': 'application/json',
    ...additionalHeaders,
  },
  body: JSON.stringify(body),
});

// Success response helper
export const successResponse = <T>(data: T, message?: string): HandlerResponse =>
  createResponse(200, { success: true, data, message });

// Error response helper
export const errorResponse = (
  statusCode: number,
  error: string,
  message?: string
): HandlerResponse =>
  createResponse(statusCode, { success: false, error, message });

// Handle CORS preflight requests
export const handleCors = (): HandlerResponse =>
  createResponse(200, { success: true, message: 'CORS preflight' });

// Parse JSON body safely
export const parseBody = <T = any>(event: HandlerEvent): T | null => {
  try {
    return event.body ? JSON.parse(event.body) : null;
  } catch (error) {
    return null;
  }
};

// Validate required fields in request body
export const validateRequiredFields = (
  body: any,
  requiredFields: string[]
): string[] => {
  const missing: string[] = [];
  
  for (const field of requiredFields) {
    if (!body || body[field] === undefined || body[field] === null || body[field] === '') {
      missing.push(field);
    }
  }
  
  return missing;
};

// Extract ID from path parameters
export const extractIdFromPath = (path: string): string | null => {
  const segments = path.split('/');
  const lastSegment = segments[segments.length - 1];
  
  // Check if the last segment looks like an ID (not empty and not the resource name)
  if (lastSegment && lastSegment !== 'users' && lastSegment !== 'leads' && 
      lastSegment !== 'opportunities' && lastSegment !== 'analytics') {
    return lastSegment;
  }
  
  return null;
};

// Basic authentication/authorization placeholder
export const authenticateRequest = (event: HandlerEvent): boolean => {
  // TODO: Implement actual authentication logic
  // For now, return true to allow all requests
  // In production, validate JWT tokens or API keys here
  
  const authHeader = event.headers.authorization;
  if (!authHeader) {
    // For development, allow requests without auth
    return true;
  }
  
  // Example JWT validation would go here
  return true;
};

// Rate limiting placeholder
export const checkRateLimit = (event: HandlerEvent): boolean => {
  // TODO: Implement rate limiting logic
  // Could use IP address from event.headers['x-forwarded-for']
  return true;
};

// Log request for debugging
export const logRequest = (event: HandlerEvent, context: HandlerContext): void => {
  // Log for debugging (will work in Netlify Functions environment)
  console.log(`${event.httpMethod} ${event.path}`, {
    headers: event.headers,
    body: event.body,
    queryStringParameters: event.queryStringParameters,
  });
};