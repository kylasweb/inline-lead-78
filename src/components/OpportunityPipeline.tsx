import { useState, useEffect } from 'react';
import {
  Plus,
  DollarSign,
  Calendar,
  User,
  TrendingUp,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertCircle,
  Briefcase,
  Settings,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { isDevelopment } from '@/lib/safer-api-utils';
import { fetchOpportunities, Opportunity as OpportunityType } from '@/lib/opportunities-api';
import { AddOpportunityForm } from './AddOpportunityForm';
import { AddOpportunityFormAdvanced } from './AddOpportunityFormAdvanced';

// Use this local type only if needed for backwards compatibility
type Opportunity = OpportunityType;

interface OpportunityPipelineState {
  opportunities: Opportunity[];
  loading: boolean;
  error: string | null;
}

const stageConfig = {
  qualified: { label: 'Qualified', color: 'bg-blue-500', textColor: 'text-blue-700' },
  proposal: { label: 'Proposal', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
  negotiation: { label: 'Negotiation', color: 'bg-orange-500', textColor: 'text-orange-700' },
  'closed-won': { label: 'Closed Won', color: 'bg-green-500', textColor: 'text-green-700' },
  'closed-lost': { label: 'Closed Lost', color: 'bg-red-500', textColor: 'text-red-700' }
};

export function OpportunityPipeline() {
  const [state, setState] = useState<OpportunityPipelineState>({
    opportunities: [],
    loading: true,
    error: null
  });
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);
  const [showFormSelector, setShowFormSelector] = useState<boolean>(false);
  useEffect(() => {
    const loadOpportunities = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        // Using our enhanced API utility that handles both production and development
        const opportunities = await fetchOpportunities();
        
        setState({
          opportunities,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Failed to fetch opportunities:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load opportunities. Please try again.'
        }));
      }
    };
  
    loadOpportunities();
  }, []);
    // Refresh callback for forms
  const handleOpportunityCreated = async () => {
    try {
      // Using our enhanced API utility for both environments
      const opportunities = await fetchOpportunities();
      
      setState(prev => ({
        ...prev,
        opportunities
      }));
    } catch (error) {
      console.error('Failed to refresh opportunities:', error);
    }
  };

  const stages = Object.keys(stageConfig) as Array<keyof typeof stageConfig>;

  const filteredOpportunities = selectedStage === 'all' 
    ? state.opportunities 
    : state.opportunities.filter(opp => opp.stage === selectedStage);

  const getStageOpportunities = (stage: keyof typeof stageConfig) => {
    return state.opportunities.filter(opp => opp.stage === stage);
  };

  const getTotalValue = (stage?: keyof typeof stageConfig) => {
    const opps = stage ? getStageOpportunities(stage) : state.opportunities;
    return opps.reduce((sum, opp) => sum + opp.value, 0);
  };

  const getWeightedValue = (stage?: keyof typeof stageConfig) => {
    const opps = stage ? getStageOpportunities(stage) : state.opportunities;
    return opps.reduce((sum, opp) => sum + (opp.value * opp.probability / 100), 0);
  };

  if (state.loading) {
    return <OpportunityPipelineSkeleton />;
  }

  if (state.error) {
    return <OpportunityPipelineError error={state.error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Opportunity Pipeline</h1>
          <p className="text-gray-600 mt-1">Track and manage your sales opportunities</p>
        </div>
        
        {/* Advanced Configurator Toggle */}
        <div className="flex items-center gap-3">
          {showFormSelector && (
            <div className="flex items-center gap-2 p-2 neomorphism-card rounded-xl">
              <span className="text-sm font-medium text-gray-700">Form Mode:</span>
              <Button
                variant={!isAdvancedMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAdvancedMode(false)}
                className={`text-xs px-3 py-1 rounded-lg transition-all ${
                  !isAdvancedMode
                    ? 'bg-neomorphism-blue text-white shadow-neomorphism-sm'
                    : 'neomorphism-button hover:shadow-neomorphism-sm'
                }`}
              >
                <Zap size={14} className="mr-1" />
                Basic
              </Button>
              <Button
                variant={isAdvancedMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAdvancedMode(true)}
                className={`text-xs px-3 py-1 rounded-lg transition-all ${
                  isAdvancedMode
                    ? 'bg-neomorphism-violet text-white shadow-neomorphism-sm'
                    : 'neomorphism-button hover:shadow-neomorphism-sm'
                }`}
              >
                <Settings size={14} className="mr-1" />
                Advanced
              </Button>
              {isAdvancedMode && (
                <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700 animate-pulse">
                  4-Step Wizard
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFormSelector(!showFormSelector)}
              className="neomorphism-button border-0 text-gray-600 hover:text-neomorphism-violet transition-colors"
            >
              <Settings size={16} className="mr-2" />
              Advanced Configurator
            </Button>
            
            {/* Dynamic Form Rendering */}
            {isAdvancedMode ? (
              <AddOpportunityFormAdvanced key="advanced-form" onSuccess={handleOpportunityCreated} />
            ) : (
              <AddOpportunityForm key="basic-form" onSuccess={handleOpportunityCreated} />
            )}
          </div>
        </div>
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
              <p className="text-3xl font-bold text-gray-800 mt-2">${Math.round(getWeightedValue()).toLocaleString()}</p>
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
              <p className="text-3xl font-bold text-gray-800 mt-2">{state.opportunities.length}</p>
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
                ${state.opportunities.length > 0 ? Math.round(getTotalValue() / state.opportunities.length).toLocaleString() : '0'}
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
                    <span className="font-medium">${Math.round(getWeightedValue(stage)).toLocaleString()}</span>
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

        {filteredOpportunities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
              <p>No opportunities found</p>
              {selectedStage !== 'all' && (
                <p className="text-sm mt-2">Try selecting a different stage or add new opportunities</p>
              )}
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}

// Loading skeleton component
function OpportunityPipelineSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="neomorphism-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-3" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline overview skeleton */}
      <div className="neomorphism-card p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="neomorphism-card p-4">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-3 w-3 rounded-full" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Opportunities list skeleton */}
      <div className="neomorphism-card p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="neomorphism-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-200">
                  <Skeleton className="h-4 w-full mb-3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
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

// Error component
interface OpportunityPipelineErrorProps {
  error: string;
  onRetry: () => void;
}

function OpportunityPipelineError({ error, onRetry }: OpportunityPipelineErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="flex items-center gap-3 text-red-600">
        <AlertCircle size={24} />
        <h3 className="text-lg font-semibold">Pipeline Error</h3>
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
