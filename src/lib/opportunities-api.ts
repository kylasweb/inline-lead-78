// Enhanced API utilities specifically for the OpportunityPipeline component
import { safeFetch, isDevelopment } from '@/lib/safer-api-utils';
import { opportunitiesApi as mockOpportunitiesApi, mockOpportunities } from '@/lib/api-utils';
import { ApiOpportunity } from '@/types/api';

// Local interface for the transformed opportunity data
export interface Opportunity {
  id: number;
  title: string;
  company: string;
  contact: string;
  value: number;
  stage: 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  expectedCloseDate: string;
  lastActivity: string;
  description: string;
}

/**
 * Transform API opportunities to the local format expected by the component
 */
export function transformOpportunitiesToLocalFormat(apiOpportunities: ApiOpportunity[]): Opportunity[] {
  return apiOpportunities.map((opp, index) => ({
    id: typeof opp.id === 'string' ? parseInt(opp.id.replace(/\D/g, '')) || (index + 1) : (index + 1),
    title: opp.title || '',
    company: opp.lead?.company || 'Unknown Company',
    contact: opp.lead?.name || 'Unknown Contact',
    value: opp.amount || 0,
    stage: mapApiStageToLocal(opp.stage),
    probability: calculateProbability(opp.stage),
    expectedCloseDate: new Date(Date.now() + (Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
    lastActivity: new Date(opp.updatedAt || opp.createdAt).toISOString().split('T')[0],
    description: `${opp.title} opportunity with ${opp.lead?.company || 'a company'}.`
  }));
}

/**
 * Map API stage values to local stage format
 */
function mapApiStageToLocal(stage: string): 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost' {
  const stageMap: { [key: string]: 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost' } = {
    'QUALIFIED': 'qualified',
    'PROPOSAL': 'proposal',
    'NEGOTIATION': 'negotiation',
    'CLOSED_WON': 'closed-won',
    'CLOSED_LOST': 'closed-lost',
    'PROSPECT': 'qualified'
  };
  
  return stageMap[stage] || 'qualified';
}

/**
 * Calculate probability based on the stage
 */
function calculateProbability(stage: string): number {
  const probabilityMap: { [key: string]: number } = {
    'QUALIFIED': 20,
    'PROPOSAL': 50,
    'NEGOTIATION': 80,
    'CLOSED_WON': 100,
    'CLOSED_LOST': 0,
    'PROSPECT': 10
  };
  
  return probabilityMap[stage] || 0;
}

/**
 * Fetch opportunities with proper error handling
 */
export async function fetchOpportunities(): Promise<Opportunity[]> {
  // Determine the correct endpoint based on environment
  const opportunitiesEndpoint = isDevelopment ? '/api/opportunities' : '/.netlify/functions/opportunities';
  
  try {
    console.log(`Fetching opportunities from ${opportunitiesEndpoint}...`);
    
    // Use the enhanced safe fetch for better error handling
    const result = await safeFetch<ApiOpportunity[]>(opportunitiesEndpoint);
    
    // Handle API errors
    if (!result.success) {
      console.error('API error fetching opportunities:', result.error);
      throw new Error(result.error || 'Failed to fetch opportunities');
    }
    
    // Verify that we have data
    if (!result.data) {
      console.error('No opportunities returned');
      throw new Error('No opportunities returned from API');
    }
    
    console.log('Opportunities fetched successfully');
    // Transform the data to the format expected by the component
    return transformOpportunitiesToLocalFormat(result.data);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    
    // As a fallback, return mock data when in development mode
    if (isDevelopment) {
      console.warn('Using mock opportunities data as fallback');
      return transformOpportunitiesToLocalFormat(mockOpportunities);
    }
    
    // In production, rethrow the error
    throw error;
  }
}
