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

// Get staff (all or specific staff member)
const handleGetStaff = async (staffId?: string | null): Promise<HandlerResponse> => {
  return withDatabase(async () => {
    if (staffId) {
      // Get specific staff member
      const staff = await db.staff.findById(staffId);
      if (!staff) {
        return errorResponse(404, 'Staff member not found');
      }
      return successResponse(staff);
    } else {
      // Get all staff
      const staff = await db.staff.findMany();
      return successResponse(staff);
    }
  });
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

  return withDatabase(async () => {
    try {
      const staff = await db.staff.create({
        email: body.email,
        name: body.name,
        role: body.role,
        department: body.department || null,
        phone: body.phone || null,
        status: body.status || 'ACTIVE',
      });
      return successResponse(staff, 'Staff member created successfully');
    } catch (error: any) {
      if (error.code === 'P2002') {
        return errorResponse(409, 'Staff member with this email already exists');
      }
      throw error;
    }
  });
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

  return withDatabase(async () => {
    try {
      // Check if staff member exists
      const existingStaff = await db.staff.findById(staffId);
      if (!existingStaff) {
        return errorResponse(404, 'Staff member not found');
      }

      const updateData: any = {};
      if (body.name) updateData.name = body.name;
      if (body.email) updateData.email = body.email;
      if (body.role) updateData.role = body.role;
      if (body.department !== undefined) updateData.department = body.department;
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.status) updateData.status = body.status;

      const staff = await db.staff.update(staffId, updateData);
      return successResponse(staff, 'Staff member updated successfully');
    } catch (error: any) {
      if (error.code === 'P2002') {
        return errorResponse(409, 'Email already exists');
      }
      throw error;
    }
  });
};

// Delete staff member
const handleDeleteStaff = async (staffId: string): Promise<HandlerResponse> => {
  return withDatabase(async () => {
    try {
      // Check if staff member exists
      const existingStaff = await db.staff.findById(staffId);
      if (!existingStaff) {
        return errorResponse(404, 'Staff member not found');
      }

      await db.staff.delete(staffId);
      return successResponse(null, 'Staff member deleted successfully');
    } catch (error: any) {
      if (error.code === 'P2003') {
        return errorResponse(409, 'Cannot delete staff member with associated records');
      }
      throw error;
    }
  });
};