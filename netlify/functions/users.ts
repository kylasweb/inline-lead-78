import { HandlerEvent, HandlerContext, HandlerResponse } from './utils/api-utils';
import {
  corsHeaders,
  createResponse,
  successResponse,
  errorResponse,
  handleCors,
  parseBody,
  validateRequiredFields,
  extractIdFromPath,
  authenticateRequest,
  logRequest,
} from './utils/api-utils';
import { getStore } from '@netlify/blobs';

// User API Handler
export const handler = async (
  event: HandlerEvent,
  context: HandlerContext
): Promise<HandlerResponse> => {
  logRequest(event, context);

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  // Basic authentication check
  if (!authenticateRequest(event)) {
    return errorResponse(401, 'Unauthorized');
  }

  try {
    const userId = extractIdFromPath(event.path);

    switch (event.httpMethod) {
      case 'GET':
        return await handleGetUsers(userId);
      
      case 'POST':
        return await handleCreateUser(event);
      
      case 'PUT':
        if (!userId) {
          return errorResponse(400, 'User ID is required for updates');
        }
        return await handleUpdateUser(userId, event);
      
      case 'DELETE':
        if (!userId) {
          return errorResponse(400, 'User ID is required for deletion');
        }
        return await handleDeleteUser(userId);
      
      default:
        return errorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Users API error:', error);
    return errorResponse(500, 'Internal server error');
  }
};

// Get users (all or specific user)
const handleGetUsers = async (userId?: string | null): Promise<HandlerResponse> => {
  if (userId) {
    try {
      console.log('Attempting to retrieve user:', userId);
      const store = getStore('users');
      const userData = await store.get(userId);
      
      if (!userData) {
        return errorResponse(404, 'User not found');
      }
      
      const user = JSON.parse(userData);
      return successResponse(user);
    } catch (error) {
      console.error('Error getting user from Blob Storage:', error);
      return errorResponse(500, 'Error getting user');
    }
  } else {
    try {
      // List all users
      console.log('Attempting to list all users');
      const store = getStore('users');
      const { blobs } = await store.list();
      
      const users = [];
      for (const blob of blobs) {
        try {
          const userData = await store.get(blob.key);
          if (userData) {
            users.push(JSON.parse(userData));
          }
        } catch (parseError) {
          console.error(`Error parsing user ${blob.key}:`, parseError);
        }
      }
      
      return successResponse(users);
    } catch (error) {
      console.error('Error listing users from Blob Storage:', error);
      return errorResponse(500, 'Error listing users');
    }
  }
};

// Create new user
const handleCreateUser = async (event: HandlerEvent): Promise<HandlerResponse> => {
  const body = parseBody(event);
  
  if (!body) {
    return errorResponse(400, 'Request body is required');
  }

  const missingFields = validateRequiredFields(body, ['email', 'name']);
  if (missingFields.length > 0) {
    return errorResponse(400, `Missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return errorResponse(400, 'Invalid email format');
  }

  // Check for duplicate email
  try {
    const store = getStore('users');
    const { blobs } = await store.list();
    
    for (const blob of blobs) {
      try {
        const existingUserData = await store.get(blob.key);
        if (existingUserData) {
          const existingUser = JSON.parse(existingUserData);
          if (existingUser.email === body.email) {
            return errorResponse(409, 'User with this email already exists');
          }
        }
      } catch (parseError) {
        console.error(`Error parsing user ${blob.key}:`, parseError);
      }
    }

    const userId = crypto.randomUUID();
    const user = {
      id: userId,
      email: body.email,
      name: body.name,
      role: body.role || 'USER',
      createdAt: new Date().toISOString(),
    };

    await store.set(userId, JSON.stringify(user));
    return successResponse(user, 'User created successfully');
  } catch (error) {
    console.error('Error creating user in Blob Storage:', error);
    return errorResponse(500, 'Error creating user');
  }
};

// Update user
const handleUpdateUser = async (userId: string, event: HandlerEvent): Promise<HandlerResponse> => {
  const body = parseBody(event);
  
  if (!body) {
    return errorResponse(400, 'Request body is required');
  }

  // Validate email format if provided
  if (body.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return errorResponse(400, 'Invalid email format');
    }
  }

  try {
    const store = getStore('users');
    const userData = await store.get(userId);
    
    if (!userData) {
      return errorResponse(404, 'User not found');
    }
    
    const user = JSON.parse(userData);

    // Check for duplicate email if email is being updated
    if (body.email && body.email !== user.email) {
      const { blobs } = await store.list();
      
      for (const blob of blobs) {
        if (blob.key !== userId) {
          try {
            const existingUserData = await store.get(blob.key);
            if (existingUserData) {
              const existingUser = JSON.parse(existingUserData);
              if (existingUser.email === body.email) {
                return errorResponse(409, 'Email already exists');
              }
            }
          } catch (parseError) {
            console.error(`Error parsing user ${blob.key}:`, parseError);
          }
        }
      }
    }

    // Update fields
    if (body.name) user.name = body.name;
    if (body.email) user.email = body.email;
    if (body.role) user.role = body.role;
    
    // Add updated timestamp
    user.updatedAt = new Date().toISOString();

    await store.set(userId, JSON.stringify(user));
    return successResponse(user, 'User updated successfully');
  } catch (error) {
    console.error('Error updating user in Blob Storage:', error);
    return errorResponse(500, 'Error updating user');
  }
};

// Delete user
const handleDeleteUser = async (userId: string): Promise<HandlerResponse> => {
  try {
    const store = getStore('users');
    
    // Check if user exists before deletion
    const userData = await store.get(userId);
    if (!userData) {
      return errorResponse(404, 'User not found');
    }
    
    await store.delete(userId);
    return successResponse(null, 'User deleted successfully');
  } catch (error) {
    console.error('Error deleting user from Blob Storage:', error);
    return errorResponse(500, 'Error deleting user');
  }
};