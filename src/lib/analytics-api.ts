// Enhanced API utilities specifically for the Analytics component
import { safeFetch, isDevelopment } from '@/lib/safer-api-utils';
import { analyticsApi as mockAnalyticsApi } from '@/lib/api-utils';

// Analytics data interface
interface AnalyticsData {
  overview: {
    totalRevenue: number;
    revenueChange: number;
    totalLeads: number;
    leadsChange: number;
    conversionRate: number;
    conversionChange: number;
    totalOpportunities: number;
    opportunitiesChange: number;
  };
  salesTrend: Array<{
    month: string;
    revenue: number;
    opportunities: number;
    leads: number;
  }>;
  leadSources: Array<{
    source: string;
    count: number;
    color: string;
  }>;
  departmentPerformance: Array<{
    department: string;
    revenue: number;
    deals: number;
    performance: number;
  }>;
  topPerformers: Array<{
    name: string;
    revenue: number;
    deals: number;
    performance: number;
  }>;
}

/**
 * Fetch analytics data with proper error handling and path normalization
 * @param timeframe The time period to fetch analytics for
 */
export async function fetchAnalyticsData(timeframe: string): Promise<AnalyticsData> {
  // Determine the correct endpoint based on environment
  const analyticsEndpoint = isDevelopment 
    ? `/api/analytics?timeframe=${timeframe}` 
    : `/.netlify/functions/analytics?timeframe=${timeframe}`;
  
  try {
    console.log(`Fetching analytics data from ${analyticsEndpoint}...`);
    
    // Use the enhanced safe fetch for better error handling
    const result = await safeFetch<AnalyticsData>(analyticsEndpoint);
    
    // Handle API errors
    if (!result.success) {
      console.error('API error fetching analytics:', result.error);
      throw new Error(result.error || 'Failed to fetch analytics data');
    }
    
    // Verify that we have data
    if (!result.data) {
      console.error('No analytics data returned');
      throw new Error('No analytics data returned from API');
    }
    
    console.log('Analytics data fetched successfully');
    return result.data;
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    
    // As a fallback, return mock data when in development mode
    if (isDevelopment) {
      console.warn('Using mock analytics data as fallback');
      return mockAnalyticsApi.getData(timeframe);
    }
    
    // In production, rethrow the error
    throw error;
  }
}
