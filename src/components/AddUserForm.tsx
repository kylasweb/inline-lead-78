import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Plus, User, Mail, Phone, Building, Shield, Users, Target, CheckCircle, Sparkles } from 'lucide-react';
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
  userSchema,
  type UserFormData 
} from '@/lib/validation/schemas';

interface Lead {
  id: number;
  name: string;
  email: string;
  company: string;
  status: string;
  score: number;
}

const userApi = {
  createUser: async (user: Partial<UserFormData>): Promise<UserFormData> => {
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
      sendWelcomeEmail: true,
      requirePasswordChange: true,
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
    
    return newUser as UserFormData;
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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form with validation
  const form = useZodForm(userSchema, {
    permissions: ['read'],
    skills: [],
    certifications: [],
    onboardingCompleted: false,
    sendWelcomeEmail: true,
    requirePasswordChange: true,
    status: 'pending'
  });

  // Auto-save functionality
  const autoSave = useAutoSave({
    form,
    onSave: async (data) => {
      console.log('Auto-saving user form data:', data);
      localStorage.setItem('user-draft', JSON.stringify(data));
    },
    onError: (error) => {
      console.error('Auto-save failed:', error);
    },
    saveInterval: 30000, // Save every 30 seconds
  });

  // Form persistence for draft recovery
  const persistence = useFormPersistence({
    form,
    key: 'add-user-draft',
    onSave: (data) => console.log('User form data persisted:', data),
    onLoad: (data) => console.log('User form data loaded:', data),
  });

  // Accessibility enhancements
  const accessibility = useAccessibility({
    form,
    announceErrors: true,
    announceSuccess: true,
  });

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
      accessibility.announceSuccess('User created successfully');
      setOpen(false);
      setStep(1);
      form.reset({
        permissions: ['read'], 
        skills: [], 
        certifications: [],
        onboardingCompleted: false,
        sendWelcomeEmail: true,
        requirePasswordChange: true,
        status: 'pending'
      });
      persistence.clearPersisted();
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create user',
        variant: 'destructive'
      });
      accessibility.announceError('Failed to create user');
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

  const togglePermission = (permission: string) => {
    const currentPermissions = form.getValues('permissions') || [];
    const updatedPermissions = currentPermissions.includes(permission)
      ? currentPermissions.filter(p => p !== permission)
      : [...currentPermissions, permission];
    
    form.setValue('permissions', updatedPermissions);
  };

  const addSkill = (skill: string) => {
    const currentSkills = form.getValues('skills') || [];
    if (skill && !currentSkills.includes(skill)) {
      form.setValue('skills', [...currentSkills, skill]);
    }
  };

  const removeSkill = (skill: string) => {
    const currentSkills = form.getValues('skills') || [];
    form.setValue('skills', currentSkills.filter(s => s !== skill));
  };

  const handleLeadSelection = (leadId: string) => {
    const selectedLead = qualifiedLeads.find(lead => lead.id === parseInt(leadId));
    if (selectedLead) {
      form.setValue('leadSource', selectedLead.id);
      form.setValue('name', selectedLead.name);
      form.setValue('email', selectedLead.email);
      form.setValue('department', selectedLead.company);
    }
  };

  const currentFormData = form.watch();

  return (
    <ErrorBoundary>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-3 neomorphism-button">
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
          
          {/* Auto-save indicator */}
          <AutoSaveIndicator 
            status={autoSave.status}
            lastSaved={autoSave.lastSaved}
            error={autoSave.error}
            compact
          />
          
          {/* Progress tracker */}
          <FormProgressTracker 
            currentStep={step} 
            steps={[
              { title: 'Basic Info', description: 'Personal & role information' },
              { title: 'Permissions', description: 'Access & emergency contacts' },
              { title: 'Skills & Setup', description: 'Skills & onboarding settings' }
            ]}
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" />
                    Basic Information
                  </h3>
                  
                  <ConditionalField condition={qualifiedLeads.length > 0}>
                    <div className="space-y-2 mb-6">
                      <Label htmlFor="leadSource" className="text-sm font-medium text-gray-700 dark:text-gray-300">Import from Qualified Lead (Optional)</Label>
                      <Select onValueChange={handleLeadSelection}>
                        <SelectTrigger className="neomorphism-input">
                          <SelectValue placeholder="Select a qualified lead to import data" />
                        </SelectTrigger>
                        <SelectContent>
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
                      <ConditionalField condition={!!currentFormData.leadSource}>
                        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Lead data imported successfully
                        </p>
                      </ConditionalField>
                    </div>
                  </ConditionalField>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name *</Label>
                      <Input
                        {...form.register('name')}
                        id="name"
                        className="neomorphism-input"
                        placeholder="John Doe"
                      />
                      {form.getFieldError('name') && (
                        <p className="text-sm text-red-600 mt-1">{form.getFieldError('name')}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address *</Label>
                      <Input
                        {...form.register('email')}
                        id="email"
                        type="email"
                        className="neomorphism-input"
                        placeholder="john@company.com"
                      />
                      {form.getFieldError('email') && (
                        <p className="text-sm text-red-600 mt-1">{form.getFieldError('email')}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</Label>
                      <Input
                        {...form.register('phone')}
                        id="phone"
                        className="neomorphism-input"
                        placeholder="+1 (555) 123-4567"
                      />
                      {form.getFieldError('phone') && (
                        <p className="text-sm text-red-600 mt-1">{form.getFieldError('phone')}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-sm font-medium text-gray-700 dark:text-gray-300">Department *</Label>
                      <Select onValueChange={(value) => form.setValue('department', value as any)}>
                        <SelectTrigger className="neomorphism-input">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                          <SelectItem value="development">Development</SelectItem>
                          <SelectItem value="hr">Human Resources</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.getFieldError('department') && (
                        <p className="text-sm text-red-600 mt-1">{form.getFieldError('department')}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="position" className="text-sm font-medium text-gray-700 dark:text-gray-300">Position</Label>
                      <Input
                        {...form.register('position')}
                        id="position"
                        className="neomorphism-input"
                        placeholder="Software Engineer"
                      />
                      {form.getFieldError('position') && (
                        <p className="text-sm text-red-600 mt-1">{form.getFieldError('position')}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300">Role *</Label>
                      <Select onValueChange={(value) => form.setValue('role', value as any)}>
                        <SelectTrigger className="neomorphism-input">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.getFieldError('role') && (
                        <p className="text-sm text-red-600 mt-1">{form.getFieldError('role')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-500" />
                    Permissions & Access
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>System Permissions</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {['read', 'write', 'delete', 'admin', 'user-management', 'lead-management'].map((permission) => (
                          <label key={permission} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 neomorphism-button">
                            <input
                              type="checkbox"
                              checked={currentFormData.permissions?.includes(permission) || false}
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
                        {...form.register('bio')}
                        id="bio"
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
                          value={currentFormData.emergencyContact?.name || ''}
                          onChange={(e) => form.setValue('emergencyContact', { 
                            ...currentFormData.emergencyContact,
                            name: e.target.value,
                            phone: currentFormData.emergencyContact?.phone || '',
                            relationship: currentFormData.emergencyContact?.relationship || ''
                          })}
                          className="neomorphism-input"
                          placeholder="Emergency contact name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                        <Input
                          id="emergencyPhone"
                          value={currentFormData.emergencyContact?.phone || ''}
                          onChange={(e) => form.setValue('emergencyContact', { 
                            ...currentFormData.emergencyContact,
                            name: currentFormData.emergencyContact?.name || '',
                            phone: e.target.value,
                            relationship: currentFormData.emergencyContact?.relationship || ''
                          })}
                          className="neomorphism-input"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-green-500" />
                    Skills & Onboarding
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="newSkill">Add Skills</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          id="newSkill"
                          placeholder="Enter a skill..."
                          className="neomorphism-input"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
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
                        {currentFormData.skills?.map((skill, index) => (
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

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl neomorphism-card">
                      <div>
                        <Label>Send Welcome Email</Label>
                        <p className="text-sm text-gray-600">Send onboarding email with login credentials</p>
                      </div>
                      <Switch 
                        checked={currentFormData.sendWelcomeEmail}
                        onCheckedChange={(checked) => form.setValue('sendWelcomeEmail', checked)}
                        className="data-[state=checked]:bg-neomorphism-blue"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl neomorphism-card">
                      <div>
                        <Label>Require Password Change</Label>
                        <p className="text-sm text-gray-600">Force password change on first login</p>
                      </div>
                      <Switch 
                        checked={currentFormData.requirePasswordChange}
                        onCheckedChange={(checked) => form.setValue('requirePasswordChange', checked)}
                        className="data-[state=checked]:bg-neomorphism-blue"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
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
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white neomorphism-button"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : step === 3 ? 'Create User' : 'Next'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}
