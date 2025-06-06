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

// Lead API Handler
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
    const leadId = extractIdFromPath(event.path);

    switch (event.httpMethod) {
      case 'GET':
        return await handleGetLeads(leadId);
      
      case 'POST':
        return await handleCreateLead(event);
      
      case 'PUT':
        if (!leadId) {
          return errorResponse(400, 'Lead ID is required for updates');
        }
        return await handleUpdateLead(leadId, event);
      
      case 'DELETE':
        if (!leadId) {
          return errorResponse(400, 'Lead ID is required for deletion');
        }
        return await handleDeleteLead(leadId);
      
      default:
        return errorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Leads API error:', error);
    return errorResponse(500, 'Internal server error');
  }
};

// Get leads (all or specific lead)
const handleGetLeads = async (leadId?: string | null): Promise<HandlerResponse> => {
  return withDatabase(async () => {
    if (leadId) {
      // Get specific lead
      const lead = await db.lead.findById(leadId);
      if (!lead) {
        return errorResponse(404, 'Lead not found');
      }
      return successResponse(lead);
    } else {
      // Get all leads with pagination support
      const leads = await db.lead.findMany();
      return successResponse(leads);
    }
  });
};

// Create new lead
const handleCreateLead = async (event: HandlerEvent): Promise<HandlerResponse> => {
  const body = parseBody(event);
  
  if (!body) {
    return errorResponse(400, 'Request body is required');
  }

  const missingFields = validateRequiredFields(body, ['name', 'email']);
  if (missingFields.length > 0) {
    return errorResponse(400, `Missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return errorResponse(400, 'Invalid email format');
  }

  // Validate assignedTo user exists if provided
  if (body.assignedTo) {
    const assignedUser = await db.user.findById(body.assignedTo);
    if (!assignedUser) {
      return errorResponse(400, 'Assigned user does not exist');
    }
  }

  return withDatabase(async () => {
    try {
      const lead = await db.lead.create({
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        company: body.company || null,
        status: body.status || 'NEW',
        assignedTo: body.assignedTo || null,
      });
      return successResponse(lead, 'Lead created successfully');
    } catch (error: any) {
      if (error.code === 'P2002') {
        return errorResponse(409, 'Lead with this email already exists');
      }
      throw error;
    }
  });
};

// Update lead
const handleUpdateLead = async (leadId: string, event: HandlerEvent): Promise<HandlerResponse> => {
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

  // Validate assignedTo user exists if provided
  if (body.assignedTo) {
    const assignedUser = await db.user.findById(body.assignedTo);
    if (!assignedUser) {
      return errorResponse(400, 'Assigned user does not exist');
    }
  }

  // Validate status if provided
  const validStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
  if (body.status && !validStatuses.includes(body.status)) {
    return errorResponse(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  return withDatabase(async () => {
    try {
      // Check if lead exists
      const existingLead = await db.lead.findById(leadId);
      if (!existingLead) {
        return errorResponse(404, 'Lead not found');
      }

      const updateData: any = {};
      if (body.name) updateData.name = body.name;
      if (body.email) updateData.email = body.email;
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.company !== undefined) updateData.company = body.company;
      if (body.status) updateData.status = body.status;
      if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;

      const lead = await db.lead.update(leadId, updateData);
      return successResponse(lead, 'Lead updated successfully');
    } catch (error: any) {
      if (error.code === 'P2002') {
        return errorResponse(409, 'Email already exists');
      }
      throw error;
    }
  });
};

// Delete lead
const handleDeleteLead = async (leadId: string): Promise<HandlerResponse> => {
  return withDatabase(async () => {
    try {
      // Check if lead exists
      const existingLead = await db.lead.findById(leadId);
      if (!existingLead) {
        return errorResponse(404, 'Lead not found');
      }

      await db.lead.delete(leadId);
      return successResponse(null, 'Lead deleted successfully');
    } catch (error: any) {
      if (error.code === 'P2003') {
        return errorResponse(409, 'Cannot delete lead with associated opportunities');
      }
      throw error;
    }
  });
};