import { HandlerEvent, HandlerContext, HandlerResponse } from './utils/api-utils';
import neo4j from 'neo4j-driver';
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
// Removed blob import

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

// Initialize Neo4j Driver
const initNeo4j = () => {
  const neo4jUri = process.env.NEO4J_URI;
  if (!neo4jUri) {
    throw new Error('NEO4J_URI environment variable is not set.');
  }

  const driver = neo4j.driver(
    neo4jUri,
    neo4j.auth.basic(
      process.env.NEO4J_USERNAME || 'neo4j',
      process.env.NEO4J_PASSWORD || 'password'
    )
  );
  return driver;
};

const driver = initNeo4j();

// Get users (all or specific user)
const handleGetUsers = async (userId?: string | null): Promise<HandlerResponse> => {
  const session = driver.session();
  try {
    if (userId) {
      // Get specific user
      const query = `MATCH (u:User {id: $userId})
                     RETURN u`;
      const result = await session.run(query, { userId });

      if (result.records.length === 0) {
        return errorResponse(404, 'User not found');
      }

      const user = result.records[0].get('u').properties;
      return successResponse(user);
    } else {
      // Get all users
      const query = `MATCH (u:User)
                     RETURN u`;
      const result = await session.run(query);

      const users = result.records.map(record => record.get('u').properties);
      return successResponse(users);
    }
  } catch (error) {
    console.error('Error getting user from Neo4j:', error);
    return errorResponse(500, 'Error getting user');
  } finally {
    await session.close();
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

  const session = driver.session();
  try {
    // Check for duplicate email
    const checkEmailQuery = `MATCH (u:User {email: $email}) RETURN u`;
    const emailCheckResult = await session.run(checkEmailQuery, { email: body.email });
    if (emailCheckResult.records.length > 0) {
      return errorResponse(409, 'User with this email already exists');
    }

    const userId = crypto.randomUUID();
    const user = {
      id: userId,
      email: body.email,
      name: body.name,
      role: body.role || 'USER',
      createdAt: new Date().toISOString(),
    };

    const query = `CREATE (u:User {
      id: $id,
      email: $email,
      name: $name,
      role: $role,
      createdAt: $createdAt
    })
    RETURN u`;

    await session.run(query, user);
    return successResponse(user, 'User created successfully');
  } catch (error) {
    console.error('Error creating user in Neo4j:', error);
    return errorResponse(500, 'Error creating user');
  } finally {
    await session.close();
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

  const session = driver.session();
  try {
    // Fetch existing user
    const fetchQuery = `MATCH (u:User {id: $userId}) RETURN u`;
    const fetchResult = await session.run(fetchQuery, { userId });

    if (fetchResult.records.length === 0) {
      return errorResponse(404, 'User not found');
    }

    const user = fetchResult.records[0].get('u').properties;

    // Check for duplicate email if email is being updated
    if (body.email && body.email !== user.email) {
      const checkEmailQuery = `MATCH (u:User {email: $email}) RETURN u`;
      const emailCheckResult = await session.run(checkEmailQuery, { email: body.email });
      if (emailCheckResult.records.length > 0) {
        return errorResponse(409, 'Email already exists');
      }
    }

    // Update fields
    if (body.name) user.name = body.name;
    if (body.email) user.email = body.email;
    if (body.role) user.role = body.role;

    // Add updated timestamp
    user.updatedAt = new Date().toISOString();

    // Update in Neo4j
    const updateQuery = `MATCH (u:User {id: $userId})
                       SET u = $user
                       RETURN u`;

    await session.run(updateQuery, { userId, user });
    return successResponse(user, 'User updated successfully');
  } catch (error) {
    console.error('Error updating user in Neo4j:', error);
    return errorResponse(500, 'Error updating user');
  } finally {
    await session.close();
  }
};

// Delete user
const handleDeleteUser = async (userId: string): Promise<HandlerResponse> => {
  const session = driver.session();
  try {
    // Check if user exists before deletion
    const fetchQuery = `MATCH (u:User {id: $userId}) RETURN u`;
    const fetchResult = await session.run(fetchQuery, { userId });

    if (fetchResult.records.length === 0) {
      return errorResponse(404, 'User not found');
    }

    const query = `MATCH (u:User {id: $userId})
                   DELETE u`;
    await session.run(query, { userId });

    return successResponse(null, 'User deleted successfully');
  } catch (error) {
    console.error('Error deleting user from Neo4j:', error);
    return errorResponse(500, 'Error deleting user');
  } finally {
    await session.close();
  }
};