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

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));

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
  let session = null;
  try {
    session = driver.session();
    if (opportunityId) {
      // Get specific opportunity
      const query = `MATCH (o:Opportunity {id: $opportunityId})
                     RETURN o`;
      const result = await session.run(query, { opportunityId });

      if (result.records.length === 0) {
        return errorResponse(404, 'Opportunity not found');
      }

      const opportunity = result.records[0].get('o').properties;
      return successResponse(opportunity);
    } else {
      // Check for leadId query parameter
      const leadId = event?.queryStringParameters?.leadId;

      let query = `MATCH (o:Opportunity) `;
      let params = {};

      if (leadId) {
        query += `WHERE o.leadId = $leadId `;
        params = { leadId };
      }

      query += `RETURN o`;

      const result = await session.run(query, params);
      const opportunities = result.records.map(record => record.get('o').properties);
      return successResponse(opportunities);
    }
  } catch (error) {
    console.error('Error getting opportunity from Neo4j:', error);
    return errorResponse(500, 'Error getting opportunity');
  } finally {
    if (session) {
      await session.close();
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

  let session = null;
  try {
    session = driver.session();
    const query = `CREATE (o:Opportunity {
      id: $id,
      title: $title,
      amount: $amount,
      stage: $stage,
      leadId: $leadId,
      assignedTo: $assignedTo,
      createdAt: $createdAt
    })
    RETURN o`;

    await session.run(query, opportunity);
    return successResponse(opportunity, 'Opportunity created successfully');
  } catch (error) {
    console.error('Error creating opportunity in Neo4j:', error);
    return errorResponse(500, 'Error creating opportunity');
  } finally {
    if (session) {
      await session.close();
    }
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

  let session = null;
  try {
    session = driver.session();
    // Fetch existing opportunity
    const fetchQuery = `MATCH (o:Opportunity {id: $opportunityId}) RETURN o`;
    const fetchResult = await session.run(fetchQuery, { opportunityId });

    if (fetchResult.records.length === 0) {
      return errorResponse(404, 'Opportunity not found');
    }

    const opportunity = fetchResult.records[0].get('o').properties;

    // Update fields
    if (body.title) opportunity.title = body.title;
    if (body.amount !== undefined) opportunity.amount = parseFloat(body.amount);
    if (body.stage) opportunity.stage = body.stage;
    if (body.leadId) opportunity.leadId = body.leadId;
    if (body.assignedTo !== undefined) opportunity.assignedTo = body.assignedTo;

    // Add updated timestamp
    opportunity.updatedAt = new Date().toISOString();

    // Update in Neo4j
    const updateQuery = `MATCH (o:Opportunity {id: $opportunityId})
                       SET o = $opportunity
                       RETURN o`;

    await session.run(updateQuery, { opportunityId, opportunity });
    return successResponse(opportunity, 'Opportunity updated successfully');
  } catch (error) {
    console.error('Error updating opportunity in Neo4j:', error);
    return errorResponse(500, 'Error updating opportunity');
  } finally {
    if (session) {
      await session.close();
    }
  }
};

// Delete opportunity
const handleDeleteOpportunity = async (opportunityId: string): Promise<HandlerResponse> => {
  const session = driver.session();
  try {
    // Check if opportunity exists before deletion
    const fetchQuery = `MATCH (o:Opportunity {id: $opportunityId}) RETURN o`;
    const fetchResult = await session.run(fetchQuery, { opportunityId });

    if (fetchResult.records.length === 0) {
      return errorResponse(404, 'Opportunity not found');
    }

    const query = `MATCH (o:Opportunity {id: $opportunityId})
                   DELETE o`;
    await session.run(query, { opportunityId });

    return successResponse(null, 'Opportunity deleted successfully');
  } catch (error) {
    console.error('Error deleting opportunity from Neo4j:', error);
    return errorResponse(500, 'Error deleting opportunity');
  } finally {
    if (session) {
      await session.close();
    }
  }
};