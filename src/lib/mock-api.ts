// Mock API handlers for development environment
// This file provides mock implementations of the Netlify Functions API for local development

import { v4 as uuidv4 } from 'uuid';

// In-memory storage for mock data
const mockDatabase = {
  leads: [
    {
      id: '1',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '555-123-4567',
      company: 'Acme Inc',
      status: 'NEW',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '555-987-6543',
      company: 'Tech Solutions',
      status: 'CONTACTED',
      createdAt: new Date().toISOString(),
    }
  ],
  opportunities: [
    {
      id: '1',
      title: 'Website Redesign',
      amount: '5000',
      stage: 'proposal',
      leadId: '1',
    },
    {
      id: '2',
      title: 'CRM Implementation',
      amount: '12000',
      stage: 'negotiation',
      leadId: '2',
    }
  ],  analytics: {
    overview: {
      totalLeads: 1247,
      totalOpportunities: 89,
      totalUsers: 15,
      totalRevenue: 67000,
      conversionRate: 24.8,
      winRate: 22.5,
      averageDealSize: 75000
    },
    leadsByStatus: [
      { status: 'NEW', count: 45 },
      { status: 'QUALIFIED', count: 32 },
      { status: 'CONTACTED', count: 28 },
      { status: 'CONVERTED', count: 20 }
    ],
    opportunitiesByStage: [
      { stage: 'QUALIFIED', count: 35, totalValue: 125000 },
      { stage: 'PROPOSAL', count: 25, totalValue: 95000 },
      { stage: 'NEGOTIATION', count: 20, totalValue: 85000 },
      { stage: 'CLOSED_WON', count: 20, totalValue: 250000 }
    ],
    userPerformance: [
      { id: '1', name: 'John Doe', email: 'john@example.com', assignedLeads: 45, assignedOpportunities: 12 },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', assignedLeads: 38, assignedOpportunities: 10 }
    ],
    trends: {
      leadTrend: 'up',
      revenueTrend: 'up',
      conversionTrend: 'stable'
    }
  }
};

// Helper function to create a mock response
const mockResponse = (data: any, message?: string) => {
  return {
    success: true,
    data,
    message
  };
};

// Mock API handlers
export const mockApiHandlers = {
  // Leads API
  'GET /api/leads': () => {
    return mockResponse(mockDatabase.leads);
  },
  'GET /api/leads/:id': (id: string) => {
    const lead = mockDatabase.leads.find(l => l.id === id);
    if (!lead) {
      throw new Error('Lead not found');
    }
    return mockResponse(lead);
  },
  'POST /api/leads': (data: any) => {
    const newLead = {
      id: uuidv4(),
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      company: data.company || '',
      status: data.status || 'NEW',
      createdAt: new Date().toISOString(),
    };
    mockDatabase.leads.push(newLead);
    return mockResponse(newLead, 'Lead created successfully');
  },
  'PUT /api/leads/:id': (id: string, data: any) => {
    const index = mockDatabase.leads.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error('Lead not found');
    }
    
    mockDatabase.leads[index] = {
      ...mockDatabase.leads[index],
      ...data,
    };
    
    return mockResponse(mockDatabase.leads[index], 'Lead updated successfully');
  },
  'DELETE /api/leads/:id': (id: string) => {
    const index = mockDatabase.leads.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error('Lead not found');
    }
    mockDatabase.leads.splice(index, 1);
    return mockResponse(null, 'Lead deleted successfully');
  },

  // Opportunities API
  'GET /api/opportunities': () => {
    return mockResponse(mockDatabase.opportunities);
  },
  'GET /api/opportunities/:id': (id: string) => {
    const opportunity = mockDatabase.opportunities.find(o => o.id === id);
    if (!opportunity) {
      throw new Error('Opportunity not found');
    }
    return mockResponse(opportunity);
  },
    // Analytics API
  'GET /api/analytics': () => {
    console.log('Mock API: Serving analytics data');
    return mockResponse(mockDatabase.analytics, 'Analytics data retrieved successfully');
  },
  
  // Also handle Netlify function path format for consistency
  'GET /.netlify/functions/analytics': () => {
    console.log('Mock API: Serving analytics data (Netlify path)');
    return mockResponse(mockDatabase.analytics, 'Analytics data retrieved successfully');
  },
};

// Mock API request handler
export async function handleMockApiRequest(url: string, options?: RequestInit): Promise<Response> {
  console.log(`📡 Mock API request: ${options?.method || 'GET'} ${url}`);
    try {
    // Extract the path and ID from the URL
    const fullPath = url.split('?')[0]; // Remove query parameters    // Normalize the path - support both /api and /.netlify/functions patterns
    const normalizedPath = fullPath.replace(/^\/api\/|^\/.netlify\/functions\//, '/api/');
    
    // Log the normalized path for debugging
    console.log(`📍 Normalized path: ${normalizedPath} (original: ${fullPath})`);
    
    // Extract the resource name and potential ID
    const pathParts = normalizedPath.split('/').filter(Boolean); // Remove empty parts
    
    let resource = '';
    let id: string | null = null;
    
    if (pathParts.length >= 2) {
      resource = pathParts[1]; // 'leads', 'opportunities', etc.
      if (pathParts.length >= 3) {
        id = pathParts[2]; // The ID if present
      }
    }
    
    // Create route pattern for handler lookup
    let route = `/api/${resource}`;
    if (id) {
      route = `/api/${resource}/:id`;
    }
    
    const method = options?.method || 'GET';
    const handlerKey = `${method} ${route}`;
    
    console.log(`🔍 Looking for handler: ${handlerKey}, ID: ${id}`);
    
    // Find the handler
    // Use type assertion to prevent TypeScript errors with dynamic keys
    const handler = mockApiHandlers[handlerKey as keyof typeof mockApiHandlers];
    
    if (!handler) {
      console.error(`❌ No handler found for ${handlerKey}`);
      return new Response(JSON.stringify({
        success: false,
        error: `Endpoint not found: ${method} ${route}`
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Extract body data
    let bodyData: any = null;
    if (options?.body) {
      try {
        bodyData = JSON.parse(options.body.toString());
      } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Execute handler
    let result;
    try {
      if (id) {
        result = bodyData ? handler(id, bodyData) : handler(id);
      } else {
        result = bodyData ? handler(bodyData) : handler();
      }
    } catch (handlerError) {
      console.error('Error in mock handler:', handlerError);
      return new Response(JSON.stringify({
        success: false,
        error: handlerError instanceof Error ? handlerError.message : 'Error processing request'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return the response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`❌ Mock API error:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: error instanceof Error && error.message.includes('not found') ? 404 : 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
