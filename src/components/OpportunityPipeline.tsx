
import { useState } from 'react';
import { 
  Plus, 
  DollarSign, 
  Calendar, 
  User, 
  TrendingUp,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Opportunity {
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

const mockOpportunities: Opportunity[] = [
  {
    id: 1,
    title: 'Cloud Infrastructure Upgrade',
    company: 'TechCorp Inc.',
    contact: 'John Martinez',
    value: 125000,
    stage: 'proposal',
    probability: 75,
    expectedCloseDate: '2024-02-15',
    lastActivity: '2024-01-15',
    description: 'Complete cloud migration and infrastructure modernization project'
  },
  {
    id: 2,
    title: 'Security Audit & Implementation',
    company: 'DataSystems Ltd.',
    contact: 'Michael Chen',
    value: 85000,
    stage: 'negotiation',
    probability: 80,
    expectedCloseDate: '2024-01-30',
    lastActivity: '2024-01-14',
    description: 'Comprehensive security assessment and implementation services'
  },
  {
    id: 3,
    title: 'Digital Transformation Project',
    company: 'InnovateSoft',
    contact: 'Sarah Johnson',
    value: 250000,
    stage: 'qualified',
    probability: 40,
    expectedCloseDate: '2024-03-20',
    lastActivity: '2024-01-13',
    description: 'End-to-end digital transformation initiative'
  },
  {
    id: 4,
    title: 'DevOps Automation Platform',
    company: 'CloudTech Solutions',
    contact: 'Emma Wilson',
    value: 95000,
    stage: 'proposal',
    probability: 65,
    expectedCloseDate: '2024-02-28',
    lastActivity: '2024-01-12',
    description: 'Implementation of automated CI/CD pipeline and monitoring'
  }
];

const stageConfig = {
  qualified: { label: 'Qualified', color: 'bg-blue-500', textColor: 'text-blue-700' },
  proposal: { label: 'Proposal', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
  negotiation: { label: 'Negotiation', color: 'bg-orange-500', textColor: 'text-orange-700' },
  'closed-won': { label: 'Closed Won', color: 'bg-green-500', textColor: 'text-green-700' },
  'closed-lost': { label: 'Closed Lost', color: 'bg-red-500', textColor: 'text-red-700' }
};

export function OpportunityPipeline() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities);
  const [selectedStage, setSelectedStage] = useState<string>('all');

  const stages = Object.keys(stageConfig) as Array<keyof typeof stageConfig>;

  const filteredOpportunities = selectedStage === 'all' 
    ? opportunities 
    : opportunities.filter(opp => opp.stage === selectedStage);

  const getStageOpportunities = (stage: keyof typeof stageConfig) => {
    return opportunities.filter(opp => opp.stage === stage);
  };

  const getTotalValue = (stage?: keyof typeof stageConfig) => {
    const opps = stage ? getStageOpportunities(stage) : opportunities;
    return opps.reduce((sum, opp) => sum + opp.value, 0);
  };

  const getWeightedValue = (stage?: keyof typeof stageConfig) => {
    const opps = stage ? getStageOpportunities(stage) : opportunities;
    return opps.reduce((sum, opp) => sum + (opp.value * opp.probability / 100), 0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Opportunity Pipeline</h1>
          <p className="text-gray-600 mt-1">Track and manage your sales opportunities</p>
        </div>
        <Button className="bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue hover:from-neomorphism-blue hover:to-neomorphism-violet text-white px-6 py-2 rounded-xl shadow-neomorphism-sm hover:shadow-neomorphism transition-all duration-200">
          <Plus size={20} className="mr-2" />
          Add Opportunity
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="neomorphism-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Pipeline Value</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">${getTotalValue().toLocaleString()}</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-neomorphism-blue to-neomorphism-violet rounded-xl">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="neomorphism-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Weighted Pipeline</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">${getWeightedValue().toLocaleString()}</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-neomorphism-violet to-neomorphism-red rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="neomorphism-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active Opportunities</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{opportunities.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-neomorphism-red to-neomorphism-blue rounded-xl">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="neomorphism-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Avg. Deal Size</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                ${Math.round(getTotalValue() / opportunities.length).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-neomorphism-blue to-neomorphism-red rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="neomorphism-card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pipeline Overview</h3>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {stages.map((stage) => {
            const stageOpps = getStageOpportunities(stage);
            const stageValue = getTotalValue(stage);
            
            return (
              <div key={stage} className="neomorphism-card p-4 hover:shadow-neomorphism-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">{stageConfig[stage].label}</h4>
                  <span className={`w-3 h-3 rounded-full ${stageConfig[stage].color}`} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Opportunities:</span>
                    <span className="font-medium">{stageOpps.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Value:</span>
                    <span className="font-medium">${stageValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Weighted:</span>
                    <span className="font-medium">${getWeightedValue(stage).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Opportunities List */}
      <div className="neomorphism-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Opportunities</h3>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-4 py-2 rounded-xl border-0 neomorphism-input text-gray-700 focus:outline-none focus:ring-2 focus:ring-neomorphism-blue"
          >
            <option value="all">All Stages</option>
            {stages.map(stage => (
              <option key={stage} value={stage}>{stageConfig[stage].label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOpportunities.map((opportunity) => (
            <div key={opportunity.id} className="neomorphism-card p-6 hover:shadow-neomorphism-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">{opportunity.title}</h4>
                  <p className="text-sm text-gray-600">{opportunity.company}</p>
                </div>
                <Button variant="ghost" size="sm" className="p-2">
                  <MoreHorizontal size={16} />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Value:</span>
                  <span className="font-semibold text-lg text-gray-800">${opportunity.value.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Stage:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-opacity-20 ${stageConfig[opportunity.stage].color} ${stageConfig[opportunity.stage].textColor}`}>
                    {stageConfig[opportunity.stage].label}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Probability:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue rounded-full"
                        style={{ width: `${opportunity.probability}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{opportunity.probability}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Contact:</span>
                  <span className="text-sm font-medium text-gray-800">{opportunity.contact}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Expected Close:</span>
                  <span className="text-sm font-medium text-gray-800">{opportunity.expectedCloseDate}</span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">{opportunity.description}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 neomorphism-button border-0 text-neomorphism-blue hover:bg-blue-50">
                      <Edit size={16} className="mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 neomorphism-button border-0 text-neomorphism-red hover:bg-red-50">
                      <Trash2 size={16} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
