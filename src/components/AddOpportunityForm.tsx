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

// Enhanced form components and validation
import {
  AutoSaveIndicator,
  FormProgressTracker,
  ConditionalField,
} from '@/components/forms';
import { useZodForm } from '@/hooks/use-validation';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useFormPersistence } from '@/hooks/use-form-persistence';
import { useAccessibility } from '@/hooks/use-accessibility';
import { 
  opportunitySchema,
  type OpportunityFormData 
} from '@/lib/validation/schemas';

// Use the validated types from schemas
interface Lead {
  id: number;
  name: string;
  company: string;
  email: string;
}

const GEMINI_API_KEY = 'AIzaSyAPi9CB4lcHCvOGs6fTxZdcUSU48FUFgps';

const geminiApi = {
  analyzeOpportunity: async (opportunityData: Partial<OpportunityFormData>) => {
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
  createOpportunity: async (opportunity: Partial<OpportunityFormData>): Promise<OpportunityFormData> => {
    console.log('Creating opportunity:', opportunity);
    
    // Get AI insights before creating
    const aiInsights = await geminiApi.analyzeOpportunity(opportunity);
    
    try {
      // Map form data to API format
      const apiPayload = {
        title: opportunity.name,
        amount: opportunity.value,
        stage: opportunity.stage?.toUpperCase(),
        leadId: opportunity.leadId,
        assignedTo: opportunity.assignedTo
      };

      // Call the real API
      const response = await fetch('/.netlify/functions/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token' // Using mock token for now
        },
        body: JSON.stringify(apiPayload)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Return enhanced opportunity with AI insights
      return {
        ...opportunity,
        id: result.data.id,
        aiInsights,
        probability: opportunity.probability || 50,
        stage: opportunity.stage || 'qualification'
      } as OpportunityFormData;

    } catch (error) {
      console.error('API call failed, falling back to localStorage:', error);
      
      // Fallback to localStorage
      const newOpportunity = {
        id: Date.now(),
        probability: 50,
        stage: 'qualification' as const,
        aiInsights,
        ...opportunity
      };
      
      const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]');
      opportunities.push(newOpportunity);
      localStorage.setItem('opportunities', JSON.stringify(opportunities));
      
      return newOpportunity as OpportunityFormData;
    }
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

interface AddOpportunityFormProps {
  onSuccess?: () => void;
}

export function AddOpportunityForm({ onSuccess }: AddOpportunityFormProps = {}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form with validation
  const form = useZodForm(opportunitySchema, {
    probability: 50,
    stage: 'qualification',
    potentialPatterns: [],
    behavioralIndicators: []
  });

  // Auto-save functionality
  const autoSave = useAutoSave({
    form,
    onSave: async (data) => {
      console.log('Auto-saving form data:', data);
      // Save to localStorage or backend
      localStorage.setItem('opportunity-draft', JSON.stringify(data));
    },
    onError: (error) => {
      console.error('Auto-save failed:', error);
    },
    saveInterval: 30000, // Save every 30 seconds
  });

  // Form persistence for draft recovery
  const persistence = useFormPersistence({
    form,
    key: 'add-opportunity-draft',
    onSave: (data) => console.log('Form data persisted:', data),
    onLoad: (data) => console.log('Form data loaded:', data),
  });

  // Accessibility enhancements
  const accessibility = useAccessibility({
    form,
    announceErrors: true,
    announceSuccess: true,
  });

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
      accessibility.announceSuccess('Opportunity created successfully');
      setOpen(false);
      setStep(1);
      form.reset({
        probability: 50,
        stage: 'qualification',
        potentialPatterns: [],
        behavioralIndicators: []
      });
      persistence.clearPersisted();
      
      // Call the parent callback to refresh the opportunities list
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create opportunity',
        variant: 'destructive'
      });
      accessibility.announceError('Failed to create opportunity');
    }
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    if (step < 3) {
      setStep(step + 1);
      accessibility.announceCustom(`Moved to step ${step + 1} of 3`);
      return;
    }

    createMutation.mutate(data);
  });

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
    form.setValue('stage', stage as any);
    form.setValue('probability', selectedStage?.probability || 50);
  };

  const analyzeWithAI = async () => {
    const formData = form.getValues();
    if (!formData.name || !formData.value) {
      toast({
        title: 'Missing Information',
        description: 'Please provide opportunity name and value for AI analysis',
        variant: 'destructive'
      });
      return;
    }

    setIsAnalyzing(true);
    accessibility.announceCustom('Analyzing opportunity with AI');
    
    try {
      const insights = await geminiApi.analyzeOpportunity(formData);
      form.setValue('aiInsights', insights);
      form.setValue('potentialPatterns', insights.potentialPatterns || []);
      form.setValue('behavioralIndicators', insights.behavioralIndicators || []);
      
      toast({
        title: 'AI Analysis Complete',
        description: 'Opportunity analyzed with AI insights',
      });
      accessibility.announceSuccess('AI analysis completed successfully');
    } catch (error) {
      toast({
        title: 'AI Analysis Failed',
        description: 'Could not analyze opportunity. Please try again.',
        variant: 'destructive'
      });
      accessibility.announceError('AI analysis failed');
    }
    setIsAnalyzing(false);
  };

  const currentFormData = form.watch();

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
          
          {/* Auto-save indicator */}
          <AutoSaveIndicator 
            status={autoSave.status}
            lastSaved={autoSave.lastSaved}
            error={autoSave.error}
            compact
          />
          
          {/* Progress tracker */}
          <FormProgressTracker
            currentStep={step - 1}
            steps={[
              {
                id: 'basic-info',
                title: 'Basic Info',
                description: 'Opportunity details',
                fields: ['name', 'value', 'stage', 'assignedTo', 'source', 'description']
              },
              {
                id: 'analysis',
                title: 'Analysis',
                description: 'AI insights & patterns',
                fields: ['aiInsights', 'potentialPatterns', 'behavioralIndicators']
              },
              {
                id: 'strategic',
                title: 'Strategic',
                description: 'Timeline & next steps',
                fields: ['expectedCloseDate', 'probability', 'leadId', 'nextSteps', 'competitorAnalysis']
              }
            ]}
            errors={form.formState.errors}
            values={form.watch()}
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Basic Information
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Enter the fundamental details about this opportunity</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="name">Opportunity Name *</Label>
                      <Input
                        {...form.register('name')}
                        id="name"
                        placeholder="e.g., TechCorp CRM Implementation"
                        className="neomorphism-input"
                      />
                      {form.getFieldError('name') && (
                        <p className="text-sm text-red-600 mt-1">{form.getFieldError('name')}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="value">Estimated Value *</Label>
                      <Input
                        {...form.register('value', { valueAsNumber: true })}
                        id="value"
                        type="number"
                        placeholder="25000"
                        className="neomorphism-input"
                      />
                      {form.getFieldError('value') && (
                        <p className="text-sm text-red-600 mt-1">{form.getFieldError('value')}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="stage">Stage *</Label>
                      <Select onValueChange={handleStageChange} value={currentFormData.stage}>
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
                      {form.getFieldError('stage') && (
                        <p className="text-sm text-red-600 mt-1">{form.getFieldError('stage')}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="assignedTo">Assigned To *</Label>
                      <Select onValueChange={(value) => form.setValue('assignedTo', value)}>
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
                      {form.getFieldError('assignedTo') && (
                        <p className="text-sm text-red-600 mt-1">{form.getFieldError('assignedTo')}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="source">Source</Label>
                      <Select onValueChange={(value) => form.setValue('source', value as any)}>
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
                        {...form.register('description')}
                        id="description"
                        placeholder="Describe the opportunity, client needs, and proposed solution..."
                        rows={3}
                        className="neomorphism-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    AI Analysis & Patterns
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Let AI analyze your opportunity and identify success patterns</p>
                  
                  <div className="space-y-4">
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
                    
                    <ConditionalField condition={!!currentFormData.aiInsights}>
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                        <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          AI Insights
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Success Probability:</span> 
                            <Badge className="ml-2 bg-green-100 text-green-700">
                              {currentFormData.aiInsights?.successProbability}%
                            </Badge>
                          </div>
                          <div>
                            <span className="font-medium">Est. Time to Close:</span> 
                            <span className="ml-2">{currentFormData.aiInsights?.estimatedTimeToClose}</span>
                          </div>
                        </div>
                      </div>
                    </ConditionalField>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Strategic Details & Next Steps
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Complete the opportunity details</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                      <Input
                        {...form.register('expectedCloseDate')}
                        id="expectedCloseDate"
                        type="date"
                        className="neomorphism-input"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="probability">Win Probability (%)</Label>
                      <Input
                        {...form.register('probability', { valueAsNumber: true })}
                        id="probability"
                        type="number"
                        min={0}
                        max={100}
                        className="neomorphism-input"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="leadId">Related Lead</Label>
                      <Select onValueChange={(value) => form.setValue('leadId', parseInt(value))}>
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
                  
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label htmlFor="nextSteps">Next Steps</Label>
                      <Textarea
                        {...form.register('nextSteps')}
                        id="nextSteps"
                        placeholder="What are the immediate next steps to move this opportunity forward?"
                        rows={3}
                        className="neomorphism-input"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="competitorAnalysis">Competitor Analysis</Label>
                      <Textarea
                        {...form.register('competitorAnalysis')}
                        id="competitorAnalysis"
                        placeholder="Known competitors and competitive advantages..."
                        rows={3}
                        className="neomorphism-input"
                      />
                    </div>
                  </div>

                  <ConditionalField condition={!!currentFormData.aiInsights}>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="p-4 bg-red-50 rounded-xl">
                        <h4 className="font-semibold text-red-800 mb-2">Risk Factors</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {currentFormData.aiInsights?.riskFactors?.map((risk, index) => (
                            <li key={index}>• {risk}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-xl">
                        <h4 className="font-semibold text-green-800 mb-2">AI Recommendations</h4>
                        <ul className="text-sm text-green-700 space-y-1">
                          {currentFormData.aiInsights?.recommendations?.map((rec, index) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </ConditionalField>
                </div>
              </div>
            )}
            
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button 
                  type="button"
                  onClick={() => {
                    setStep(step - 1);
                    accessibility.announceCustom(`Moved to step ${step - 1} of 3`);
                  }}
                  variant="outline" 
                  className="flex-1 neomorphism-button"
                >
                  Back
                </Button>
              )}
              <Button 
                type="button"
                onClick={() => {
                  setOpen(false);
                  persistence.clearPersisted();
                }}
                variant="outline" 
                className="flex-1 neomorphism-button"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-1 bg-gradient-to-r from-neomorphism-blue to-neomorphism-violet text-white neomorphism-button"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : step === 3 ? 'Create Opportunity' : 'Next'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}
