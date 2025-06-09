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

// Staff API Handler
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
    const staffId = extractIdFromPath(event.path);

    switch (event.httpMethod) {
      case 'GET':
        return await handleGetStaff(staffId);
      
      case 'POST':
        return await handleCreateStaff(event);
      
      case 'PUT':
        if (!staffId) {
          return errorResponse(400, 'Staff ID is required for updates');
        }
        return await handleUpdateStaff(staffId, event);
      
      case 'DELETE':
        if (!staffId) {
          return errorResponse(400, 'Staff ID is required for deletion');
        }
        return await handleDeleteStaff(staffId);
      
      default:
        return errorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Staff API error:', error);
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

// Get staff (all or specific staff member)
const handleGetStaff = async (staffId?: string | null): Promise<HandlerResponse> => {
  const session = driver.session();
  try {
    if (staffId) {
      // Get specific staff member
      const query = `MATCH (s:Staff {id: $staffId})
                     RETURN s`;
      const result = await session.run(query, { staffId });

      if (result.records.length === 0) {
        return errorResponse(404, 'Staff member not found');
      }

      const staff = result.records[0].get('s').properties;
      return successResponse(staff);
    } else {
      // Get all staff
      const query = `MATCH (s:Staff)
                     RETURN s`;
      const result = await session.run(query);

      const staff = result.records.map(record => record.get('s').properties);
      return successResponse(staff);
    }
  } catch (error) {
    console.error('Error getting staff from Neo4j:', error);
    return errorResponse(500, 'Error getting staff member');
  } finally {
    await session.close();
  }
};

// Create new staff member
const handleCreateStaff = async (event: HandlerEvent): Promise<HandlerResponse> => {
  const body = parseBody(event);

  if (!body) {
    return errorResponse(400, 'Request body is required');
  }

  const missingFields = validateRequiredFields(body, ['email', 'name', 'role']);
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
    const checkEmailQuery = `MATCH (s:Staff {email: $email}) RETURN s`;
    const emailCheckResult = await session.run(checkEmailQuery, { email: body.email });
    if (emailCheckResult.records.length > 0) {
      return errorResponse(409, 'Staff member with this email already exists');
    }

    const staffId = crypto.randomUUID();
    const staff = {
      id: staffId,
      email: body.email,
      name: body.name,
      role: body.role,
      department: body.department || null,
      phone: body.phone || null,
      status: body.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    const query = `CREATE (s:Staff {
      id: $id,
      email: $email,
      name: $name,
      role: $role,
      department: $department,
      phone: $phone,
      status: $status,
      createdAt: $createdAt
    })
    RETURN s`;

    await session.run(query, staff);
    return successResponse(staff, 'Staff member created successfully');
  } catch (error) {
    console.error('Error creating staff in Neo4j:', error);
    return errorResponse(500, 'Error creating staff member');
  } finally {
    await session.close();
  }
};

// Update staff member
const handleUpdateStaff = async (staffId: string, event: HandlerEvent): Promise<HandlerResponse> => {
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
    // Fetch existing staff member
    const fetchQuery = `MATCH (s:Staff {id: $staffId}) RETURN s`;
    const fetchResult = await session.run(fetchQuery, { staffId });

    if (fetchResult.records.length === 0) {
      return errorResponse(404, 'Staff member not found');
    }

    const staff = fetchResult.records[0].get('s').properties;

    // Check for duplicate email if email is being updated
    if (body.email && body.email !== staff.email) {
      const checkEmailQuery = `MATCH (s:Staff {email: $email}) RETURN s`;
      const emailCheckResult = await session.run(checkEmailQuery, { email: body.email });
      if (emailCheckResult.records.length > 0) {
        return errorResponse(409, 'Email already exists');
      }
    }

    // Update fields
    if (body.name) staff.name = body.name;
    if (body.email) staff.email = body.email;
    if (body.role) staff.role = body.role;
    if (body.department !== undefined) staff.department = body.department;
    if (body.phone !== undefined) staff.phone = body.phone;
    if (body.status) staff.status = body.status;

    // Add updated timestamp
    staff.updatedAt = new Date().toISOString();

    // Update in Neo4j
    const updateQuery = `MATCH (s:Staff {id: $staffId})
                       SET s = $staff
                       RETURN s`;

    await session.run(updateQuery, { staffId, staff });
    return successResponse(staff, 'Staff member updated successfully');
  } catch (error) {
    console.error('Error updating staff in Neo4j:', error);
    return errorResponse(500, 'Error updating staff member');
  } finally {
    await session.close();
  }
};

// Delete staff member
const handleDeleteStaff = async (staffId: string): Promise<HandlerResponse> => {
  const session = driver.session();
  try {
    // Check if staff member exists before deletion
    const fetchQuery = `MATCH (s:Staff {id: $staffId}) RETURN s`;
    const fetchResult = await session.run(fetchQuery, { staffId });

    if (fetchResult.records.length === 0) {
      return errorResponse(404, 'Staff member not found');
    }

    const query = `MATCH (s:Staff {id: $staffId})
                   DELETE s`;
    await session.run(query, { staffId });

    return successResponse(null, 'Staff member deleted successfully');
  } catch (error) {
    console.error('Error deleting staff from Neo4j:', error);
    return errorResponse(500, 'Error deleting staff member');
  } finally {
    await session.close();
  }
};