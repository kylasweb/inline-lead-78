
import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Plus, Briefcase, DollarSign, Calendar, User, Target, Building, Phone, Mail, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from './ErrorBoundary';

interface Opportunity {
  id?: number;
  title: string;
  company: string;
  contact: string;
  contactEmail: string;
  contactPhone: string;
  value: number;
  stage: 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  expectedCloseDate: string;
  lastActivity: string;
  description: string;
  source: string;
  industry: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  notes: string;
  competitorAnalysis: string;
  leadId?: number;
  assignedTo?: string;
  budget: {
    min: number;
    max: number;
    approved: boolean;
  };
  timeline: {
    startDate: string;
    endDate: string;
    milestones: string[];
  };
}

const opportunityApi = {
  createOpportunity: async (opportunity: Partial<Opportunity>): Promise<Opportunity> => {
    console.log('Creating advanced opportunity:', opportunity);
    
    try {
      // Map advanced form data to API format
      const apiPayload = {
        title: opportunity.title,
        amount: opportunity.value,
        stage: opportunity.stage?.toUpperCase().replace('-', '_'),
        leadId: opportunity.leadId || 1, // Default leadId for now
        assignedTo: opportunity.assignedTo || null
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
      
      // Return enhanced opportunity with advanced form data
      return {
        ...opportunity,
        id: result.data.id,
        lastActivity: new Date().toISOString().split('T')[0],
        tags: opportunity.tags || [],
        timeline: opportunity.timeline || {
          startDate: '',
          endDate: '',
          milestones: []
        },
        budget: opportunity.budget || {
          min: 0,
          max: 0,
          approved: false
        }
      } as Opportunity;

    } catch (error) {
      console.error('API call failed, falling back to localStorage:', error);
      
      // Fallback to localStorage for advanced form
      const newOpportunity = {
        id: Date.now(),
        lastActivity: new Date().toISOString().split('T')[0],
        tags: [],
        timeline: {
          startDate: '',
          endDate: '',
          milestones: []
        },
        budget: {
          min: 0,
          max: 0,
          approved: false
        },
        ...opportunity
      };
      
      const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]');
      opportunities.push(newOpportunity);
      localStorage.setItem('opportunities', JSON.stringify(opportunities));
      
      return newOpportunity as Opportunity;
    }
  }
};

interface AddOpportunityFormAdvancedProps {
  onSuccess?: () => void;
}

export function AddOpportunityFormAdvanced({ onSuccess }: AddOpportunityFormAdvancedProps = {}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [newOpportunity, setNewOpportunity] = useState<Partial<Opportunity>>({
    probability: 50,
    stage: 'qualified',
    priority: 'medium',
    tags: [],
    budget: { min: 0, max: 0, approved: false },
    timeline: { startDate: '', endDate: '', milestones: [] }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: opportunityApi.createOpportunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast({
        title: 'Success',
        description: 'Advanced opportunity created successfully',
        duration: 5000
      });
      setOpen(false);
      setStep(1);
      setNewOpportunity({
        probability: 50,
        stage: 'qualified',
        priority: 'medium',
        tags: [],
        budget: { min: 0, max: 0, approved: false },
        timeline: { startDate: '', endDate: '', milestones: [] }
      });
      
      // Call the parent callback to refresh the opportunities list
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create opportunity',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = () => {
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    if (!newOpportunity.title || !newOpportunity.company || !newOpportunity.contact) {
      toast({ 
        title: 'Validation Error', 
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    createMutation.mutate(newOpportunity);
  };

  const addTag = (tag: string) => {
    if (tag && !newOpportunity.tags?.includes(tag)) {
      setNewOpportunity({ 
        ...newOpportunity, 
        tags: [...(newOpportunity.tags || []), tag] 
      });
    }
  };

  const removeTag = (tag: string) => {
    setNewOpportunity({ 
      ...newOpportunity, 
      tags: newOpportunity.tags?.filter(t => t !== tag) || [] 
    });
  };

  return (
    <ErrorBoundary>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-3">
            <Plus className="w-4 h-4 mr-2" />
            Add Opportunity
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-0 shadow-2xl rounded-2xl">
          <DialogHeader className="pb-6 border-b border-gray-100 dark:border-gray-800">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white">
              <Briefcase className="w-6 h-6 text-blue-500" />
              Create New Opportunity - Step {step} of 4
            </DialogTitle>
          </DialogHeader>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 mb-8">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">Opportunity Title *</Label>
                  <Input
                    id="title"
                    value={newOpportunity.title || ''}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, title: e.target.value })}
                    className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800"
                    placeholder="Cloud Infrastructure Upgrade"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium text-gray-700 dark:text-gray-300">Company *</Label>
                  <Input
                    id="company"
                    value={newOpportunity.company || ''}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, company: e.target.value })}
                    className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800"
                    placeholder="TechCorp Inc."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact" className="text-sm font-medium text-gray-700 dark:text-gray-300">Primary Contact *</Label>
                  <Input
                    id="contact"
                    value={newOpportunity.contact || ''}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, contact: e.target.value })}
                    className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800"
                    placeholder="John Martinez"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={newOpportunity.contactEmail || ''}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, contactEmail: e.target.value })}
                    className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800"
                    placeholder="john@techcorp.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={newOpportunity.contactPhone || ''}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, contactPhone: e.target.value })}
                    className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="value" className="text-sm font-medium text-gray-700 dark:text-gray-300">Deal Value ($)</Label>
                  <Input
                    id="value"
                    type="number"
                    value={newOpportunity.value || ''}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, value: Number(e.target.value) })}
                    className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800"
                    placeholder="125000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={newOpportunity.description || ''}
                  onChange={(e) => setNewOpportunity({ ...newOpportunity, description: e.target.value })}
                  className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800"
                  placeholder="Complete cloud migration and infrastructure modernization project"
                  rows={3}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                Sales Details
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="stage" className="text-sm font-medium text-gray-700 dark:text-gray-300">Sales Stage</Label>
                  <Select onValueChange={(value) => setNewOpportunity({ ...newOpportunity, stage: value as any })}>
                    <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="closed-won">Closed Won</SelectItem>
                      <SelectItem value="closed-lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</Label>
                  <Select onValueChange={(value) => setNewOpportunity({ ...newOpportunity, priority: value as any })}>
                    <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="source" className="text-sm font-medium text-gray-700 dark:text-gray-300">Lead Source</Label>
                  <Select onValueChange={(value) => setNewOpportunity({ ...newOpportunity, source: value })}>
                    <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="cold-call">Cold Call</SelectItem>
                      <SelectItem value="social-media">Social Media</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-medium text-gray-700 dark:text-gray-300">Industry</Label>
                  <Select onValueChange={(value) => setNewOpportunity({ ...newOpportunity, industry: value })}>
                    <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expectedCloseDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Expected Close Date</Label>
                  <Input
                    id="expectedCloseDate"
                    type="date"
                    value={newOpportunity.expectedCloseDate || ''}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, expectedCloseDate: e.target.value })}
                    className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Win Probability: {newOpportunity.probability}%
                </Label>
                <Slider
                  value={[newOpportunity.probability || 50]}
                  onValueChange={([value]) => setNewOpportunity({ ...newOpportunity, probability: value })}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                Budget & Timeline
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="budgetMin" className="text-sm font-medium text-gray-700 dark:text-gray-300">Minimum Budget ($)</Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    value={newOpportunity.budget?.min || ''}
                    onChange={(e) => setNewOpportunity({ 
                      ...newOpportunity, 
                      budget: { ...newOpportunity.budget!, min: Number(e.target.value) }
                    })}
                    className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800"
                    placeholder="100000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="budgetMax" className="text-sm font-medium text-gray-700 dark:text-gray-300">Maximum Budget ($)</Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    value={newOpportunity.budget?.max || ''}
                    onChange={(e) => setNewOpportunity({ 
                      ...newOpportunity, 
                      budget: { ...newOpportunity.budget!, max: Number(e.target.value) }
                    })}
                    className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800"
                    placeholder="150000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newOpportunity.timeline?.startDate || ''}
                    onChange={(e) => setNewOpportunity({ 
                      ...newOpportunity, 
                      timeline: { ...newOpportunity.timeline!, startDate: e.target.value }
                    })}
                    className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Project End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newOpportunity.timeline?.endDate || ''}
                    onChange={(e) => setNewOpportunity({ 
                      ...newOpportunity, 
                      timeline: { ...newOpportunity.timeline!, endDate: e.target.value }
                    })}
                    className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Budget Approved</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Has the client approved the budget?</p>
                </div>
                <Switch 
                  checked={newOpportunity.budget?.approved || false}
                  onCheckedChange={(checked) => setNewOpportunity({ 
                    ...newOpportunity, 
                    budget: { ...newOpportunity.budget!, approved: checked }
                  })}
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-500" />
                Additional Details
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newOpportunity.notes || ''}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, notes: e.target.value })}
                    className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800"
                    placeholder="Internal notes about this opportunity..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="competitorAnalysis" className="text-sm font-medium text-gray-700 dark:text-gray-300">Competitor Analysis</Label>
                  <Textarea
                    id="competitorAnalysis"
                    value={newOpportunity.competitorAnalysis || ''}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, competitorAnalysis: e.target.value })}
                    className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800"
                    placeholder="Competing against IBM, Microsoft..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newTag" className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="newTag"
                      placeholder="Add a tag..."
                      className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addTag((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <Button 
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('newTag') as HTMLInputElement;
                        addTag(input.value);
                        input.value = '';
                      }}
                      className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newOpportunity.tags?.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900 rounded-lg"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
            {step > 1 && (
              <Button 
                onClick={() => setStep(step - 1)} 
                variant="outline" 
                className="flex-1 rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Back
              </Button>
            )}
            <Button 
              onClick={() => setOpen(false)} 
              variant="outline" 
              className="flex-1 rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : step === 4 ? 'Create Opportunity' : 'Next'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}
