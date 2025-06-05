
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Star,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  User,
  Calendar,
  TrendingUp,
  Users,
  Target,
  CheckCircle,
  Clock,
  ArrowRight,
  UserPlus,
  Building,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  location: string;
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'nurturing' | 'converted' | 'lost';
  source: string;
  lastContact: string;
  value: number;
  assignedStaff?: string;
  enrichmentData?: {
    companySize: string;
    industry: string;
    revenue: string;
    socialProfiles: string[];
    technologies: string[];
  };
  nurturingStage: 'awareness' | 'consideration' | 'decision' | 'retention';
  conversionTimeline: {
    createdAt: string;
    firstContact: string;
    qualified: string;
    proposal: string;
    closed: string;
  };
  activities: {
    id: number;
    type: 'email' | 'call' | 'meeting' | 'note';
    description: string;
    date: string;
    staff: string;
  }[];
  opportunityId?: number;
}

interface Opportunity {
  id: number;
  name: string;
  value: number;
  stage: string;
  leadId: number;
}

// Mock API functions - replace with real endpoints
const leadApi = {
  getLeads: async (): Promise<Lead[]> => {
    const mockData = localStorage.getItem('mockDataEnabled') === 'true';
    if (!mockData) return [];
    
    return [
      {
        id: 1,
        name: 'John Martinez',
        email: 'john.martinez@techcorp.com',
        phone: '+1 (555) 123-4567',
        company: 'TechCorp Inc.',
        position: 'CTO',
        location: 'San Francisco, CA',
        score: 85,
        status: 'qualified',
        source: 'Website',
        lastContact: '2024-01-15',
        value: 25000,
        assignedStaff: 'Sarah Wilson',
        enrichmentData: {
          companySize: '50-100',
          industry: 'Software',
          revenue: '$5M-10M',
          socialProfiles: ['LinkedIn', 'Twitter'],
          technologies: ['React', 'Node.js', 'AWS']
        },
        nurturingStage: 'consideration',
        conversionTimeline: {
          createdAt: '2024-01-10',
          firstContact: '2024-01-11',
          qualified: '2024-01-13',
          proposal: '',
          closed: ''
        },
        activities: [
          { id: 1, type: 'email', description: 'Initial contact email sent', date: '2024-01-11', staff: 'Sarah Wilson' },
          { id: 2, type: 'call', description: 'Discovery call completed', date: '2024-01-13', staff: 'Sarah Wilson' }
        ],
        opportunityId: 1
      }
    ];
  },
  createLead: async (lead: Partial<Lead>): Promise<Lead> => {
    console.log('Creating lead:', lead);
    return { id: Date.now(), ...lead } as Lead;
  },
  updateLead: async (id: number, updates: Partial<Lead>): Promise<Lead> => {
    console.log('Updating lead:', id, updates);
    return { id, ...updates } as Lead;
  },
  deleteLead: async (id: number): Promise<void> => {
    console.log('Deleting lead:', id);
  },
  enrichLead: async (id: number): Promise<Lead> => {
    console.log('Enriching lead:', id);
    return {} as Lead;
  },
  assignStaff: async (leadId: number, staffId: string): Promise<void> => {
    console.log('Assigning staff:', leadId, staffId);
  },
  addActivity: async (leadId: number, activity: Partial<Lead['activities'][0]>): Promise<void> => {
    console.log('Adding activity:', leadId, activity);
  }
};

const opportunityApi = {
  getOpportunities: async (): Promise<Opportunity[]> => {
    const mockData = localStorage.getItem('mockDataEnabled') === 'true';
    if (!mockData) return [];
    
    return [
      { id: 1, name: 'TechCorp CRM Implementation', value: 25000, stage: 'Proposal', leadId: 1 }
    ];
  }
};

export function LeadManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [newLead, setNewLead] = useState<Partial<Lead>>({});
  const [newActivity, setNewActivity] = useState<Partial<Lead['activities'][0]>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: leadApi.getLeads
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: opportunityApi.getOpportunities
  });

  const createMutation = useMutation({
    mutationFn: leadApi.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Success', description: 'Lead created successfully' });
      setShowAddForm(false);
      setNewLead({});
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Lead> }) => leadApi.updateLead(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Success', description: 'Lead updated successfully' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: leadApi.deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Success', description: 'Lead deleted successfully' });
    }
  });

  const enrichMutation = useMutation({
    mutationFn: leadApi.enrichLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Success', description: 'Lead enriched successfully' });
    }
  });

  const activityMutation = useMutation({
    mutationFn: ({ leadId, activity }: { leadId: number; activity: Partial<Lead['activities'][0]> }) => 
      leadApi.addActivity(leadId, activity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Success', description: 'Activity added successfully' });
      setNewActivity({});
    }
  });

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || lead.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const statusColors = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-yellow-100 text-yellow-700',
    qualified: 'bg-green-100 text-green-700',
    nurturing: 'bg-purple-100 text-purple-700',
    converted: 'bg-emerald-100 text-emerald-700',
    lost: 'bg-red-100 text-red-700'
  };

  const nurturingStageColors = {
    awareness: 'bg-blue-500',
    consideration: 'bg-yellow-500',
    decision: 'bg-orange-500',
    retention: 'bg-green-500'
  };

  const handleCreateLead = () => {
    createMutation.mutate({
      ...newLead,
      status: 'new' as const,
      score: 0,
      lastContact: new Date().toISOString().split('T')[0],
      nurturingStage: 'awareness' as const,
      conversionTimeline: {
        createdAt: new Date().toISOString().split('T')[0],
        firstContact: '',
        qualified: '',
        proposal: '',
        closed: ''
      },
      activities: []
    });
  };

  const handleAddActivity = () => {
    if (selectedLead && newActivity.type && newActivity.description) {
      activityMutation.mutate({
        leadId: selectedLead.id,
        activity: {
          ...newActivity,
          date: new Date().toISOString().split('T')[0],
          staff: 'Current User'
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neomorphism-violet"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Advanced Lead Management</h1>
          <p className="text-gray-600 mt-1">Comprehensive lead tracking, nurturing, and conversion</p>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue hover:from-neomorphism-blue hover:to-neomorphism-violet text-white px-6 py-2 rounded-xl shadow-neomorphism-sm hover:shadow-neomorphism transition-all duration-200">
              <Plus size={20} className="mr-2" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newLead.name || ''}
                  onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                  className="neomorphism-input"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newLead.email || ''}
                  onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                  className="neomorphism-input"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={newLead.phone || ''}
                  onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                  className="neomorphism-input"
                />
              </div>
              <div>
                <Label>Company</Label>
                <Input
                  value={newLead.company || ''}
                  onChange={(e) => setNewLead({...newLead, company: e.target.value})}
                  className="neomorphism-input"
                />
              </div>
              <div>
                <Label>Position</Label>
                <Input
                  value={newLead.position || ''}
                  onChange={(e) => setNewLead({...newLead, position: e.target.value})}
                  className="neomorphism-input"
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={newLead.location || ''}
                  onChange={(e) => setNewLead({...newLead, location: e.target.value})}
                  className="neomorphism-input"
                />
              </div>
              <div>
                <Label>Source</Label>
                <Select onValueChange={(value) => setNewLead({...newLead, source: value})}>
                  <SelectTrigger className="neomorphism-input">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="email">Email Campaign</SelectItem>
                    <SelectItem value="cold-call">Cold Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estimated Value</Label>
                <Input
                  type="number"
                  value={newLead.value || ''}
                  onChange={(e) => setNewLead({...newLead, value: parseInt(e.target.value)})}
                  className="neomorphism-input"
                />
              </div>
            </div>
            <Button onClick={handleCreateLead} className="neomorphism-button bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue text-white w-full mt-4">
              Create Lead
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Bar */}
      <div className="neomorphism-card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search leads by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 neomorphism-input"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="neomorphism-input w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="nurturing">Nurturing</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Advanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="neomorphism-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-neomorphism-blue" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{leads.length}</p>
                <p className="text-sm text-gray-600">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="neomorphism-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{leads.filter(l => l.status === 'qualified').length}</p>
                <p className="text-sm text-gray-600">Qualified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="neomorphism-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-neomorphism-violet" />
              <div>
                <p className="text-2xl font-bold text-neomorphism-violet">{leads.filter(l => l.status === 'nurturing').length}</p>
                <p className="text-sm text-gray-600">Nurturing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="neomorphism-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold text-emerald-600">{leads.filter(l => l.status === 'converted').length}</p>
                <p className="text-sm text-gray-600">Converted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="neomorphism-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-neomorphism-blue" />
              <div>
                <p className="text-2xl font-bold text-neomorphism-blue">
                  ${leads.reduce((sum, lead) => sum + (lead.value || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="neomorphism-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {Math.round(leads.filter(l => l.conversionTimeline.closed).length / Math.max(leads.length, 1) * 100)}%
                </p>
                <p className="text-sm text-gray-600">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <div className="neomorphism-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Lead</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Company</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Nurturing</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Score</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned Staff</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Value</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{lead.name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Mail size={12} />
                            {lead.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone size={12} />
                            {lead.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-gray-800">{lead.company}</p>
                      <p className="text-sm text-gray-500">{lead.position}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin size={10} />
                        {lead.location}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge className={`${statusColors[lead.status]} border-0`}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-3 h-3 rounded-full ${nurturingStageColors[lead.nurturingStage]}`}
                      />
                      <span className="text-sm capitalize">{lead.nurturingStage}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Star size={16} className={getScoreColor(lead.score)} fill="currentColor" />
                      <span className={`font-semibold ${getScoreColor(lead.score)}`}>{lead.score}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span className="text-sm">{lead.assignedStaff || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-gray-800">${(lead.value || 0).toLocaleString()}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 hover:bg-blue-50 hover:text-neomorphism-blue"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <Eye size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 hover:bg-green-50 hover:text-green-600"
                        onClick={() => enrichMutation.mutate(lead.id)}
                      >
                        <TrendingUp size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 hover:bg-red-50 hover:text-neomorphism-red"
                        onClick={() => deleteMutation.mutate(lead.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedLead.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedLead.name}</h2>
                  <p className="text-sm text-gray-600">{selectedLead.company} - {selectedLead.position}</p>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="enrichment">Enrichment</TabsTrigger>
                <TabsTrigger value="nurturing">Nurturing</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p><Mail className="inline w-4 h-4 mr-2" />{selectedLead.email}</p>
                      <p><Phone className="inline w-4 h-4 mr-2" />{selectedLead.phone}</p>
                      <p><MapPin className="inline w-4 h-4 mr-2" />{selectedLead.location}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Lead Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>Score: <span className={getScoreColor(selectedLead.score)}>{selectedLead.score}</span></p>
                      <p>Source: {selectedLead.source}</p>
                      <p>Value: ${selectedLead.value?.toLocaleString()}</p>
                      <p>Status: <Badge className={`${statusColors[selectedLead.status]} border-0`}>{selectedLead.status}</Badge></p>
                    </CardContent>
                  </Card>
                </div>
                {selectedLead.opportunityId && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Related Opportunity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {opportunities.find(o => o.id === selectedLead.opportunityId) && (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{opportunities.find(o => o.id === selectedLead.opportunityId)?.name}</p>
                            <p className="text-sm text-gray-600">Stage: {opportunities.find(o => o.id === selectedLead.opportunityId)?.stage}</p>
                          </div>
                          <p className="font-bold text-neomorphism-blue">
                            ${opportunities.find(o => o.id === selectedLead.opportunityId)?.value.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Conversion Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(selectedLead.conversionTimeline).map(([stage, date]) => (
                        <div key={stage} className="flex items-center gap-4">
                          <div className={`w-4 h-4 rounded-full ${date ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <div className="flex-1">
                            <p className="font-medium capitalize">{stage.replace(/([A-Z])/g, ' $1').toLowerCase()}</p>
                            <p className="text-sm text-gray-600">{date || 'Pending'}</p>
                          </div>
                          {date && <CheckCircle className="w-5 h-5 text-green-500" />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="enrichment" className="space-y-4">
                {selectedLead.enrichmentData ? (
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Company Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p>Size: {selectedLead.enrichmentData.companySize}</p>
                        <p>Industry: {selectedLead.enrichmentData.industry}</p>
                        <p>Revenue: {selectedLead.enrichmentData.revenue}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Technologies</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedLead.enrichmentData.technologies.map((tech, index) => (
                            <Badge key={index} variant="outline">{tech}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-600 mb-4">No enrichment data available</p>
                      <Button 
                        onClick={() => enrichMutation.mutate(selectedLead.id)}
                        className="neomorphism-button bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue text-white"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Enrich Lead Data
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="nurturing" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Nurturing Stage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-6 h-6 rounded-full ${nurturingStageColors[selectedLead.nurturingStage]}`} />
                      <span className="font-medium capitalize">{selectedLead.nurturingStage}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(nurturingStageColors).map(([stage, color]) => (
                        <div key={stage} className="text-center">
                          <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${color} ${selectedLead.nurturingStage === stage ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`} />
                          <p className="text-xs capitalize">{stage}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activities" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      Activities
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="neomorphism-button">
                            <Plus className="w-4 h-4 mr-1" />
                            Add Activity
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Activity</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Type</Label>
                              <Select onValueChange={(value: any) => setNewActivity({...newActivity, type: value})}>
                                <SelectTrigger className="neomorphism-input">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="call">Call</SelectItem>
                                  <SelectItem value="meeting">Meeting</SelectItem>
                                  <SelectItem value="note">Note</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={newActivity.description || ''}
                                onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                                className="neomorphism-input"
                              />
                            </div>
                            <Button onClick={handleAddActivity} className="neomorphism-button w-full">
                              Add Activity
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedLead.activities?.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                          <div className="w-8 h-8 bg-neomorphism-blue rounded-full flex items-center justify-center text-white text-xs">
                            {activity.type === 'email' && <Mail className="w-4 h-4" />}
                            {activity.type === 'call' && <Phone className="w-4 h-4" />}
                            {activity.type === 'meeting' && <Calendar className="w-4 h-4" />}
                            {activity.type === 'note' && <Edit className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{activity.description}</p>
                            <p className="text-sm text-gray-600">{activity.date} • {activity.staff}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
