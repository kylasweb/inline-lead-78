import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Plus, User, Mail, Phone, Building, Shield, Users, Target, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from './ErrorBoundary';

interface User {
  id?: number;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  permissions: string[];
  bio?: string;
  avatar?: string;
  leadSource?: number;
  onboardingCompleted?: boolean;
  skills?: string[];
  certifications?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

interface Lead {
  id: number;
  name: string;
  email: string;
  company: string;
  status: string;
  score: number;
}

const userApi = {
  createUser: async (user: Partial<User>): Promise<User> => {
    console.log('Creating user:', user);
    
    // Validate lead source if provided
    if (user.leadSource) {
      const leads = JSON.parse(localStorage.getItem('leads') || '[]');
      const sourceLead = leads.find((l: Lead) => l.id === user.leadSource);
      if (!sourceLead) {
        throw new Error('Invalid lead source selected');
      }
      if (sourceLead.status !== 'qualified') {
        throw new Error('Only qualified leads can be converted to users');
      }
    }

    const newUser = {
      id: Date.now(),
      status: 'pending' as const,
      permissions: ['read'],
      onboardingCompleted: false,
      skills: [],
      certifications: [],
      ...user
    };
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // If created from lead, update lead status
    if (user.leadSource) {
      const leads = JSON.parse(localStorage.getItem('leads') || '[]');
      const updatedLeads = leads.map((lead: Lead) => 
        lead.id === user.leadSource 
          ? { ...lead, status: 'converted', convertedToUserId: newUser.id }
          : lead
      );
      localStorage.setItem('leads', JSON.stringify(updatedLeads));
    }
    
    return newUser as User;
  }
};

const leadApi = {
  getQualifiedLeads: async (): Promise<Lead[]> => {
    const mockData = localStorage.getItem('mockDataEnabled') === 'true';
    if (!mockData) return [];
    
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    return leads.filter((lead: Lead) => lead.status === 'qualified');
  }
};

export function AddUserForm() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [newUser, setNewUser] = useState<Partial<User>>({
    permissions: ['read'],
    skills: [],
    certifications: [],
    onboardingCompleted: false
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: qualifiedLeads = [] } = useQuery({
    queryKey: ['qualified-leads'],
    queryFn: leadApi.getQualifiedLeads
  });

  const createMutation = useMutation({
    mutationFn: userApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ 
        title: 'Success', 
        description: 'User created successfully and added to onboarding process',
        duration: 5000
      });
      setOpen(false);
      setStep(1);
      setNewUser({ 
        permissions: ['read'], 
        skills: [], 
        certifications: [],
        onboardingCompleted: false 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create user',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    if (!newUser.name || !newUser.email || !newUser.role) {
      toast({ 
        title: 'Validation Error', 
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    createMutation.mutate(newUser);
  };

  const togglePermission = (permission: string) => {
    const currentPermissions = newUser.permissions || [];
    const updatedPermissions = currentPermissions.includes(permission)
      ? currentPermissions.filter(p => p !== permission)
      : [...currentPermissions, permission];
    
    setNewUser({ ...newUser, permissions: updatedPermissions });
  };

  const addSkill = (skill: string) => {
    if (skill && !newUser.skills?.includes(skill)) {
      setNewUser({ 
        ...newUser, 
        skills: [...(newUser.skills || []), skill] 
      });
    }
  };

  const removeSkill = (skill: string) => {
    setNewUser({ 
      ...newUser, 
      skills: newUser.skills?.filter(s => s !== skill) || [] 
    });
  };

  const handleLeadSelection = (leadId: string) => {
    const selectedLead = qualifiedLeads.find(lead => lead.id === parseInt(leadId));
    if (selectedLead) {
      setNewUser({
        ...newUser,
        leadSource: selectedLead.id,
        name: selectedLead.name,
        email: selectedLead.email,
        department: selectedLead.company
      });
    }
  };

  return (
    <ErrorBoundary>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-3">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-0 shadow-2xl rounded-2xl">
          <DialogHeader className="pb-6 border-b border-gray-100 dark:border-gray-800">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white">
              <User className="w-6 h-6 text-blue-500" />
              Create New User - Step {step} of 3
            </DialogTitle>
          </DialogHeader>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 mb-8">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Basic Information
              </h3>
              
              {qualifiedLeads.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="leadSource" className="text-sm font-medium text-gray-700 dark:text-gray-300">Import from Qualified Lead (Optional)</Label>
                  <Select onValueChange={handleLeadSelection}>
                    <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <SelectValue placeholder="Select a qualified lead to import data" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      {qualifiedLeads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-green-600">Score: {lead.score}</Badge>
                            {lead.name} - {lead.company}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newUser.leadSource && (
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Lead data imported successfully
                    </p>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name *</Label>
                  <Input
                    id="name"
                    value={newUser.name || ''}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800"
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email || ''}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800"
                    placeholder="john@company.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newUser.phone || ''}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium text-gray-700 dark:text-gray-300">Department</Label>
                  <Select onValueChange={(value) => setNewUser({ ...newUser, department: value })}>
                    <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm font-medium text-gray-700 dark:text-gray-300">Position</Label>
                  <Input
                    id="position"
                    value={newUser.position || ''}
                    onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                    className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800"
                    placeholder="Software Engineer"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300">Role *</Label>
                  <Select onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Permissions & Access</h3>
              
              <div>
                <Label>System Permissions</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['read', 'write', 'delete', 'admin', 'user-management', 'lead-management'].map((permission) => (
                    <label key={permission} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={newUser.permissions?.includes(permission) || false}
                        onChange={() => togglePermission(permission)}
                        className="rounded border-gray-300"
                      />
                      <span className="capitalize text-sm">{permission.replace('-', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  value={newUser.bio || ''}
                  onChange={(e) => setNewUser({ ...newUser, bio: e.target.value })}
                  className="neomorphism-input"
                  placeholder="Brief description about the user..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyName">Emergency Contact Name</Label>
                  <Input
                    id="emergencyName"
                    value={newUser.emergencyContact?.name || ''}
                    onChange={(e) => setNewUser({ 
                      ...newUser, 
                      emergencyContact: { 
                        ...newUser.emergencyContact,
                        name: e.target.value,
                        phone: newUser.emergencyContact?.phone || '',
                        relationship: newUser.emergencyContact?.relationship || ''
                      }
                    })}
                    className="neomorphism-input"
                    placeholder="Emergency contact name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={newUser.emergencyContact?.phone || ''}
                    onChange={(e) => setNewUser({ 
                      ...newUser, 
                      emergencyContact: { 
                        ...newUser.emergencyContact,
                        name: newUser.emergencyContact?.name || '',
                        phone: e.target.value,
                        relationship: newUser.emergencyContact?.relationship || ''
                      }
                    })}
                    className="neomorphism-input"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Skills & Onboarding</h3>
              
              <div>
                <Label htmlFor="newSkill">Add Skills</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="newSkill"
                    placeholder="Enter a skill..."
                    className="neomorphism-input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addSkill((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <Button 
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('newSkill') as HTMLInputElement;
                      addSkill(input.value);
                      input.value = '';
                    }}
                    className="neomorphism-button"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newUser.skills?.map((skill, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => removeSkill(skill)}
                    >
                      {skill} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <Label>Send Welcome Email</Label>
                  <p className="text-sm text-gray-600">Send onboarding email with login credentials</p>
                </div>
                <Switch 
                  checked={true}
                  className="data-[state=checked]:bg-neomorphism-blue"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <Label>Require Password Change</Label>
                  <p className="text-sm text-gray-600">Force password change on first login</p>
                </div>
                <Switch 
                  checked={true}
                  className="data-[state=checked]:bg-neomorphism-blue"
                />
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
              {createMutation.isPending ? 'Creating...' : step === 3 ? 'Create User' : 'Next'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}
