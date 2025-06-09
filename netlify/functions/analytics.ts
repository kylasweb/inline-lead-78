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
import { blobDb, withBlobDatabase } from './utils/blob-db';

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
  console.log("Calling withBlobDatabase...");
  return withBlobDatabase(async () => {
    try {
      console.log("handleGetAnalytics: Fetching analytics data from blob storage...");
      // Log start time
      const startTime = Date.now();
      
      // Get all analytics data in parallel
      console.log("handleGetAnalytics: Getting leads by status...");
      const [
        leadsByStatus,
        opportunitiesByStage,
        totalRevenue,
        userStats,
        totalCounts
      ] = await Promise.all([
        (async () => {
          try {
            console.log("handleGetAnalytics: Getting leadsByStatus...");
            return await blobDb.analytics.getLeadsByStatus();
          } catch (e) {
            console.error("handleGetAnalytics: Error getting leadsByStatus:", e);
            return [];
          }
        })(),
        (async () => {
          try{
            console.log("handleGetAnalytics: Getting opportunitiesByStage...");
            return await blobDb.analytics.getOpportunitiesByStage();
          } catch (e) {
            console.error("handleGetAnalytics: Error getting opportunitiesByStage:", e);
            return [];
          }
        })(),
        (async () => {
          try {
            console.log("handleGetAnalytics: Getting totalRevenue...");
            return await blobDb.analytics.getTotalRevenue();
          } catch (e) {
            console.error("handleGetAnalytics: Error getting totalRevenue:", e);
            return { _sum: { amount: 0 }};
          }
        })(),
        (async () => {
          try {
            console.log("handleGetAnalytics: Getting userStats...");
            return await blobDb.analytics.getUserStats();
          } catch (e) {
            console.error("handleGetAnalytics: Error getting userStats:", e);
            return [];
          }
        })(),
        (async () => {
          try {
            console.log("handleGetAnalytics: Getting totalCounts...");
            return await getTotalCounts();
          } catch (e) {
            console.error("handleGetAnalytics: Error getting totalCounts:", e);
            return { users: 0, leads: 0, opportunities: 0 };
          }
        })()
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
        : 0;
      
      // Calculate average deal size
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
      console.error('handleGetAnalytics: Error fetching analytics:', error);
      return errorResponse(500, 'Internal server error');
    }
  });
};

const getTotalCounts = async () => {
  try {
    console.log("getTotalCounts: Getting user, lead, and opportunity counts...");
    const [users, leads, opportunities] = await Promise.all([
      blobDb.user.findMany(),
      blobDb.lead.findMany(),
      blobDb.opportunity.findMany()
    ]);
    return {
      users: users.length,
      leads: leads.length,
      opportunities: opportunities.length
    };
  } catch (error) {
    console.error("getTotalCounts: Error getting counts:", error);
    return { users: 0, leads: 0, opportunities: 0 };
  }
};