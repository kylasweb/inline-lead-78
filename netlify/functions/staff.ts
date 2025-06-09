// filepath: d:\inline-lead-78\netlify\functions\staff.ts
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
import { validateRequestSize } from './utils/size-validator';
import { withUnifiedDatabase, unifiedDatabase } from './utils/unified-db';

// Staff API Handler - without size validation
const staffHandler = async (
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
  try {
    return await withUnifiedDatabase(async () => {
      if (staffId) {
        // Get specific staff member
        const staff = await unifiedDatabase.staff.findById(staffId);
        
        if (!staff) {
          return errorResponse(404, 'Staff member not found');
        }
        
        return successResponse(staff);
      } else {
        // Get all staff
        const staff = await unifiedDatabase.staff.findMany();
        return successResponse(staff);
      }
    });
  } catch (error) {
    console.error('Error getting staff:', error);
    return errorResponse(500, 'Error getting staff member');
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

  try {
    return await withUnifiedDatabase(async () => {
      // Check for duplicate email
      const existingStaff = await unifiedDatabase.staff.findByEmail(body.email);
      if (existingStaff) {
        return errorResponse(409, 'Staff member with this email already exists');
      }

      const staffId = crypto.randomUUID();
      const staffData = {
        id: staffId,
        email: body.email,
        name: body.name,
        role: body.role,
        department: body.department || null,
        phone: body.phone || null,
        status: body.status || 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      // Create staff using unified database
      const staff = await unifiedDatabase.staff.create(staffData);
      return successResponse(staff, 'Staff member created successfully');
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    return errorResponse(500, 'Error creating staff member');
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

  try {
    return await withUnifiedDatabase(async () => {
      // Fetch existing staff member
      const existingStaff = await unifiedDatabase.staff.findById(staffId);
      
      if (!existingStaff) {
        return errorResponse(404, 'Staff member not found');
      }      // Check for duplicate email if email is being updated
      if (body.email && body.email !== (existingStaff as any).email) {
        const duplicateStaff = await unifiedDatabase.staff.findByEmail(body.email);
        if (duplicateStaff && (duplicateStaff as any).id) {
          return errorResponse(409, 'Email already exists');
        }
      }

      // Prepare update data
      const updateData = {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.role !== undefined && { role: body.role }),
        ...(body.department !== undefined && { department: body.department }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.status !== undefined && { status: body.status }),
        updatedAt: new Date().toISOString(),
      };
      
      // Update the staff member
      const updatedStaff = await unifiedDatabase.staff.update(staffId, updateData);
      return successResponse(updatedStaff, 'Staff member updated successfully');
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    return errorResponse(500, 'Error updating staff member');
  }
};

// Delete staff member
const handleDeleteStaff = async (staffId: string): Promise<HandlerResponse> => {
  try {
    return await withUnifiedDatabase(async () => {
      // Check if staff exists
      const staff = await unifiedDatabase.staff.findById(staffId);
      
      if (!staff) {
        return errorResponse(404, 'Staff member not found');
      }
      
      // Delete using unified database
      await unifiedDatabase.staff.delete(staffId);
      return successResponse(null, 'Staff member deleted successfully');
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return errorResponse(500, 'Error deleting staff member');
  }
};

// Apply size validation middleware to the handler
export const handler = validateRequestSize(staffHandler);
