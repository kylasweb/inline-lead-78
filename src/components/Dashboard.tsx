import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Briefcase, 
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  Activity,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  analyticsApi, 
  shouldUseMockData, 
  mockAnalyticsData, 
  mockSalesData, 
  mockPipelineData, 
  mockRecentActivities,
  transformAnalyticsToChartData 
} from '@/lib/api-utils';
import { AnalyticsResponse, SalesChartData, PipelineChartData, ActivityData } from '@/types/api';

interface DashboardState {
  analytics: AnalyticsResponse | null;
  salesData: SalesChartData[];
  pipelineData: PipelineChartData[];
  recentActivities: ActivityData[];
  loading: boolean;
  error: string | null;
}

export function Dashboard() {
  const [state, setState] = useState<DashboardState>({
    analytics: null,
    salesData: [],
    pipelineData: [],
    recentActivities: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        if (shouldUseMockData()) {
          // Use mock data
          const { salesData, pipelineData } = transformAnalyticsToChartData(mockAnalyticsData);
          setState({
            analytics: mockAnalyticsData,
            salesData,
            pipelineData,
            recentActivities: mockRecentActivities,
            loading: false,
            error: null
          });
        } else {
          // Fetch real data from API
          console.log("Fetching real analytics data...");
          const analytics = await analyticsApi.getAnalytics();
          console.log("Analytics data fetched:", analytics);
          const { salesData, pipelineData } = transformAnalyticsToChartData(analytics);
          
          setState({
            analytics,
            salesData,
            pipelineData,
            recentActivities: mockRecentActivities, // Keep using mock activities for now
            loading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard data. Please try again.'
        }));
      }
    };

    fetchDashboardData();
  }, []);

  if (state.loading) {
    return <DashboardSkeleton />;
  }

  if (state.error) {
    return <DashboardError error={state.error} onRetry={() => window.location.reload()} />;
  }

  const { analytics, salesData, pipelineData, recentActivities } = state;

  if (!analytics) {
    return <DashboardError error="No data available" onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening in your CRM.</p>
        </div>
        <div className="neomorphism-card px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="neomorphism-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Leads</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{analytics.overview.totalLeads.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">↗ +12% from last month</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-neomorphism-blue to-neomorphism-violet rounded-xl">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="neomorphism-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active Opportunities</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{analytics.overview.totalOpportunities}</p>
              <p className="text-sm text-green-600 mt-1">↗ +8% from last month</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-neomorphism-violet to-neomorphism-red rounded-xl">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="neomorphism-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Revenue This Month</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">${analytics.overview.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">↗ +22% from last month</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-neomorphism-red to-neomorphism-blue rounded-xl">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="neomorphism-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Conversion Rate</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{analytics.overview.conversionRate}%</p>
              <p className="text-sm text-green-600 mt-1">↗ +3.2% from last month</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-neomorphism-blue to-neomorphism-red rounded-xl">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Leads Chart */}
        <div className="neomorphism-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue & Leads Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="leads" fill="url(#leadsGradient)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Distribution */}
        <div className="neomorphism-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Pipeline Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pipelineData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                stroke="none"
              >
                {pipelineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pipelineData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.name}</span>
                <span className="text-sm font-medium text-gray-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="neomorphism-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={20} />
            Recent Activities
          </h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-neomorphism-blue mt-2" />
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="neomorphism-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="neomorphism-button p-4 text-left group hover:scale-105 transition-transform">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue rounded-lg group-hover:shadow-lg transition-shadow">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Add Lead</p>
                  <p className="text-xs text-gray-500">Create new lead</p>
                </div>
              </div>
            </button>

            <button className="neomorphism-button p-4 text-left group hover:scale-105 transition-transform">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-neomorphism-blue to-neomorphism-red rounded-lg group-hover:shadow-lg transition-shadow">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">New Deal</p>
                  <p className="text-xs text-gray-500">Create opportunity</p>
                </div>
              </div>
            </button>

            <button className="neomorphism-button p-4 text-left group hover:scale-105 transition-transform">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-neomorphism-red to-neomorphism-violet rounded-lg group-hover:shadow-lg transition-shadow">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Add User</p>
                  <p className="text-xs text-gray-500">Invite team member</p>
                </div>
              </div>
            </button>

            <button className="neomorphism-button p-4 text-left group hover:scale-105 transition-transform">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-neomorphism-violet to-neomorphism-red rounded-lg group-hover:shadow-lg transition-shadow">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">View Reports</p>
                  <p className="text-xs text-gray-500">Analytics & insights</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-64" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="neomorphism-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="neomorphism-card p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
        <div className="neomorphism-card p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>

      {/* Bottom section skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="neomorphism-card p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <Skeleton className="w-2 h-2 rounded-full mt-2" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="neomorphism-card p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Error component
interface DashboardErrorProps {
  error: string;
  onRetry: () => void;
}

function DashboardError({ error, onRetry }: DashboardErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="flex items-center gap-3 text-red-600">
        <AlertCircle size={24} />
        <h3 className="text-lg font-semibold">Dashboard Error</h3>
      </div>
      <p className="text-gray-600 text-center max-w-md">{error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue text-white rounded-lg hover:shadow-lg transition-shadow"
      >
        Try Again
      </button>
    </div>
  );
}
