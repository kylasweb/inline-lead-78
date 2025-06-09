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
import { validateRequestSize } from './utils/size-validator';
import { withUnifiedDatabase, unifiedDatabase } from './utils/unified-db';

// User API Handler - without size validation
const usersHandler = async (
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
    return errorResponse(500, 'Internal server error');  }
};

// Get users (all or specific user)
const handleGetUsers = async (userId?: string | null): Promise<HandlerResponse> => {
  try {
    return await withUnifiedDatabase(async () => {
      if (userId) {
        // Get specific user
        const user = await unifiedDatabase.user.findById(userId);
        
        if (!user) {
          return errorResponse(404, 'User not found');
        }
        
        return successResponse(user);
      } else {
        // Get all users
        const users = await unifiedDatabase.user.findMany();
        return successResponse(users);
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return errorResponse(500, 'Error getting users');
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

  try {
    return await withUnifiedDatabase(async () => {
      // Check for duplicate email
      const existingUser = await unifiedDatabase.user.findByEmail(body.email);
      if (existingUser) {
        return errorResponse(409, 'User with this email already exists');
      }

      const userData = {
        email: body.email,
        name: body.name,
        role: body.role || 'USER',
      };

      // Create the user with unified database
      const user = await unifiedDatabase.user.create(userData);
      return successResponse(user, 'User created successfully');
    });
  } catch (error) {
    console.error('Error creating user:', error);
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
    return await withUnifiedDatabase(async () => {
      // Check if user exists
      const existingUser = await unifiedDatabase.user.findById(userId);
      
      if (!existingUser) {
        return errorResponse(404, 'User not found');
      }
        // Check for duplicate email if email is being updated
      if (body.email && body.email !== (existingUser as any).email) {
        const emailCheck = await unifiedDatabase.user.findByEmail(body.email);
        if (emailCheck) {
          return errorResponse(409, 'Email already exists');
        }
      }
      
      // Update fields
      const updateData = {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.role !== undefined && { role: body.role }),
      };
      
      const updatedUser = await unifiedDatabase.user.update(userId, updateData);
      return successResponse(updatedUser, 'User updated successfully');
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return errorResponse(500, 'Error updating user');
  }
};

// Delete user
const handleDeleteUser = async (userId: string): Promise<HandlerResponse> => {
  try {
    // Use unified database with fallback mechanism
    return await withUnifiedDatabase(async () => {
      // Check if user exists
      const user = await unifiedDatabase.user.findById(userId);
      
      if (!user) {
        return errorResponse(404, 'User not found');
      }
      
      await unifiedDatabase.user.delete(userId);
      return successResponse(null, 'User deleted successfully');
    });  } catch (error) {
    console.error('Error deleting user:', error);
    return errorResponse(500, 'Error deleting user');
  }
};

// Apply size validation middleware to the handler
export const handler = validateRequestSize(usersHandler);