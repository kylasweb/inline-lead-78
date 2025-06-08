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
  if (leadId) {
    try {
      console.log('Attempting to retrieve lead:', leadId);
      // const leadString = await get({ key: leadId }); // Removed @netlify/blobs usage
      // if (!leadString) {
      //   return errorResponse(404, 'Lead not found');
      // }
      // const lead = JSON.parse(leadString);
      // return successResponse(lead);
      return errorResponse(500, 'Not implemented yet'); // Placeholder
    } catch (error) {
      console.error('Error getting lead from Blob Storage:', error);
      return errorResponse(500, 'Error getting lead');
    }
  } else {
    return errorResponse(405, 'Method not allowed for listing all leads. Use GET with leadId.');
  }
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

  const leadId = crypto.randomUUID();
  const lead = {
    id: leadId,
    name: body.name,
    email: body.email,
    phone: body.phone || null,
    company: body.company || null,
    status: body.status || 'NEW',
    assignedTo: body.assignedTo || null,
  };

  try {
    // await set({ key: leadId, value: JSON.stringify(lead) }); // Removed @netlify/blobs usage
    // return successResponse(lead, 'Lead created successfully');
    return errorResponse(500, 'Not implemented yet'); // Placeholder
  } catch (error) {
    console.error('Error creating lead in Blob Storage:', error);
    return errorResponse(500, 'Error creating lead');
  }
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

  try {
    // const leadString = await get({ key: leadId }); // Removed @netlify/blobs usage
    // if (!leadString) {
    //   return errorResponse(404, 'Lead not found');
    // }
    // let lead = JSON.parse(leadString);

    // if (body.name) lead.name = body.name;
    // if (body.email) lead.email = body.email;
    // if (body.phone !== undefined) lead.phone = body.phone;
    // if (body.company !== undefined) lead.company = body.company;
    // if (body.status) lead.status = body.status;
    // if (body.assignedTo !== undefined) lead.assignedTo = body.assignedTo;

    // await set({ key: leadId, value: JSON.stringify(lead) }); // Removed @netlify/blobs usage
    // return successResponse(lead, 'Lead updated successfully');
    return errorResponse(500, 'Not implemented yet'); // Placeholder
  } catch (error) {
    console.error('Error updating lead in Blob Storage:', error);
    return errorResponse(500, 'Error updating lead');
  }
};

// Delete lead
const handleDeleteLead = async (leadId: string): Promise<HandlerResponse> => {
  try {
    // await remove({ key: leadId }); // Removed @netlify/blobs usage
    // return successResponse(null, 'Lead deleted successfully');
    return errorResponse(500, 'Not implemented yet'); // Placeholder
  } catch (error) {
    console.error('Error deleting lead from Blob Storage:', error);
    return errorResponse(500, 'Error deleting lead');
  }
};