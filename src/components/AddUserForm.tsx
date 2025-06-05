
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, User, Mail, Phone, Building, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

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
}

const userApi = {
  createUser: async (user: Partial<User>): Promise<User> => {
    // In production, replace with actual API call
    console.log('Creating user:', user);
    const newUser = {
      id: Date.now(),
      status: 'active' as const,
      permissions: ['read'],
      ...user
    };
    
    // Save to localStorage for persistence
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    return newUser as User;
  }
};

export function AddUserForm() {
  const [open, setOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    permissions: ['read']
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: userApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Success', description: 'User created successfully' });
      setOpen(false);
      setNewUser({ permissions: ['read'] });
    },
    onError: () => {
      toast({ 
        title: 'Error', 
        description: 'Failed to create user',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = () => {
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue text-white neomorphism-button">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Create New User
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={newUser.name || ''}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="neomorphism-input"
              placeholder="John Doe"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={newUser.email || ''}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="neomorphism-input"
              placeholder="john@company.com"
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={newUser.phone || ''}
              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              className="neomorphism-input"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          <div>
            <Label htmlFor="department">Department</Label>
            <Select onValueChange={(value) => setNewUser({ ...newUser, department: value })}>
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
          </div>
          
          <div>
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              value={newUser.position || ''}
              onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
              className="neomorphism-input"
              placeholder="Software Engineer"
            />
          </div>
          
          <div>
            <Label htmlFor="role">Role *</Label>
            <Select onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
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
          </div>
        </div>
        
        <div>
          <Label>Permissions</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {['read', 'write', 'delete', 'admin'].map((permission) => (
              <label key={permission} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newUser.permissions?.includes(permission) || false}
                  onChange={() => togglePermission(permission)}
                  className="rounded border-gray-300"
                />
                <span className="capitalize">{permission}</span>
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
            className="flex-1 bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue text-white neomorphism-button"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
