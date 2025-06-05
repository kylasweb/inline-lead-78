
import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Plus, Target, DollarSign, Calendar, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

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
}

interface Lead {
  id: number;
  name: string;
  company: string;
  email: string;
}

const opportunityApi = {
  createOpportunity: async (opportunity: Partial<Opportunity>): Promise<Opportunity> => {
    console.log('Creating opportunity:', opportunity);
    const newOpportunity = {
      id: Date.now(),
      probability: 50,
      stage: 'qualification',
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
  const [newOpportunity, setNewOpportunity] = useState<Partial<Opportunity>>({
    probability: 50,
    stage: 'qualification'
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
      toast({ title: 'Success', description: 'Opportunity created successfully' });
      setOpen(false);
      setNewOpportunity({ probability: 50, stage: 'qualification' });
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-neomorphism-blue to-neomorphism-violet text-white neomorphism-button">
          <Plus className="w-4 h-4 mr-2" />
          Add Opportunity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Create New Opportunity
          </DialogTitle>
        </DialogHeader>
        
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
          
          <div className="col-span-2">
            <Label htmlFor="nextSteps">Next Steps</Label>
            <Textarea
              id="nextSteps"
              value={newOpportunity.nextSteps || ''}
              onChange={(e) => setNewOpportunity({ ...newOpportunity, nextSteps: e.target.value })}
              className="neomorphism-input"
              placeholder="What are the immediate next steps to move this opportunity forward?"
              rows={2}
            />
          </div>
          
          <div className="col-span-2">
            <Label htmlFor="competitorAnalysis">Competitor Analysis</Label>
            <Textarea
              id="competitorAnalysis"
              value={newOpportunity.competitorAnalysis || ''}
              onChange={(e) => setNewOpportunity({ ...newOpportunity, competitorAnalysis: e.target.value })}
              className="neomorphism-input"
              placeholder="Known competitors and competitive advantages..."
              rows={2}
            />
          </div>
        </div>
        
        <div className="flex gap-3 pt-4">
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
            {createMutation.isPending ? 'Creating...' : 'Create Opportunity'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
