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
import { db, withDatabase } from './utils/db';

// Analytics API Handler
export const handler = async (
  event: HandlerEvent,
  context: HandlerContext
): Promise<HandlerResponse> => {
  logRequest(event, context);

  console.log(`HTTP Method: ${event.httpMethod}`);
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }
  
  console.log("Authenticating request...");
  // Basic authentication check
  if (!authenticateRequest(event)) {
    return errorResponse(401, 'Unauthorized');
  }
  // Only support GET requests for analytics
  if (event.httpMethod !== 'GET') {
    return errorResponse(405, 'Method not allowed');
  }

  try {
    console.log("Handling analytics request...");
    return await handleGetAnalytics(event);
  } catch (error) {
    console.error('Analytics API error:', error);
    return errorResponse(500, 'Internal server error');
  }
};

// Get analytics data
const handleGetAnalytics = async (event: HandlerEvent): Promise<HandlerResponse> => {
  console.log("Calling withDatabase...");
  return withDatabase(async () => {
    try {
      console.log("Fetching analytics data from database...");
      // Get all analytics data in parallel
      const [
        leadsByStatus,
        opportunitiesByStage,
        totalRevenue,
        userStats,
        totalCounts
      ] = await Promise.all([
        db.analytics.getLeadsByStatus(),
        db.analytics.getOpportunitiesByStage(),
        db.analytics.getTotalRevenue(),
        db.analytics.getUserStats(),
        getTotalCounts()
      ]);

      // Calculate conversion rates
      const totalLeads = totalCounts.leads;
      const totalOpportunities = totalCounts.opportunities;
      const conversionRate = totalLeads > 0 ? (totalOpportunities / totalLeads) * 100 : 0;

      // Calculate win rate
      const closedWonOpportunities = opportunitiesByStage.find(
        stage => stage.stage === 'CLOSED_WON'
      );
      const winRate = totalOpportunities > 0 
        ? ((closedWonOpportunities?._count?.stage || 0) / totalOpportunities) * 100 
        : 0;      // Calculate average deal size
      const totalRevenueAmount = Number(totalRevenue._sum.amount) || 0;
      const averageDealSize = totalOpportunities > 0 ? totalRevenueAmount / totalOpportunities : 0;

      // Format response data
      const analytics = {
        overview: {
          totalLeads: totalCounts.leads,
          totalOpportunities: totalCounts.opportunities,
          totalUsers: totalCounts.users,
          totalRevenue: totalRevenueAmount,
          conversionRate: Math.round(conversionRate * 100) / 100,
          winRate: Math.round(winRate * 100) / 100,
          averageDealSize: Math.round(averageDealSize * 100) / 100
        },
        leadsByStatus: leadsByStatus.map(item => ({
          status: item.status,
          count: item._count.status
        })),
        opportunitiesByStage: opportunitiesByStage.map(item => ({
          stage: item.stage,
          count: item._count.stage,
          totalValue: item._sum.amount || 0
        })),
        userPerformance: userStats.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          assignedLeads: user._count.assignedLeads,
          assignedOpportunities: user._count.assignedOpportunities
        })),
        trends: {
          // Placeholder for time-based trends
          // In a real implementation, you'd calculate monthly/weekly trends
          leadTrend: 'up', // or 'down', 'stable'
          revenueTrend: 'up',
          conversionTrend: 'stable'
        }
      };

      return successResponse(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  });
};

// Helper function to get total counts
const getTotalCounts = async () => {
  const [users, leads, opportunities] = await Promise.all([
    db.user.findMany(),
    db.lead.findMany(),
    db.opportunity.findMany()
  ]);

  return {
    users: users.length,
    leads: leads.length,
    opportunities: opportunities.length
  };
};