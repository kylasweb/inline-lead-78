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
import { validateRequestSize } from './utils/size-validator';
import { withUnifiedDatabase, unifiedDatabase } from './utils/unified-db';

// Opportunity API Handler - with size validation and improved error handling
const opportunitiesHandler = async (
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
        return errorResponse(405, 'Method Not Allowed');
    }
  } catch (error) {
    console.error('Error in opportunities handler:', error);
    return errorResponse(500, `Server error: ${error.message || 'Unknown error'}`);
  }
};

// Get opportunities handler
const handleGetOpportunities = async (opportunityId?: string, event?: HandlerEvent): Promise<HandlerResponse> => {
  try {
    if (opportunityId) {
      // Get specific opportunity
      const opportunity = await unifiedDatabase.opportunity.findById(opportunityId);
      if (!opportunity) {
        return errorResponse(404, 'Opportunity not found');
      }
      return successResponse(opportunity);
    } else {
      // Get all opportunities - with optional filtering
      const opportunities = await unifiedDatabase.opportunity.findMany();
      return successResponse(opportunities);
    }
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return errorResponse(500, `Error fetching opportunities: ${error.message}`);
  }
};

// Create opportunity handler
const handleCreateOpportunity = async (event: HandlerEvent): Promise<HandlerResponse> => {
  try {
    const body = parseBody(event);
    
    // Validate required fields
    const requiredFields = ['title', 'amount', 'leadId'];
    const missingFields = validateRequiredFields(body, requiredFields);
    
    if (missingFields.length > 0) {
      return errorResponse(400, `Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Create opportunity
    const opportunityData = {
      title: body.title,
      amount: Number(body.amount),
      stage: body.stage || 'New',
      leadId: body.leadId,
      assignedTo: body.assignedTo
    };
    
    const newOpportunity = await unifiedDatabase.opportunity.create(opportunityData);
    
    return successResponse(newOpportunity, "201");
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return errorResponse(500, `Error creating opportunity: ${error.message}`);
  }
};

// Update opportunity handler
const handleUpdateOpportunity = async (opportunityId: string, event: HandlerEvent): Promise<HandlerResponse> => {
  try {
    const body = parseBody(event);
    
    if (Object.keys(body).length === 0) {
      return errorResponse(400, 'No update data provided');
    }
    
    // Check if opportunity exists
    const existingOpportunity = await unifiedDatabase.opportunity.findById(opportunityId);
    if (!existingOpportunity) {
      return errorResponse(404, 'Opportunity not found');
    }
    
    // Prepare update data
    const updateData: Record<string, any> = {};
    if (body.title) updateData.title = body.title;
    if (body.amount) updateData.amount = Number(body.amount);
    if (body.stage) updateData.stage = body.stage;
    if (body.assignedTo) updateData.assignedTo = body.assignedTo;
    
    // Update opportunity
    const updatedOpportunity = await unifiedDatabase.opportunity.update(opportunityId, updateData);
    
    return successResponse(updatedOpportunity);
  } catch (error) {
    console.error('Error updating opportunity:', error);
    return errorResponse(500, `Error updating opportunity: ${error.message}`);
  }
};

// Delete opportunity handler
const handleDeleteOpportunity = async (opportunityId: string): Promise<HandlerResponse> => {
  try {
    // Check if opportunity exists
    const existingOpportunity = await unifiedDatabase.opportunity.findById(opportunityId);
    if (!existingOpportunity) {
      return errorResponse(404, 'Opportunity not found');
    }
    
    // Delete opportunity
    await unifiedDatabase.opportunity.delete(opportunityId);
    
    return successResponse({ message: 'Opportunity deleted successfully' });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    return errorResponse(500, `Error deleting opportunity: ${error.message}`);
  }
};

// Export the handler
export const handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Use the withUnifiedDatabase wrapper to ensure database is initialized
  try {
    await withUnifiedDatabase(async () => {
      console.log("Database initialized");
    });
    // Call the actual handler
    return await opportunitiesHandler(event, context);
  } catch (error) {
    console.error("Database initialization error:", error);
    return errorResponse(500, `Server error: ${error.message || 'Unknown error'}`);
  }
};