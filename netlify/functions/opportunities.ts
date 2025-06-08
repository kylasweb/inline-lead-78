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
  // return withDatabase(async () => { // Removed withDatabase
    if (opportunityId) {
      console.log('Attempting to retrieve opportunity:', opportunityId);
      // Get specific opportunity
      // const opportunity = await db.opportunity.findById(opportunityId); // Removed db usage
      // if (!opportunity) {
      //   return errorResponse(404, 'Opportunity not found');
      // }
      // return successResponse(opportunity);
      return errorResponse(500, 'Not implemented yet'); // Placeholder
    } else {
      // Check for leadId query parameter
      const leadId = event?.queryStringParameters?.leadId;
      
      if (leadId) {
        // Get opportunities for specific lead
        // const opportunities = await db.opportunity.findByLead(leadId); // Removed db usage
        // return successResponse(opportunities);
        return errorResponse(500, 'Not implemented yet'); // Placeholder
      } else {
        // Get all opportunities
        // const opportunities = await db.opportunity.findMany(); // Removed db usage
        // return successResponse(opportunities);
        return errorResponse(500, 'Not implemented yet'); // Placeholder
      }
    }
  // }); // Removed withDatabase
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

  // Validate lead exists
  // const lead = await db.lead.findById(body.leadId); // Removed db usage
  // if (!lead) {
  //   return errorResponse(400, 'Lead does not exist');
  // }

  // Validate assignedTo user exists if provided
  // if (body.assignedTo) {
  //   const assignedUser = await db.user.findById(body.assignedTo); // Removed db usage
  //   if (!assignedUser) {
  //     return errorResponse(400, 'Assigned user does not exist');
  //   }
  // }

  // Validate stage if provided
  const validStages = ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
  if (body.stage && validStages.indexOf(body.stage) === -1) {
    return errorResponse(400, `Invalid stage. Must be one of: ${validStages.join(', ')}`);
  }

  // return withDatabase(async () => { // Removed withDatabase
    try {
      // const opportunity = await db.opportunity.create({ // Removed db usage
      //   title: body.title,
      //   amount: amount,
      //   stage: body.stage || 'PROSPECT',
      //   leadId: body.leadId,
      //   assignedTo: body.assignedTo || null,
      // });
      // return successResponse(opportunity, 'Opportunity created successfully');
      return errorResponse(500, 'Not implemented yet'); // Placeholder
    } catch (error: any) {
      throw error;
    }
  // }); // Removed withDatabase
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

  // Validate assignedTo user exists if provided
  // if (body.assignedTo) {
  //   const assignedUser = await db.user.findById(body.assignedTo); // Removed db usage
  //   if (!assignedUser) {
  //     return errorResponse(400, 'Assigned user does not exist');
  //   }
  // }

  // Validate stage if provided
  const validStages = ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
  if (body.stage && validStages.indexOf(body.stage) === -1) {
    return errorResponse(400, `Invalid stage. Must be one of: ${validStages.join(', ')}`);
  }

  // return withDatabase(async () => { // Removed withDatabase
    try {
      // Check if opportunity exists
      // const existingOpportunity = await db.opportunity.findById(opportunityId); // Removed db usage
      // if (!existingOpportunity) {
      //   return errorResponse(404, 'Opportunity not found');
      // }

      // const updateData: any = {};
      // if (body.title) updateData.title = body.title;
      // if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
      // if (body.stage) updateData.stage = body.stage;
      // if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;

      // const opportunity = await db.opportunity.update(opportunityId, updateData); // Removed db usage
      // return successResponse(opportunity, 'Opportunity updated successfully');
      return errorResponse(500, 'Not implemented yet'); // Placeholder
    } catch (error: any) {
      throw error;
    }
  // }); // Removed withDatabase
};

// Delete opportunity
const handleDeleteOpportunity = async (opportunityId: string): Promise<HandlerResponse> => {
  // return withDatabase(async () => { // Removed withDatabase
    try {
      // Check if opportunity exists
      // const existingOpportunity = await db.opportunity.findById(opportunityId); // Removed db usage
      // if (!existingOpportunity) {
      //   return errorResponse(404, 'Opportunity not found');
      // }

      // await db.opportunity.delete(opportunityId); // Removed db usage
      // return successResponse(null, 'Opportunity deleted successfully');
      return errorResponse(500, 'Not implemented yet'); // Placeholder
    } catch (error: any) {
      throw error;
    }
  // }); // Removed withDatabase
};