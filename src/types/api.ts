// API Response Types

export interface AnalyticsOverview {
  totalLeads: number;
  totalOpportunities: number;
  totalUsers: number;
  totalRevenue: number;
  conversionRate: number;
  winRate: number;
  averageDealSize: number;
}

export interface LeadByStatus {
  status: string;
  count: number;
}

export interface OpportunityByStage {
  stage: string;
  count: number;
  totalValue: number;
}

export interface UserPerformance {
  id: string;
  name: string;
  email: string;
  assignedLeads: number;
  assignedOpportunities: number;
}

export interface AnalyticsTrends {
  leadTrend: 'up' | 'down' | 'stable';
  revenueTrend: 'up' | 'down' | 'stable';
  conversionTrend: 'up' | 'down' | 'stable';
}

export interface AnalyticsResponse {
  overview: AnalyticsOverview;
  leadsByStatus: LeadByStatus[];
  opportunitiesByStage: OpportunityByStage[];
  userPerformance: UserPerformance[];
  trends: AnalyticsTrends;
}

// Opportunity API Types
export interface ApiOpportunity {
  id: string;
  title: string;
  amount: number;
  stage: 'PROSPECT' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
  leadId: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  lead?: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
  assignedUser?: {
    id: string;
    name: string;
    email: string;
  };
}

// Chart data types for the Dashboard
export interface SalesChartData {
  month: string;
  revenue: number;
  leads: number;
}

export interface PipelineChartData {
  name: string;
  value: number;
  color: string;
}

export interface ActivityData {
  id: number;
  type: string;
  message: string;
  time: string;
  color: string;
}

// Mock data configuration
export interface MockDataConfig {
  useMockData: boolean;
}

// API Error Response
export interface ApiError {
  message: string;
  status: number;
}

// Generic API Response
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}