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
import { db, withDatabase } from './utils/db';

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
  return withDatabase(async () => {
    if (userId) {
      // Get specific user
      const user = await db.user.findById(userId);
      if (!user) {
        return errorResponse(404, 'User not found');
      }
      return successResponse(user);
    } else {
      // Get all users
      const users = await db.user.findMany();
      return successResponse(users);
    }
  });
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

  return withDatabase(async () => {
    try {
      const user = await db.user.create({
        email: body.email,
        name: body.name,
        role: body.role || 'USER',
      });
      return successResponse(user, 'User created successfully');
    } catch (error: any) {
      if (error.code === 'P2002') {
        return errorResponse(409, 'User with this email already exists');
      }
      throw error;
    }
  });
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

  return withDatabase(async () => {
    try {
      // Check if user exists
      const existingUser = await db.user.findById(userId);
      if (!existingUser) {
        return errorResponse(404, 'User not found');
      }

      const updateData: any = {};
      if (body.name) updateData.name = body.name;
      if (body.role) updateData.role = body.role;

      const user = await db.user.update(userId, updateData);
      return successResponse(user, 'User updated successfully');
    } catch (error: any) {
      if (error.code === 'P2002') {
        return errorResponse(409, 'Email already exists');
      }
      throw error;
    }
  });
};

// Delete user
const handleDeleteUser = async (userId: string): Promise<HandlerResponse> => {
  return withDatabase(async () => {
    try {
      // Check if user exists
      const existingUser = await db.user.findById(userId);
      if (!existingUser) {
        return errorResponse(404, 'User not found');
      }

      await db.user.delete(userId);
      return successResponse(null, 'User deleted successfully');
    } catch (error: any) {
      if (error.code === 'P2003') {
        return errorResponse(409, 'Cannot delete user with associated records');
      }
      throw error;
    }
  });
};