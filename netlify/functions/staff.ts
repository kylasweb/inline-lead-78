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
  if (staffId) {
    try {
      console.log('Attempting to retrieve staff:', staffId);
      const store = getStore('staff');
      const staffData = await store.get(staffId);
      
      if (!staffData) {
        return errorResponse(404, 'Staff member not found');
      }
      
      const staff = JSON.parse(staffData);
      return successResponse(staff);
    } catch (error) {
      console.error('Error getting staff from Blob Storage:', error);
      return errorResponse(500, 'Error getting staff member');
    }
  } else {
    try {
      // List all staff
      console.log('Attempting to list all staff');
      const store = getStore('staff');
      const { blobs } = await store.list();
      
      const staff = [];
      for (const blob of blobs) {
        try {
          const staffData = await store.get(blob.key);
          if (staffData) {
            staff.push(JSON.parse(staffData));
          }
        } catch (parseError) {
          console.error(`Error parsing staff ${blob.key}:`, parseError);
        }
      }
      
      return successResponse(staff);
    } catch (error) {
      console.error('Error listing staff from Blob Storage:', error);
      return errorResponse(500, 'Error listing staff');
    }
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

  // Check for duplicate email
  try {
    const store = getStore('staff');
    const { blobs } = await store.list();
    
    for (const blob of blobs) {
      try {
        const existingStaffData = await store.get(blob.key);
        if (existingStaffData) {
          const existingStaff = JSON.parse(existingStaffData);
          if (existingStaff.email === body.email) {
            return errorResponse(409, 'Staff member with this email already exists');
          }
        }
      } catch (parseError) {
        console.error(`Error parsing staff ${blob.key}:`, parseError);
      }
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

    await store.set(staffId, JSON.stringify(staff));
    return successResponse(staff, 'Staff member created successfully');
  } catch (error) {
    console.error('Error creating staff in Blob Storage:', error);
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
    const store = getStore('staff');
    const staffData = await store.get(staffId);
    
    if (!staffData) {
      return errorResponse(404, 'Staff member not found');
    }
    
    const staff = JSON.parse(staffData);

    // Check for duplicate email if email is being updated
    if (body.email && body.email !== staff.email) {
      const { blobs } = await store.list();
      
      for (const blob of blobs) {
        if (blob.key !== staffId) {
          try {
            const existingStaffData = await store.get(blob.key);
            if (existingStaffData) {
              const existingStaff = JSON.parse(existingStaffData);
              if (existingStaff.email === body.email) {
                return errorResponse(409, 'Email already exists');
              }
            }
          } catch (parseError) {
            console.error(`Error parsing staff ${blob.key}:`, parseError);
          }
        }
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

    await store.set(staffId, JSON.stringify(staff));
    return successResponse(staff, 'Staff member updated successfully');
  } catch (error) {
    console.error('Error updating staff in Blob Storage:', error);
    return errorResponse(500, 'Error updating staff member');
  }
};

// Delete staff member
const handleDeleteStaff = async (staffId: string): Promise<HandlerResponse> => {
  try {
    const store = getStore('staff');
    
    // Check if staff member exists before deletion
    const staffData = await store.get(staffId);
    if (!staffData) {
      return errorResponse(404, 'Staff member not found');
    }
    
    await store.delete(staffId);
    return successResponse(null, 'Staff member deleted successfully');
  } catch (error) {
    console.error('Error deleting staff from Blob Storage:', error);
    return errorResponse(500, 'Error deleting staff member');
  }
};