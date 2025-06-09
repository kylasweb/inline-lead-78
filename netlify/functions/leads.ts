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
// Removed blob import

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

// Initialize Neo4j Driver
const initNeo4j = () => {
  const neo4jUri = process.env.NEO4J_URI;
  if (!neo4jUri) {
    throw new Error('NEO4J_URI environment variable is not set.');
  }

  const driver = neo4j.driver(
    neo4jUri,
    neo4j.auth.basic(
      process.env.NEO4J_USERNAME || 'neo4j',
      process.env.NEO4J_PASSWORD || 'password'
    )
  );
  return driver;
};

const driver = initNeo4j();

// Get leads (all or specific lead)
const handleGetLeads = async (leadId?: string | null): Promise<HandlerResponse> => {
  let session = null;
  try {
    session = driver.session();
    if (leadId) {
      // Get specific lead
      const query = `MATCH (l:Lead {id: $leadId})
                     RETURN l`;
      const result = await session.run(query, { leadId });

      if (result.records.length === 0) {
        return errorResponse(404, 'Lead not found');
      }

      const lead = result.records[0].get('l').properties;
      return successResponse(lead);
    } else {
      // Get all leads
      const query = `MATCH (l:Lead)
                     RETURN l`;
      const result = await session.run(query);

      const leads = result.records.map(record => record.get('l').properties);
      return successResponse(leads);
    }
  }  catch (error) {
    console.error('Error getting lead from Neo4j:', error);
    return errorResponse(500, 'Error getting lead');
  } finally {
     if (session) {
      await session.close();
    }
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
    createdAt: new Date().toISOString(),
  };

  let session = null;
  try {
    session = driver.session();
    const query = `CREATE (l:Lead {
      id: $leadId,
      name: $name,
      email: $email,
      phone: $phone,
      company: $company,
      status: $status,
      assignedTo: $assignedTo,
      createdAt: $createdAt
    })
    RETURN l`;

    await session.run(query, lead);
    return successResponse(lead, 'Lead created successfully');
  } catch (error) {
    console.error('Error creating lead in Neo4j:', error);
    return errorResponse(500, 'Error creating lead');
  } finally {
   if (session) {
      await session.close();
    }
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

  let session = null;
  try {
    session = driver.session();
    // Fetch existing lead
    const fetchQuery = `MATCH (l:Lead {id: $leadId}) RETURN l`;
    const fetchResult = await session.run(fetchQuery, { leadId });

    if (fetchResult.records.length === 0) {
      return errorResponse(404, 'Lead not found');
    }

    const lead = fetchResult.records[0].get('l').properties;

    // Update fields
    if (body.name) lead.name = body.name;
    if (body.email) lead.email = body.email;
    if (body.phone !== undefined) lead.phone = body.phone;
    if (body.company !== undefined) lead.company = body.company;
    if (body.status) lead.status = body.status;
    if (body.assignedTo !== undefined) lead.assignedTo = body.assignedTo;

    // Add updated timestamp
    lead.updatedAt = new Date().toISOString();

    // Update in Neo4j
    const updateQuery = `MATCH (l:Lead {id: $leadId})
                       SET l = $lead
                       RETURN l`;

    await session.run(updateQuery, { leadId, lead });
    return successResponse(lead, 'Lead updated successfully');
  }  catch (error) {
    console.error('Error updating lead in Neo4j:', error);
    return errorResponse(500, 'Error updating lead');
  } finally {
     if (session) {
      await session.close();
    }
  }
};

// Delete lead
const handleDeleteLead = async (leadId: string): Promise<HandlerResponse> => {
  let session = null;
  try {
    session = driver.session();
    // Check if lead exists before deletion
    const fetchQuery = `MATCH (l:Lead {id: $leadId}) RETURN l`;
    const fetchResult = await session.run(fetchQuery, { leadId });

    if (fetchResult.records.length === 0) {
      return errorResponse(404, 'Lead not found');
    }

    const query = `MATCH (l:Lead {id: $leadId})
                   DELETE l`;
    await session.run(query, { leadId });

    return successResponse(null, 'Lead deleted successfully');
  }  catch (error) {
    console.error('Error deleting lead from Neo4j:', error);
    return errorResponse(500, 'Error deleting lead');
  } finally {
    if (session) {
      await session.close();
    }
  }
};