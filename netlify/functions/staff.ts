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

// Staff API Handler - with improved authentication handling
const staffHandler = async (
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
    const staffId = extractIdFromPath(event.path);

    switch (event.httpMethod) {
      case 'GET':
        return await handleGetStaff(staffId);
      
      case 'POST':
        return await handleCreateStaffMember(event);
      
      case 'PUT':
        if (!staffId) {
          return errorResponse(400, 'Staff ID is required for updates');
        }
        return await handleUpdateStaffMember(staffId, event);
      
      case 'DELETE':
        if (!staffId) {
          return errorResponse(400, 'Staff ID is required for deletion');
        }
        return await handleDeleteStaffMember(staffId);
      
      default:
        return errorResponse(405, 'Method Not Allowed');
    }
  } catch (error) {
    console.error('Error in staff handler:', error);
    return errorResponse(500, `Server error: ${error.message || 'Unknown error'}`);
  }
};

// Get staff handler
const handleGetStaff = async (staffId?: string): Promise<HandlerResponse> => {
  try {
    if (staffId) {
      // Get specific staff member
      const staff = await unifiedDatabase.staff.findById(staffId);
      if (!staff) {
        return errorResponse(404, 'Staff member not found');
      }
      return successResponse(staff);
    } else {
      // Get all staff members
      const staff = await unifiedDatabase.staff.findMany();
      return successResponse(staff);
    }
  } catch (error) {
    console.error('Error fetching staff members:', error);
    return errorResponse(500, `Error fetching staff members: ${error.message}`);
  }
};

// Create staff handler
const handleCreateStaffMember = async (event: HandlerEvent): Promise<HandlerResponse> => {
  try {
    const body = parseBody(event);
    
    // Validate required fields
    const requiredFields = ['name', 'email'];
    const missingFields = validateRequiredFields(body, requiredFields);
    
    if (missingFields.length > 0) {
      return errorResponse(400, `Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate data
    if (!isValidEmail(body.email)) {
      return errorResponse(400, 'Invalid email format');
    }
    
    // Check for duplicate email
    const existingStaff = await unifiedDatabase.staff.findByEmail(body.email);
    if (existingStaff) {
      return errorResponse(409, 'Staff member with this email already exists');
    }
    
    // Create staff member
    const newStaffMember = await unifiedDatabase.staff.create({
      name: body.name,
      email: body.email,
      role: body.role || 'Employee',
      department: body.department || '',
      phone: body.phone || '',
      status: body.status || 'ACTIVE'
    });
    
    return successResponse(newStaffMember, "201");
  } catch (error) {
    console.error('Error creating staff member:', error);
    return errorResponse(500, `Error creating staff member: ${error.message}`);
  }
};

// Update staff member handler
const handleUpdateStaffMember = async (staffId: string, event: HandlerEvent): Promise<HandlerResponse> => {
  try {
    const body = parseBody(event);
    
    if (Object.keys(body).length === 0) {
      return errorResponse(400, 'No update data provided');
    }
    
    // Validate email if provided
    if (body.email && !isValidEmail(body.email)) {
      return errorResponse(400, 'Invalid email format');
    }
    
    // Check if staff exists
    const existingStaff = await unifiedDatabase.staff.findById(staffId);
    if (!existingStaff) {
      return errorResponse(404, 'Staff member not found');
    }    // Check for email uniqueness if email is being updated
    if (body.email && existingStaff && typeof existingStaff === 'object' && existingStaff !== null && 'email' in existingStaff && body.email !== existingStaff.email) {
      const staffWithEmail = await unifiedDatabase.staff.findByEmail(body.email);
      if (staffWithEmail) {
        return errorResponse(409, 'Another staff member with this email already exists');
      }
    }
    
    // Update staff
    const updatedStaff = await unifiedDatabase.staff.update(staffId, body);
    
    return successResponse(updatedStaff);
  } catch (error) {
    console.error('Error updating staff member:', error);
    return errorResponse(500, `Error updating staff member: ${error.message}`);
  }
};

// Delete staff member handler
const handleDeleteStaffMember = async (staffId: string): Promise<HandlerResponse> => {
  try {
    // Check if staff exists
    const existingStaff = await unifiedDatabase.staff.findById(staffId);
    if (!existingStaff) {
      return errorResponse(404, 'Staff member not found');
    }
    
    // Delete staff member
    await unifiedDatabase.staff.delete(staffId);
    
    return successResponse({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    return errorResponse(500, `Error deleting staff member: ${error.message}`);
  }
};

// Email validation helper
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Export the handler with proper initialization
export const handler = async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
  // Initialize database before calling the handler
  try {
    await withUnifiedDatabase(async () => {
      console.log("Database initialized for staff API");
    });
    // Call the actual handler
    return await staffHandler(event, context);
  } catch (error) {
    console.error("Database initialization error:", error);
    return errorResponse(500, `Server error: ${error.message || 'Unknown error'}`);
  }
};