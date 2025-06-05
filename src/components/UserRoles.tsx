
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Shield, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Users,
  Settings,
  Eye,
  EyeOff,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isActive: boolean;
  createdAt: string;
}

// Mock API functions - replace with real endpoints
const rolesApi = {
  getAll: async (): Promise<Role[]> => {
    // Replace with: const response = await fetch('/api/roles');
    return [
      {
        id: '1',
        name: 'Administrator',
        description: 'Full system access with all permissions',
        permissions: ['users.create', 'users.read', 'users.update', 'users.delete', 'roles.manage', 'settings.manage'],
        userCount: 2,
        isActive: true,
        createdAt: '2024-01-01'
      },
      {
        id: '2',
        name: 'Sales Manager',
        description: 'Manage leads and opportunities',
        permissions: ['leads.read', 'leads.update', 'opportunities.read', 'opportunities.update'],
        userCount: 5,
        isActive: true,
        createdAt: '2024-01-15'
      },
      {
        id: '3',
        name: 'Sales Rep',
        description: 'View and update assigned leads',
        permissions: ['leads.read', 'leads.update', 'opportunities.read'],
        userCount: 12,
        isActive: true,
        createdAt: '2024-02-01'
      }
    ];
  },
  getPermissions: async (): Promise<Permission[]> => {
    return [
      { id: 'users.create', name: 'Create Users', description: 'Create new user accounts', module: 'Users' },
      { id: 'users.read', name: 'View Users', description: 'View user information', module: 'Users' },
      { id: 'users.update', name: 'Update Users', description: 'Edit user information', module: 'Users' },
      { id: 'users.delete', name: 'Delete Users', description: 'Delete user accounts', module: 'Users' },
      { id: 'leads.create', name: 'Create Leads', description: 'Create new leads', module: 'Leads' },
      { id: 'leads.read', name: 'View Leads', description: 'View lead information', module: 'Leads' },
      { id: 'leads.update', name: 'Update Leads', description: 'Edit lead information', module: 'Leads' },
      { id: 'leads.delete', name: 'Delete Leads', description: 'Delete leads', module: 'Leads' },
      { id: 'opportunities.create', name: 'Create Opportunities', description: 'Create new opportunities', module: 'Opportunities' },
      { id: 'opportunities.read', name: 'View Opportunities', description: 'View opportunity information', module: 'Opportunities' },
      { id: 'opportunities.update', name: 'Update Opportunities', description: 'Edit opportunity information', module: 'Opportunities' },
      { id: 'opportunities.delete', name: 'Delete Opportunities', description: 'Delete opportunities', module: 'Opportunities' },
      { id: 'roles.manage', name: 'Manage Roles', description: 'Create and manage user roles', module: 'Administration' },
      { id: 'settings.manage', name: 'Manage Settings', description: 'Configure system settings', module: 'Administration' }
    ];
  },
  create: async (data: Omit<Role, 'id' | 'userCount' | 'createdAt'>): Promise<Role> => {
    // Replace with: const response = await fetch('/api/roles', { method: 'POST', body: JSON.stringify(data) });
    return { 
      ...data, 
      id: Date.now().toString(), 
      userCount: 0, 
      createdAt: new Date().toISOString() 
    };
  },
  update: async (id: string, data: Partial<Role>): Promise<Role> => {
    // Replace with: const response = await fetch(`/api/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return { ...data, id } as Role;
  },
  delete: async (id: string): Promise<void> => {
    // Replace with: await fetch(`/api/roles/${id}`, { method: 'DELETE' });
    console.log(`Deleting role ${id}`);
  }
};

export function UserRoles() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<Omit<Role, 'id' | 'userCount' | 'createdAt'>>({
    name: '',
    description: '',
    permissions: [],
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.getAll
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: rolesApi.getPermissions
  });

  const createMutation = useMutation({
    mutationFn: rolesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: 'Success', description: 'Role created successfully' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Role> }) => rolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setEditingRole(null);
      resetForm();
      toast({ title: 'Success', description: 'Role updated successfully' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: rolesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({ title: 'Success', description: 'Role deleted successfully' });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: [],
      isActive: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const startEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isActive: role.isActive
    });
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">User Roles Management</h1>
          <p className="text-gray-600 mt-1">Define roles and manage permissions for your team</p>
        </div>
        <Dialog open={isCreateDialogOpen || !!editingRole} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingRole(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="neomorphism-button bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="neomorphism-input"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="neomorphism-input"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active Role</Label>
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold">Permissions</Label>
                <div className="mt-4 space-y-6">
                  {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                    <div key={module} className="neomorphism-card p-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        {module}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {modulePermissions.map((permission) => (
                          <div key={permission.id} className="flex items-start space-x-3">
                            <button
                              type="button"
                              onClick={() => togglePermission(permission.id)}
                              className={`neomorphism-button w-5 h-5 rounded flex items-center justify-center transition-all ${
                                formData.permissions.includes(permission.id)
                                  ? 'bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue text-white'
                                  : 'bg-neomorphism-surface'
                              }`}
                            >
                              {formData.permissions.includes(permission.id) && <Check className="w-3 h-3" />}
                            </button>
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-800">{permission.name}</div>
                              <div className="text-xs text-gray-600">{permission.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingRole(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue text-white">
                  {editingRole ? 'Update Role' : 'Create Role'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="neomorphism-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="neomorphism-input pl-10"
          />
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <Card key={role.id} className="neomorphism-card hover:shadow-neomorphism-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-neomorphism-violet" />
                    {role.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={role.isActive ? 'default' : 'secondary'}>
                    {role.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{role.userCount} users</span>
                </div>
                <div className="text-gray-500">
                  {role.permissions.length} permissions
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Permissions:</div>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 3).map((permissionId) => {
                    const permission = permissions.find(p => p.id === permissionId);
                    return permission ? (
                      <Badge key={permissionId} variant="outline" className="text-xs">
                        {permission.name}
                      </Badge>
                    ) : null;
                  })}
                  {role.permissions.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{role.permissions.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Created {new Date(role.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(role)}
                    className="neomorphism-button"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMutation.mutate(role.id)}
                    className="neomorphism-button text-neomorphism-red"
                    disabled={role.userCount > 0}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neomorphism-violet mx-auto"></div>
        </div>
      )}
    </div>
  );
}
