// Enhanced API utilities specifically for the Dashboard component
import { AnalyticsResponse } from '@/types/api';
import { safeFetch, isDevelopment, normalizeApiPath } from '@/lib/safer-api-utils';
import { mockAnalyticsData } from '@/lib/api-utils';

/**
 * Fetch analytics data with proper error handling and path normalization
 */
export async function fetchAnalyticsData(): Promise<AnalyticsResponse> {
  // Determine the correct endpoint based on environment
  const analyticsEndpoint = isDevelopment ? '/api/analytics' : '/.netlify/functions/analytics';
  
  try {
    console.log(`Fetching analytics data from ${analyticsEndpoint}...`);
    
    // Use the enhanced safe fetch for better error handling
    const result = await safeFetch<AnalyticsResponse>(analyticsEndpoint);
    
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
    
    console.log('Analytics data fetched successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    
    // As a fallback, return mock data when in development mode
    if (isDevelopment) {
      console.warn('Using mock analytics data as fallback');
      return mockAnalyticsData;
    }
    
    // In production, propagate the error
    throw error;
  }
}
