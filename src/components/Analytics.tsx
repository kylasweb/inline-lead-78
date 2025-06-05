
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Target,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

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

// Mock API function - replace with real endpoint
const analyticsApi = {
  getData: async (timeframe: string): Promise<AnalyticsData> => {
    // Replace with: const response = await fetch(`/api/analytics?timeframe=${timeframe}`);
    return {
      overview: {
        totalRevenue: 1250000,
        revenueChange: 12.5,
        totalLeads: 2847,
        leadsChange: -3.2,
        conversionRate: 23.4,
        conversionChange: 5.1,
        totalOpportunities: 145,
        opportunitiesChange: 8.7
      },
      salesTrend: [
        { month: 'Jan', revenue: 85000, opportunities: 12, leads: 245 },
        { month: 'Feb', revenue: 92000, opportunities: 15, leads: 267 },
        { month: 'Mar', revenue: 78000, opportunities: 11, leads: 234 },
        { month: 'Apr', revenue: 105000, opportunities: 18, leads: 289 },
        { month: 'May', revenue: 118000, opportunities: 22, leads: 312 },
        { month: 'Jun', revenue: 134000, opportunities: 25, leads: 298 },
        { month: 'Jul', revenue: 125000, opportunities: 21, leads: 276 },
        { month: 'Aug', revenue: 142000, opportunities: 28, leads: 334 },
        { month: 'Sep', revenue: 158000, opportunities: 32, leads: 356 },
        { month: 'Oct', revenue: 171000, opportunities: 35, leads: 389 },
        { month: 'Nov', revenue: 186000, opportunities: 38, leads: 412 },
        { month: 'Dec', revenue: 195000, opportunities: 42, leads: 445 }
      ],
      leadSources: [
        { source: 'Website', count: 1124, color: '#8b5cf6' },
        { source: 'Social Media', count: 892, color: '#3b82f6' },
        { source: 'Email Campaign', count: 567, color: '#ef4444' },
        { source: 'Referrals', count: 264, color: '#10b981' }
      ],
      departmentPerformance: [
        { department: 'Sales', revenue: 650000, deals: 87, performance: 95 },
        { department: 'Marketing', revenue: 420000, deals: 45, performance: 88 },
        { department: 'Customer Success', revenue: 180000, deals: 13, performance: 92 }
      ],
      topPerformers: [
        { name: 'Sarah Johnson', revenue: 285000, deals: 23, performance: 98 },
        { name: 'Mike Chen', revenue: 267000, deals: 19, performance: 96 },
        { name: 'Emma Wilson', revenue: 245000, deals: 21, performance: 94 },
        { name: 'David Brown', revenue: 198000, deals: 16, performance: 91 },
        { name: 'Lisa Garcia', revenue: 176000, deals: 14, performance: 89 }
      ]
    };
  }
};

export function Analytics() {
  const [timeframe, setTimeframe] = useState('12months');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', timeframe],
    queryFn: () => analyticsApi.getData(timeframe)
  });

  if (isLoading || !analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neomorphism-violet"></div>
      </div>
    );
  }

  const COLORS = ['#8b5cf6', '#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="neomorphism-input w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button className="neomorphism-button bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue text-white">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="neomorphism-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-neomorphism-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              ${analytics.overview.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center mt-2">
              {analytics.overview.revenueChange > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm ${analytics.overview.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(analytics.overview.revenueChange)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="neomorphism-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-neomorphism-violet" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {analytics.overview.totalLeads.toLocaleString()}
            </div>
            <div className="flex items-center mt-2">
              {analytics.overview.leadsChange > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm ${analytics.overview.leadsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(analytics.overview.leadsChange)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="neomorphism-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-neomorphism-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {analytics.overview.conversionRate}%
            </div>
            <div className="flex items-center mt-2">
              {analytics.overview.conversionChange > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm ${analytics.overview.conversionChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(analytics.overview.conversionChange)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="neomorphism-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Opportunities</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {analytics.overview.totalOpportunities}
            </div>
            <div className="flex items-center mt-2">
              {analytics.overview.opportunitiesChange > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm ${analytics.overview.opportunitiesChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(analytics.overview.opportunitiesChange)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="neomorphism-card">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8b5cf6" 
                  fill="url(#gradient)" 
                />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="neomorphism-card">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.leadSources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.leadSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="neomorphism-card">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">Department Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.departmentPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="neomorphism-card">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topPerformers.map((performer, index) => (
                <div key={performer.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{performer.name}</div>
                      <div className="text-sm text-gray-600">{performer.deals} deals</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-800">${performer.revenue.toLocaleString()}</div>
                    <Badge variant="outline" className="text-xs">
                      {performer.performance}% score
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads and Opportunities Trend */}
      <Card className="neomorphism-card">
        <CardHeader>
          <CardTitle className="text-lg text-gray-800">Leads vs Opportunities Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={analytics.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="leads" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Leads"
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="opportunities" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Opportunities"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
