
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Plus, Target, DollarSign, Calendar, User, Brain, Sparkles, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from './ErrorBoundary';

interface Opportunity {
  id?: number;
  name: string;
  description?: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate: string;
  leadId?: number;
  assignedTo: string;
  source: string;
  competitorAnalysis?: string;
  nextSteps?: string;
  aiInsights?: {
    riskFactors: string[];
    recommendations: string[];
    successProbability: number;
    estimatedTimeToClose: string;
  };
  audience?: {
    demographics: string;
    psychographics: string;
    painPoints: string[];
    budget: string;
  };
  potentialPatterns?: string[];
  behavioralIndicators?: string[];
}

interface Lead {
  id: number;
  name: string;
  company: string;
  email: string;
}

const GEMINI_API_KEY = 'AIzaSyAPi9CB4lcHCvOGs6fTxZdcUSU48FUFgps';

const geminiApi = {
  analyzeOpportunity: async (opportunityData: Partial<Opportunity>) => {
    try {
      const prompt = `
        Analyze this sales opportunity and provide insights:
        
        Name: ${opportunityData.name}
        Value: $${opportunityData.value}
        Description: ${opportunityData.description}
        Source: ${opportunityData.source}
        Audience: ${JSON.stringify(opportunityData.audience)}
        
        Provide a JSON response with:
        1. riskFactors: Array of potential risks
        2. recommendations: Array of actionable recommendations
        3. successProbability: Number between 0-100
        4. estimatedTimeToClose: String (e.g., "2-3 months")
        5. potentialPatterns: Array of patterns that could indicate success
        6. behavioralIndicators: Array of customer behaviors to watch for
        
        Keep responses concise and actionable.
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      const data = await response.json();
      const aiText = data.candidates[0]?.content?.parts[0]?.text || '';
      
      // Extract JSON from AI response
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback if JSON parsing fails
      return {
        riskFactors: ['Market competition', 'Budget constraints'],
        recommendations: ['Follow up within 48 hours', 'Provide detailed proposal'],
        successProbability: 75,
        estimatedTimeToClose: '2-3 months',
        potentialPatterns: ['Regular engagement', 'Budget discussion initiated'],
        behavioralIndicators: ['Multiple stakeholder involvement', 'Request for detailed information']
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      return {
        riskFactors: ['Analysis unavailable'],
        recommendations: ['Manual analysis required'],
        successProbability: 50,
        estimatedTimeToClose: 'Unknown',
        potentialPatterns: ['Pattern analysis unavailable'],
        behavioralIndicators: ['Behavioral analysis unavailable']
      };
    }
  }
};

const opportunityApi = {
  createOpportunity: async (opportunity: Partial<Opportunity>): Promise<Opportunity> => {
    console.log('Creating opportunity:', opportunity);
    
    // Get AI insights before creating
    const aiInsights = await geminiApi.analyzeOpportunity(opportunity);
    
    const newOpportunity = {
      id: Date.now(),
      probability: 50,
      stage: 'qualification',
      aiInsights,
      ...opportunity
    };
    
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]');
    opportunities.push(newOpportunity);
    localStorage.setItem('opportunities', JSON.stringify(opportunities));
    
    return newOpportunity as Opportunity;
  }
};

const leadApi = {
  getLeads: async (): Promise<Lead[]> => {
    const mockData = localStorage.getItem('mockDataEnabled') === 'true';
    if (!mockData) return [];
    
    return [
      { id: 1, name: 'John Martinez', company: 'TechCorp Inc.', email: 'john@techcorp.com' },
      { id: 2, name: 'Sarah Johnson', company: 'InnovateSoft', email: 's.johnson@innovatesoft.com' }
    ];
  }
};

export function AddOpportunityForm() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newOpportunity, setNewOpportunity] = useState<Partial<Opportunity>>({
    probability: 50,
    stage: 'qualification',
    potentialPatterns: [],
    behavioralIndicators: []
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: leadApi.getLeads
  });

  const createMutation = useMutation({
    mutationFn: opportunityApi.createOpportunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast({ 
        title: 'Success', 
        description: 'Opportunity created with AI insights',
        duration: 5000
      });
      setOpen(false);
      setStep(1);
      setNewOpportunity({ 
        probability: 50, 
        stage: 'qualification',
        potentialPatterns: [],
        behavioralIndicators: []
      });
    },
    onError: () => {
      toast({ 
        title: 'Error', 
        description: 'Failed to create opportunity',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    if (!newOpportunity.name || !newOpportunity.value || !newOpportunity.assignedTo) {
      toast({ 
        title: 'Validation Error', 
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    createMutation.mutate(newOpportunity);
  };

  const stages = [
    { value: 'qualification', label: 'Qualification', probability: 25 },
    { value: 'needs-analysis', label: 'Needs Analysis', probability: 40 },
    { value: 'proposal', label: 'Proposal', probability: 60 },
    { value: 'negotiation', label: 'Negotiation', probability: 80 },
    { value: 'closed-won', label: 'Closed Won', probability: 100 },
    { value: 'closed-lost', label: 'Closed Lost', probability: 0 }
  ];

  const handleStageChange = (stage: string) => {
    const selectedStage = stages.find(s => s.value === stage);
    setNewOpportunity({
      ...newOpportunity,
      stage,
      probability: selectedStage?.probability || 50
    });
  };

  const analyzeWithAI = async () => {
    if (!newOpportunity.name || !newOpportunity.value) {
      toast({
        title: 'Missing Information',
        description: 'Please provide opportunity name and value for AI analysis',
        variant: 'destructive'
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const insights = await geminiApi.analyzeOpportunity(newOpportunity);
      setNewOpportunity({
        ...newOpportunity,
        aiInsights: insights,
        potentialPatterns: insights.potentialPatterns || [],
        behavioralIndicators: insights.behavioralIndicators || []
      });
      toast({
        title: 'AI Analysis Complete',
        description: 'Opportunity analyzed with AI insights',
      });
    } catch (error) {
      toast({
        title: 'AI Analysis Failed',
        description: 'Could not analyze opportunity. Please try again.',
        variant: 'destructive'
      });
    }
    setIsAnalyzing(false);
  };

  const addPattern = (pattern: string) => {
    if (pattern && !newOpportunity.potentialPatterns?.includes(pattern)) {
      setNewOpportunity({
        ...newOpportunity,
        potentialPatterns: [...(newOpportunity.potentialPatterns || []), pattern]
      });
    }
  };

  const removePattern = (pattern: string) => {
    setNewOpportunity({
      ...newOpportunity,
      potentialPatterns: newOpportunity.potentialPatterns?.filter(p => p !== pattern) || []
    });
  };

  return (
    <ErrorBoundary>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-neomorphism-blue to-neomorphism-violet text-white neomorphism-button">
            <Plus className="w-4 h-4 mr-2" />
            Add Opportunity
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Create New Opportunity - Step {step} of 3
            </DialogTitle>
          </DialogHeader>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-gradient-to-r from-neomorphism-blue to-neomorphism-violet h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Opportunity Name *</Label>
                  <Input
                    id="name"
                    value={newOpportunity.name || ''}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, name: e.target.value })}
                    className="neomorphism-input"
                    placeholder="e.g., TechCorp CRM Implementation"
                  />
                </div>
                
                <div>
                  <Label htmlFor="value">Estimated Value *</Label>
                  <Input
                    id="value"
                    type="number"
                    value={newOpportunity.value || ''}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, value: parseFloat(e.target.value) })}
                    className="neomorphism-input"
                    placeholder="25000"
                  />
                </div>
                
                <div>
                  <Label htmlFor="stage">Stage *</Label>
                  <Select onValueChange={handleStageChange} value={newOpportunity.stage}>
                    <SelectTrigger className="neomorphism-input">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label} ({stage.probability}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="assignedTo">Assigned To *</Label>
                  <Select onValueChange={(value) => setNewOpportunity({ ...newOpportunity, assignedTo: value })}>
                    <SelectTrigger className="neomorphism-input">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sarah-wilson">Sarah Wilson</SelectItem>
                      <SelectItem value="mike-chen">Mike Chen</SelectItem>
                      <SelectItem value="john-doe">John Doe</SelectItem>
                      <SelectItem value="jane-smith">Jane Smith</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Select onValueChange={(value) => setNewOpportunity({ ...newOpportunity, source: value })}>
                    <SelectTrigger className="neomorphism-input">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inbound-lead">Inbound Lead</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="cold-outreach">Cold Outreach</SelectItem>
                      <SelectItem value="marketing-campaign">Marketing Campaign</SelectItem>
                      <SelectItem value="trade-show">Trade Show</SelectItem>
                      <SelectItem value="social-media">Social Media</SelectItem>
                      <SelectItem value="content-marketing">Content Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newOpportunity.description || ''}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, description: e.target.value })}
                    className="neomorphism-input"
                    placeholder="Describe the opportunity, client needs, and proposed solution..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Audience & Behavioral Analysis</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="demographics">Target Demographics</Label>
                    <Textarea
                      id="demographics"
                      value={newOpportunity.audience?.demographics || ''}
                      onChange={(e) => setNewOpportunity({ 
                        ...newOpportunity, 
                        audience: { 
                          ...newOpportunity.audience,
                          demographics: e.target.value,
                          psychographics: newOpportunity.audience?.psychographics || '',
                          painPoints: newOpportunity.audience?.painPoints || [],
                          budget: newOpportunity.audience?.budget || ''
                        }
                      })}
                      className="neomorphism-input"
                      placeholder="Age, industry, company size, location..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="psychographics">Psychographics</Label>
                    <Textarea
                      id="psychographics"
                      value={newOpportunity.audience?.psychographics || ''}
                      onChange={(e) => setNewOpportunity({ 
                        ...newOpportunity, 
                        audience: { 
                          ...newOpportunity.audience,
                          demographics: newOpportunity.audience?.demographics || '',
                          psychographics: e.target.value,
                          painPoints: newOpportunity.audience?.painPoints || [],
                          budget: newOpportunity.audience?.budget || ''
                        }
                      })}
                      className="neomorphism-input"
                      placeholder="Values, interests, lifestyle, motivations..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="budget">Budget Range</Label>
                    <Input
                      id="budget"
                      value={newOpportunity.audience?.budget || ''}
                      onChange={(e) => setNewOpportunity({ 
                        ...newOpportunity, 
                        audience: { 
                          ...newOpportunity.audience,
                          demographics: newOpportunity.audience?.demographics || '',
                          psychographics: newOpportunity.audience?.psychographics || '',
                          painPoints: newOpportunity.audience?.painPoints || [],
                          budget: e.target.value
                        }
                      })}
                      className="neomorphism-input"
                      placeholder="$10,000 - $50,000"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>Potential Success Patterns</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Add success pattern..."
                        className="neomorphism-input"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addPattern((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <Button 
                        type="button"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Add success pattern..."]') as HTMLInputElement;
                          addPattern(input.value);
                          input.value = '';
                        }}
                        className="neomorphism-button"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {newOpportunity.potentialPatterns?.map((pattern, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-red-100 mr-1 mb-1"
                          onClick={() => removePattern(pattern)}
                        >
                          {pattern} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Button 
                      type="button"
                      onClick={analyzeWithAI}
                      disabled={isAnalyzing}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white neomorphism-button"
                    >
                      {isAnalyzing ? (
                        <>
                          <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing with AI...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Analyze with Gemini AI
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {newOpportunity.aiInsights && (
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        AI Insights
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Success Probability:</span> 
                          <Badge className="ml-2 bg-green-100 text-green-700">
                            {newOpportunity.aiInsights.successProbability}%
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Est. Time to Close:</span> 
                          <span className="ml-2">{newOpportunity.aiInsights.estimatedTimeToClose}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Strategic Details & Next Steps</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                  <Input
                    id="expectedCloseDate"
                    type="date"
                    value={newOpportunity.expectedCloseDate || ''}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, expectedCloseDate: e.target.value })}
                    className="neomorphism-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="probability">Win Probability (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={newOpportunity.probability || ''}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, probability: parseInt(e.target.value) })}
                    className="neomorphism-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="leadId">Related Lead</Label>
                  <Select onValueChange={(value) => setNewOpportunity({ ...newOpportunity, leadId: parseInt(value) })}>
                    <SelectTrigger className="neomorphism-input">
                      <SelectValue placeholder="Select lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id.toString()}>
                          {lead.name} - {lead.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="nextSteps">Next Steps</Label>
                <Textarea
                  id="nextSteps"
                  value={newOpportunity.nextSteps || ''}
                  onChange={(e) => setNewOpportunity({ ...newOpportunity, nextSteps: e.target.value })}
                  className="neomorphism-input"
                  placeholder="What are the immediate next steps to move this opportunity forward?"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="competitorAnalysis">Competitor Analysis</Label>
                <Textarea
                  id="competitorAnalysis"
                  value={newOpportunity.competitorAnalysis || ''}
                  onChange={(e) => setNewOpportunity({ ...newOpportunity, competitorAnalysis: e.target.value })}
                  className="neomorphism-input"
                  placeholder="Known competitors and competitive advantages..."
                  rows={3}
                />
              </div>

              {newOpportunity.aiInsights && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-red-50 rounded-xl">
                    <h4 className="font-semibold text-red-800 mb-2">Risk Factors</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {newOpportunity.aiInsights.riskFactors.map((risk, index) => (
                        <li key={index}>• {risk}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-xl">
                    <h4 className="font-semibold text-green-800 mb-2">AI Recommendations</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      {newOpportunity.aiInsights.recommendations.map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <Button 
                onClick={() => setStep(step - 1)} 
                variant="outline" 
                className="flex-1 neomorphism-button"
              >
                Back
              </Button>
            )}
            <Button 
              onClick={() => setOpen(false)} 
              variant="outline" 
              className="flex-1 neomorphism-button"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1 bg-gradient-to-r from-neomorphism-blue to-neomorphism-violet text-white neomorphism-button"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : step === 3 ? 'Create Opportunity' : 'Next'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}
