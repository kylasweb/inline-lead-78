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

// User API Handler - with proper authentication and error handling
const usersHandler = async (
  event: HandlerEvent,
  context: HandlerContext
): Promise<HandlerResponse> => {
  logRequest(event, context);

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  // Basic authentication check - bypassing for development
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
        return errorResponse(405, 'Method Not Allowed');
    }
  } catch (error) {
    console.error('Error in users handler:', error);
    return errorResponse(500, `Server error: ${error.message || 'Unknown error'}`);
  }
};

// Get users handler
const handleGetUsers = async (userId?: string): Promise<HandlerResponse> => {
  try {
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
  } catch (error) {
    console.error('Error fetching users:', error);
    return errorResponse(500, `Error fetching users: ${error.message}`);
  }
};

// Create user handler
const handleCreateUser = async (event: HandlerEvent): Promise<HandlerResponse> => {
  try {
    const body = parseBody(event);
    
    // Validate required fields
    const requiredFields = ['name', 'email'];
    const missingFields = validateRequiredFields(body, requiredFields);
    
    if (missingFields.length > 0) {
      return errorResponse(400, `Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate data
    if (body.email && !isValidEmail(body.email)) {
      return errorResponse(400, 'Invalid email format');
    }
    
    // Check for duplicate email
    const existingUser = await unifiedDatabase.user.findByEmail(body.email);
    if (existingUser) {
      return errorResponse(409, 'User with this email already exists');
    }
    
    // Create user
    const newUser = await unifiedDatabase.user.create({
      name: body.name,
      email: body.email,
      role: body.role || 'USER'
    });
    
    return successResponse(newUser, "201");
  } catch (error) {
    console.error('Error creating user:', error);
    return errorResponse(500, `Error creating user: ${error.message}`);
  }
};

// Update user handler
const handleUpdateUser = async (userId: string, event: HandlerEvent): Promise<HandlerResponse> => {
  try {
    const body = parseBody(event);
    
    if (Object.keys(body).length === 0) {
      return errorResponse(400, 'No update data provided');
    }
    
    // Validate email if provided
    if (body.email && !isValidEmail(body.email)) {
      return errorResponse(400, 'Invalid email format');
    }
    
    // Check if user exists
    const existingUser = await unifiedDatabase.user.findById(userId);
    if (!existingUser) {
      return errorResponse(404, 'User not found');
    }
      // Check for email uniqueness if email is being updated
    if (body.email && existingUser && typeof existingUser === 'object' && existingUser !== null && 'email' in existingUser && body.email !== existingUser.email) {
      const userWithEmail = await unifiedDatabase.user.findByEmail(body.email);
      if (userWithEmail) {
        return errorResponse(409, 'Another user with this email already exists');
      }
    }
    
    // Update user
    const updatedUser = await unifiedDatabase.user.update(userId, {
      ...body
    });
    
    return successResponse(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return errorResponse(500, `Error updating user: ${error.message}`);
  }
};

// Delete user handler
const handleDeleteUser = async (userId: string): Promise<HandlerResponse> => {
  try {
    // Check if user exists
    const existingUser = await unifiedDatabase.user.findById(userId);
    if (!existingUser) {
      return errorResponse(404, 'User not found');
    }
    
    // Delete user
    await unifiedDatabase.user.delete(userId);
    
    return successResponse({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return errorResponse(500, `Error deleting user: ${error.message}`);
  }
};

// Email validation helper
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Export the handler
export const handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Use the withUnifiedDatabase wrapper to ensure database is initialized
  try {
    await withUnifiedDatabase(async () => {
      console.log("Database initialized");
    });
    // Call the actual handler
    return await usersHandler(event, context);
  } catch (error) {
    console.error("Database initialization error:", error);
    return errorResponse(500, `Server error: ${error.message || 'Unknown error'}`);
  }
};