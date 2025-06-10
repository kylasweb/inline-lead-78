// Enhanced API utilities specifically for the LeadManagement component
import { safeFetch, isDevelopment } from '@/lib/safer-api-utils';

// Lead interface matching the component's expectations
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  location: string;
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'nurturing' | 'converted' | 'lost' | 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'NURTURING' | 'CONVERTED' | 'LOST';
  source: string;
  lastContact: string;
  value: number;
  assignedStaff?: string;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt?: string;
  enrichmentData?: {
    companySize: string;
    industry: string;
    revenue: string;
    socialProfiles: string[];
    technologies: string[];
  };
  nurturingStage: 'awareness' | 'consideration' | 'decision' | 'retention';
  conversionTimeline: {
    createdAt: string;
    firstContact: string;
    qualified: string;
    proposal: string;
    closed: string;
  };
  activities: {
    id: number;
    type: 'email' | 'call' | 'meeting' | 'note';
    description: string;
    date: string;
    staff: string;
  }[];
  opportunityId?: string;
}

// API lead interface (simplified for this example)
interface ApiLead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  status: string;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Transform API lead data to the local format expected by the component
 */
function transformApiLeadToLocal(apiLead: ApiLead): Lead {
  return {
    id: apiLead.id,
    name: apiLead.name,
    email: apiLead.email,
    phone: apiLead.phone || '',
    company: apiLead.company || '',
    position: '',
    location: '',
    score: Math.floor(Math.random() * 50) + 50, // Random score between 50-100
    status: (apiLead.status?.toLowerCase() || 'new') as Lead['status'],
    source: 'Unknown',
    lastContact: '',
    value: 0,
    assignedStaff: '',
    assignedTo: apiLead.assignedTo,
    createdAt: apiLead.createdAt,
    updatedAt: apiLead.updatedAt,
    enrichmentData: undefined,
    nurturingStage: 'awareness',
    conversionTimeline: {
      createdAt: apiLead.createdAt?.split('T')[0] || '',
      firstContact: '',
      qualified: '',
      proposal: '',
      closed: ''
    },
    activities: []
  };
}

/**
 * Transform local lead data to the API format
 */
function transformLocalLeadToApi(lead: Partial<Lead>): Partial<ApiLead> {
  return {
    name: lead.name,
    email: lead.email,
    phone: lead.phone || null,
    company: lead.company || null,
    status: lead.status?.toUpperCase() || 'NEW',
    assignedTo: lead.assignedTo
  };
}

/**
 * Fetch all leads with proper error handling
 */
export async function fetchLeads(): Promise<Lead[]> {
  const leadsEndpoint = isDevelopment ? '/api/leads' : '/.netlify/functions/leads';
  
  try {
    console.log(`Fetching leads from ${leadsEndpoint}...`);
    
    const result = await safeFetch<ApiLead[]>(leadsEndpoint, {
      headers: {
        'Authorization': 'Bearer dummy-token'
      }
    });
    
    // Handle API errors
    if (!result.success) {
      console.error('API error fetching leads:', result.error);
      throw new Error(result.error || 'Failed to fetch leads data');
    }
    
    // Verify that we have data
    if (!result.data) {
      console.error('No leads data returned');
      throw new Error('No leads data returned from API');
    }
    
    console.log('Leads data fetched successfully');
    return result.data.map(transformApiLeadToLocal);
  } catch (error) {
    console.error('Error fetching leads:', error);
    
    // In development, return mock data
    if (isDevelopment) {
      console.warn('Using mock leads data as fallback');
      return mockLeadData();
    }
    
    // In production, return empty array to prevent UI errors
    return [];
  }
}

/**
 * Create a new lead
 */
export async function createLead(lead: Partial<Lead>): Promise<Lead> {
  const leadsEndpoint = isDevelopment ? '/api/leads' : '/.netlify/functions/leads';
  
  try {
    const apiLeadData = transformLocalLeadToApi(lead);
    
    console.log(`Creating lead at ${leadsEndpoint}...`, apiLeadData);
    
    const result = await safeFetch<ApiLead>(leadsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy-token'
      },
      body: JSON.stringify(apiLeadData)
    });
    
    // Handle API errors
    if (!result.success || !result.data) {
      console.error('API error creating lead:', result.error);
      throw new Error(result.error || 'Failed to create lead');
    }
    
    console.log('Lead created successfully');
    return transformApiLeadToLocal(result.data);
  } catch (error) {
    console.error('Error creating lead:', error);
    throw error;
  }
}

/**
 * Update an existing lead
 */
export async function updateLead(id: string, lead: Partial<Lead>): Promise<Lead> {
  const leadsEndpoint = isDevelopment ? `/api/leads/${id}` : `/.netlify/functions/leads/${id}`;
  
  try {
    const apiLeadData = transformLocalLeadToApi(lead);
    
    console.log(`Updating lead at ${leadsEndpoint}...`, apiLeadData);
    
    const result = await safeFetch<ApiLead>(leadsEndpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy-token'
      },
      body: JSON.stringify(apiLeadData)
    });
    
    // Handle API errors
    if (!result.success || !result.data) {
      console.error('API error updating lead:', result.error);
      throw new Error(result.error || 'Failed to update lead');
    }
    
    console.log('Lead updated successfully');
    return transformApiLeadToLocal(result.data);
  } catch (error) {
    console.error('Error updating lead:', error);
    throw error;
  }
}

/**
 * Delete a lead
 */
export async function deleteLead(id: string): Promise<void> {
  const leadsEndpoint = isDevelopment ? `/api/leads/${id}` : `/.netlify/functions/leads/${id}`;
  
  try {
    console.log(`Deleting lead at ${leadsEndpoint}...`);
    
    const result = await safeFetch<void>(leadsEndpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer dummy-token'
      }
    });
    
    // Handle API errors
    if (!result.success) {
      console.error('API error deleting lead:', result.error);
      throw new Error(result.error || 'Failed to delete lead');
    }
    
    console.log('Lead deleted successfully');
  } catch (error) {
    console.error('Error deleting lead:', error);
    throw error;
  }
}

/**
 * Client-side only operations for now
 */
export async function enrichLead(id: string): Promise<Lead> {
  console.log('Enriching lead:', id);
  // This would typically call an external enrichment service
  return {} as Lead;
}

export async function assignStaff(leadId: string, staffId: string): Promise<void> {
  console.log('Assigning staff:', leadId, staffId);
  // This would update the lead with assigned staff info
}

export async function addActivity(leadId: string, activity: Partial<Lead['activities'][0]>): Promise<void> {
  console.log('Adding activity:', leadId, activity);
  // This would typically be stored in a separate activities table
}

/**
 * Generate mock lead data for development
 */
function mockLeadData(): Lead[] {
  return [
    {
      id: '1',
      name: 'John Smith',
      email: 'john@techcorp.com',
      phone: '+1 (555) 123-4567',
      company: 'TechCorp Inc.',
      position: 'CTO',
      location: 'New York, NY',
      score: 87,
      status: 'qualified',
      source: 'website',
      lastContact: '2024-01-15',
      value: 75000,
      assignedStaff: 'Sarah Johnson',
      createdAt: '2024-01-01T00:00:00Z',
      nurturingStage: 'consideration',
      conversionTimeline: {
        createdAt: '2024-01-01',
        firstContact: '2024-01-02',
        qualified: '2024-01-15',
        proposal: '',
        closed: ''
      },
      activities: [
        {
          id: 1,
          type: 'email',
          description: 'Sent initial outreach email',
          date: '2024-01-02',
          staff: 'Sarah Johnson'
        },
        {
          id: 2,
          type: 'call',
          description: 'Discovery call - discussed needs',
          date: '2024-01-10',
          staff: 'Sarah Johnson'
        }
      ]
    },
    {
      id: '2',
      name: 'Lisa Wong',
      email: 'lisa@innovatesolutions.com',
      phone: '+1 (555) 987-6543',
      company: 'Innovate Solutions',
      position: 'Marketing Director',
      location: 'San Francisco, CA',
      score: 65,
      status: 'contacted',
      source: 'linkedin',
      lastContact: '2024-01-12',
      value: 45000,
      assignedStaff: 'David Brown',
      createdAt: '2024-01-05T00:00:00Z',
      nurturingStage: 'awareness',
      conversionTimeline: {
        createdAt: '2024-01-05',
        firstContact: '2024-01-12',
        qualified: '',
        proposal: '',
        closed: ''
      },
      activities: [
        {
          id: 1,
          type: 'email',
          description: 'Sent introduction email',
          date: '2024-01-12',
          staff: 'David Brown'
        }
      ]
    },
    {
      id: '3',
      name: 'Robert Johnson',
      email: 'robert@megacorp.com',
      phone: '+1 (555) 234-5678',
      company: 'MegaCorp Industries',
      position: 'CEO',
      location: 'Chicago, IL',
      score: 92,
      status: 'nurturing',
      source: 'referral',
      lastContact: '2024-01-18',
      value: 120000,
      assignedStaff: 'Emma Wilson',
      createdAt: '2023-12-15T00:00:00Z',
      nurturingStage: 'decision',
      conversionTimeline: {
        createdAt: '2023-12-15',
        firstContact: '2023-12-16',
        qualified: '2024-01-05',
        proposal: '2024-01-18',
        closed: ''
      },
      activities: [
        {
          id: 1,
          type: 'call',
          description: 'Initial call - high interest',
          date: '2023-12-16',
          staff: 'Emma Wilson'
        },
        {
          id: 2,
          type: 'meeting',
          description: 'Product demo meeting',
          date: '2024-01-05',
          staff: 'Emma Wilson'
        },
        {
          id: 3,
          type: 'email',
          description: 'Sent proposal',
          date: '2024-01-18',
          staff: 'Emma Wilson'
        }
      ]
    }
  ];
}

/**
 * Fetch opportunities (lightweight version for the lead management component)
 */
export async function fetchOpportunities(): Promise<{ id: string; name: string; value: number; stage: string; leadId: string; }[]> {
  const opportunitiesEndpoint = isDevelopment ? '/api/opportunities' : '/.netlify/functions/opportunities';
  
  try {
    console.log(`Fetching opportunities from ${opportunitiesEndpoint}...`);
    
    const result = await safeFetch<any[]>(opportunitiesEndpoint);
    
    // Handle API errors
    if (!result.success) {
      console.error('API error fetching opportunities:', result.error);
      throw new Error(result.error || 'Failed to fetch opportunities data');
    }
    
    // Verify that we have data
    if (!result.data) {
      console.error('No opportunities data returned');
      throw new Error('No opportunities data returned from API');
    }
    
    console.log('Opportunities data fetched successfully');
    
    // Transform the API response to match the component's expectations
    return result.data.map((opp: any) => ({
      id: opp.id || '',
      name: opp.title || opp.name || '',
      value: parseFloat(opp.amount) || 0,
      stage: opp.stage || '',
      leadId: opp.leadId || ''
    }));
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    
    // In development, return mock data
    if (isDevelopment) {
      console.warn('Using mock opportunities data as fallback');
      return mockOpportunityData();
    }
    
    // In production, return empty array to prevent UI errors
    return [];
  }
}

/**
 * Generate mock opportunity data for development
 */
function mockOpportunityData(): { id: string; name: string; value: number; stage: string; leadId: string; }[] {
  return [
    {
      id: '1',
      name: 'Enterprise Software Solution',
      value: 75000,
      stage: 'QUALIFIED',
      leadId: '1'
    },
    {
      id: '2',
      name: 'Marketing Automation Platform',
      value: 45000,
      stage: 'PROPOSAL',
      leadId: '2'
    },
    {
      id: '3',
      name: 'Executive Consulting Services',
      value: 120000,
      stage: 'NEGOTIATION',
      leadId: '3'
    }
  ];
}
