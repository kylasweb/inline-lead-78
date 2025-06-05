
import { useState } from 'react';
import { Shield, Lock, Key, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface UserPermissionsProps {
  users: any[];
  onUpdatePermissions: (userId: number, permissions: string[]) => void;
}

export function UserPermissions({ users, onUpdatePermissions }: UserPermissionsProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = users.find(u => u.id === selectedUserId);

  const allPermissions = [
    { key: 'read', label: 'Read Access', description: 'View data and reports' },
    { key: 'write', label: 'Write Access', description: 'Create and edit records' },
    { key: 'delete', label: 'Delete Access', description: 'Remove records' },
    { key: 'admin', label: 'Admin Access', description: 'Full system administration' },
    { key: 'user-management', label: 'User Management', description: 'Manage user accounts' },
    { key: 'lead-management', label: 'Lead Management', description: 'Manage leads and prospects' },
    { key: 'opportunity-management', label: 'Opportunity Management', description: 'Manage sales opportunities' },
    { key: 'analytics', label: 'Analytics Access', description: 'View business analytics' },
    { key: 'settings', label: 'Settings Access', description: 'Modify system settings' },
    { key: 'export-data', label: 'Data Export', description: 'Export system data' },
  ];

  const handlePermissionToggle = (permission: string) => {
    if (!selectedUser) return;
    
    const currentPermissions = selectedUser.permissions || [];
    const updatedPermissions = currentPermissions.includes(permission)
      ? currentPermissions.filter((p: string) => p !== permission)
      : [...currentPermissions, permission];
    
    onUpdatePermissions(selectedUser.id, updatedPermissions);
  };

  return (
    <div className="space-y-6">
      <div className="neomorphism-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-neomorphism-violet" />
          <h3 className="text-xl font-semibold text-gray-800">User Permissions Management</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Selection */}
          <div className="space-y-4">
            <Label htmlFor="user-search">Search Users</Label>
            <Input
              id="user-search"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="neomorphism-input"
            />

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-colors ${
                    selectedUserId === user.id
                      ? 'bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      selectedUserId === user.id
                        ? 'bg-white text-neomorphism-violet'
                        : 'bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue text-white'
                    }`}>
                      {user.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className={`text-sm ${selectedUserId === user.id ? 'text-white/80' : 'text-gray-500'}`}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Permissions Panel */}
          <div className="space-y-4">
            {selectedUser ? (
              <>
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue rounded-xl text-white">
                  <Key className="w-5 h-5" />
                  <div>
                    <h4 className="font-semibold">{selectedUser.name}</h4>
                    <p className="text-sm text-white/80">{selectedUser.role}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Permissions</Label>
                  {allPermissions.map((permission) => (
                    <div key={permission.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-800">{permission.label}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                      </div>
                      <Switch
                        checked={selectedUser.permissions?.includes(permission.key) || false}
                        onCheckedChange={() => handlePermissionToggle(permission.key)}
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Settings className="w-12 h-12 mb-4" />
                <p>Select a user to manage permissions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
