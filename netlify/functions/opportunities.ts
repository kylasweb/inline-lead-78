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

// Opportunity API Handler
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
    const opportunityId = extractIdFromPath(event.path);

    switch (event.httpMethod) {
      case 'GET':
        return await handleGetOpportunities(opportunityId, event);
      
      case 'POST':
        return await handleCreateOpportunity(event);
      
      case 'PUT':
        if (!opportunityId) {
          return errorResponse(400, 'Opportunity ID is required for updates');
        }
        return await handleUpdateOpportunity(opportunityId, event);
      
      case 'DELETE':
        if (!opportunityId) {
          return errorResponse(400, 'Opportunity ID is required for deletion');
        }
        return await handleDeleteOpportunity(opportunityId);
      
      default:
        return errorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Opportunities API error:', error);
    return errorResponse(500, 'Internal server error');
  }
};

// Get opportunities (all, specific opportunity, or by lead)
const handleGetOpportunities = async (
  opportunityId?: string | null,
  event?: HandlerEvent
): Promise<HandlerResponse> => {
  if (opportunityId) {
    try {
      console.log('Attempting to retrieve opportunity:', opportunityId);
      const store = getStore('opportunities');
      const opportunityData = await store.get(opportunityId);
      
      if (!opportunityData) {
        return errorResponse(404, 'Opportunity not found');
      }
      
      const opportunity = JSON.parse(opportunityData);
      return successResponse(opportunity);
    } catch (error) {
      console.error('Error getting opportunity from Blob Storage:', error);
      return errorResponse(500, 'Error getting opportunity');
    }
  } else {
    try {
      // Check for leadId query parameter
      const leadId = event?.queryStringParameters?.leadId;
      
      const store = getStore('opportunities');
      const { blobs } = await store.list();
      
      const opportunities = [];
      for (const blob of blobs) {
        try {
          const opportunityData = await store.get(blob.key);
          if (opportunityData) {
            const opportunity = JSON.parse(opportunityData);
            // If leadId is specified, filter by leadId
            if (!leadId || opportunity.leadId === leadId) {
              opportunities.push(opportunity);
            }
          }
        } catch (parseError) {
          console.error(`Error parsing opportunity ${blob.key}:`, parseError);
        }
      }
      
      return successResponse(opportunities);
    } catch (error) {
      console.error('Error listing opportunities from Blob Storage:', error);
      return errorResponse(500, 'Error listing opportunities');
    }
  }
};

// Create new opportunity
const handleCreateOpportunity = async (event: HandlerEvent): Promise<HandlerResponse> => {
  const body = parseBody(event);
  
  if (!body) {
    return errorResponse(400, 'Request body is required');
  }

  const missingFields = validateRequiredFields(body, ['title', 'amount', 'leadId']);
  if (missingFields.length > 0) {
    return errorResponse(400, `Missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate amount is a positive number
  const amount = parseFloat(body.amount);
  if (isNaN(amount) || amount < 0) {
    return errorResponse(400, 'Amount must be a positive number');
  }

  // Validate stage if provided
  const validStages = ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
  if (body.stage && validStages.indexOf(body.stage) === -1) {
    return errorResponse(400, `Invalid stage. Must be one of: ${validStages.join(', ')}`);
  }

  const opportunityId = crypto.randomUUID();
  const opportunity = {
    id: opportunityId,
    title: body.title,
    amount: amount,
    stage: body.stage || 'PROSPECT',
    leadId: body.leadId,
    assignedTo: body.assignedTo || null,
    createdAt: new Date().toISOString(),
  };

  try {
    const store = getStore('opportunities');
    await store.set(opportunityId, JSON.stringify(opportunity));
    return successResponse(opportunity, 'Opportunity created successfully');
  } catch (error) {
    console.error('Error creating opportunity in Blob Storage:', error);
    return errorResponse(500, 'Error creating opportunity');
  }
};

// Update opportunity
const handleUpdateOpportunity = async (
  opportunityId: string,
  event: HandlerEvent
): Promise<HandlerResponse> => {
  const body = parseBody(event);
  
  if (!body) {
    return errorResponse(400, 'Request body is required');
  }

  // Validate amount if provided
  if (body.amount !== undefined) {
    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount < 0) {
      return errorResponse(400, 'Amount must be a positive number');
    }
  }

  // Validate stage if provided
  const validStages = ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
  if (body.stage && validStages.indexOf(body.stage) === -1) {
    return errorResponse(400, `Invalid stage. Must be one of: ${validStages.join(', ')}`);
  }

  try {
    const store = getStore('opportunities');
    const opportunityData = await store.get(opportunityId);
    
    if (!opportunityData) {
      return errorResponse(404, 'Opportunity not found');
    }
    
    const opportunity = JSON.parse(opportunityData);

    // Update fields
    if (body.title) opportunity.title = body.title;
    if (body.amount !== undefined) opportunity.amount = parseFloat(body.amount);
    if (body.stage) opportunity.stage = body.stage;
    if (body.leadId) opportunity.leadId = body.leadId;
    if (body.assignedTo !== undefined) opportunity.assignedTo = body.assignedTo;
    
    // Add updated timestamp
    opportunity.updatedAt = new Date().toISOString();

    await store.set(opportunityId, JSON.stringify(opportunity));
    return successResponse(opportunity, 'Opportunity updated successfully');
  } catch (error) {
    console.error('Error updating opportunity in Blob Storage:', error);
    return errorResponse(500, 'Error updating opportunity');
  }
};

// Delete opportunity
const handleDeleteOpportunity = async (opportunityId: string): Promise<HandlerResponse> => {
  try {
    const store = getStore('opportunities');
    
    // Check if opportunity exists before deletion
    const opportunityData = await store.get(opportunityId);
    if (!opportunityData) {
      return errorResponse(404, 'Opportunity not found');
    }
    
    await store.delete(opportunityId);
    return successResponse(null, 'Opportunity deleted successfully');
  } catch (error) {
    console.error('Error deleting opportunity from Blob Storage:', error);
    return errorResponse(500, 'Error deleting opportunity');
  }
};