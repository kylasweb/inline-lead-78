import { AnalyticsResponse, ApiOpportunity, ApiResponse, SalesChartData, PipelineChartData, ActivityData } from '@/types/api';

// Mock data configuration utility
export const shouldUseMockData = (): boolean => {
  return import.meta.env.VITE_USE_MOCK_DATA === 'true';
};

// API Base URL for Netlify functions
const API_BASE = '/.netlify/functions';

// Generic API request function
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        // Add basic auth header if needed
        'Authorization': 'Bearer dummy-token', // Replace with actual auth logic
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    throw error;
  }
}

// Analytics API calls
export const analyticsApi = {
  async getAnalytics(): Promise<AnalyticsResponse> {
    return apiRequest<AnalyticsResponse>('/analytics');
  }
};

// Opportunities API calls
export const opportunitiesApi = {
  async getOpportunities(): Promise<ApiOpportunity[]> {
    return apiRequest<ApiOpportunity[]>('/opportunities');
  },

  async getOpportunity(id: string): Promise<ApiOpportunity> {
    return apiRequest<ApiOpportunity>(`/opportunities/${id}`);
  },

  async createOpportunity(data: Partial<ApiOpportunity>): Promise<ApiOpportunity> {
    return apiRequest<ApiOpportunity>('/opportunities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateOpportunity(id: string, data: Partial<ApiOpportunity>): Promise<ApiOpportunity> {
    return apiRequest<ApiOpportunity>(`/opportunities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteOpportunity(id: string): Promise<void> {
    return apiRequest<void>(`/opportunities/${id}`, {
      method: 'DELETE',
    });
  }
};

// Mock data for fallback/testing
export const mockAnalyticsData: AnalyticsResponse = {
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
};

export const mockSalesData: SalesChartData[] = [
  { month: 'Jan', revenue: 45000, leads: 120 },
  { month: 'Feb', revenue: 52000, leads: 145 },
  { month: 'Mar', revenue: 48000, leads: 135 },
  { month: 'Apr', revenue: 61000, leads: 160 },
  { month: 'May', revenue: 55000, leads: 150 },
  { month: 'Jun', revenue: 67000, leads: 180 },
];

export const mockPipelineData: PipelineChartData[] = [
  { name: 'Qualified', value: 35, color: '#8b5cf6' },
  { name: 'Proposal', value: 25, color: '#3b82f6' },
  { name: 'Negotiation', value: 20, color: '#06b6d4' },
  { name: 'Closed Won', value: 20, color: '#10b981' },
];

export const mockRecentActivities: ActivityData[] = [
  { id: 1, type: 'lead', message: 'New lead from TechCorp Inc.', time: '2 hours ago', color: 'text-neomorphism-blue' },
  { id: 2, type: 'deal', message: 'Deal closed with DataSystems Ltd.', time: '4 hours ago', color: 'text-green-600' },
  { id: 3, type: 'meeting', message: 'Meeting scheduled with CloudTech', time: '6 hours ago', color: 'text-neomorphism-violet' },
  { id: 4, type: 'follow-up', message: 'Follow-up call with InnovateSoft', time: '1 day ago', color: 'text-yellow-600' },
];

export const mockOpportunities: ApiOpportunity[] = [
  {
    id: '1',
    title: 'Cloud Infrastructure Upgrade',
    amount: 125000,
    stage: 'PROPOSAL',
    leadId: 'lead-1',
    assignedTo: 'user-1',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    lead: {
      id: 'lead-1',
      name: 'John Martinez',
      email: 'john@techcorp.com',
      company: 'TechCorp Inc.'
    },
    assignedUser: {
      id: 'user-1',
      name: 'Sarah Johnson',
      email: 'sarah@company.com'
    }
  },
  {
    id: '2',
    title: 'Security Audit & Implementation',
    amount: 85000,
    stage: 'NEGOTIATION',
    leadId: 'lead-2',
    assignedTo: 'user-2',
    createdAt: '2024-01-14T00:00:00Z',
    updatedAt: '2024-01-14T00:00:00Z',
    lead: {
      id: 'lead-2',
      name: 'Michael Chen',
      email: 'michael@datasystems.com',
      company: 'DataSystems Ltd.'
    },
    assignedUser: {
      id: 'user-2',
      name: 'Mike Wilson',
      email: 'mike@company.com'
    }
  },
  {
    id: '3',
    title: 'Digital Transformation Project',
    amount: 250000,
    stage: 'QUALIFIED',
    leadId: 'lead-3',
    assignedTo: 'user-1',
    createdAt: '2024-01-13T00:00:00Z',
    updatedAt: '2024-01-13T00:00:00Z',
    lead: {
      id: 'lead-3',
      name: 'Sarah Johnson',
      email: 'sarah@innovatesoft.com',
      company: 'InnovateSoft'
    },
    assignedUser: {
      id: 'user-1',
      name: 'Sarah Johnson',
      email: 'sarah@company.com'
    }
  },
  {
    id: '4',
    title: 'DevOps Automation Platform',
    amount: 95000,
    stage: 'PROPOSAL',
    leadId: 'lead-4',
    assignedTo: 'user-3',
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-12T00:00:00Z',
    lead: {
      id: 'lead-4',
      name: 'Emma Wilson',
      email: 'emma@cloudtech.com',
      company: 'CloudTech Solutions'
    },
    assignedUser: {
      id: 'user-3',
      name: 'David Brown',
      email: 'david@company.com'
    }
  }
];

// Data transformation utilities
export const transformAnalyticsToChartData = (analytics: AnalyticsResponse): {
  salesData: SalesChartData[];
  pipelineData: PipelineChartData[];
} => {
  // Transform opportunities by stage to pipeline chart data
  const pipelineData: PipelineChartData[] = analytics.opportunitiesByStage.map((stage, index) => {
    const colors = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#ef4444', '#f59e0b'];
    return {
      name: stage.stage.charAt(0) + stage.stage.slice(1).toLowerCase().replace('_', ' '),
      value: stage.count,
      color: colors[index] || '#6b7280'
    };
  });

  // For sales data, we'll use mock data since the API doesn't provide historical trends yet
  // In a real implementation, you'd request historical data from the API
  const salesData: SalesChartData[] = mockSalesData;

  return { salesData, pipelineData };
};

export const transformOpportunitiesToLocalFormat = (apiOpportunities: ApiOpportunity[]) => {
  return apiOpportunities.map(opp => ({
    id: parseInt(opp.id),
    title: opp.title,
    company: opp.lead?.company || 'Unknown Company',
    contact: opp.lead?.name || 'Unknown Contact',
    value: opp.amount,
    stage: opp.stage.toLowerCase().replace('_', '-') as 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost',
    probability: calculateProbabilityFromStage(opp.stage),
    expectedCloseDate: formatExpectedCloseDate(opp.updatedAt),
    lastActivity: formatLastActivity(opp.updatedAt),
    description: `${opp.title} for ${opp.lead?.company || 'client'}`
  }));
};

// Helper functions
const calculateProbabilityFromStage = (stage: string): number => {
  const probabilities: Record<string, number> = {
    'PROSPECT': 10,
    'QUALIFIED': 40,
    'PROPOSAL': 65,
    'NEGOTIATION': 80,
    'CLOSED_WON': 100,
    'CLOSED_LOST': 0
  };
  return probabilities[stage] || 0;
};

const formatExpectedCloseDate = (dateString: string): string => {
  const date = new Date(dateString);
  date.setMonth(date.getMonth() + 1); // Add a month for expected close
  return date.toISOString().split('T')[0];
};

const formatLastActivity = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};