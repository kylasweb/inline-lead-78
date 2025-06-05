import { useState, useEffect } from 'react';
import { Users, Search, Settings as SettingsIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorBoundary } from './ErrorBoundary';
import { UserDirectory } from './user-management/UserDirectory';
import { UserStats } from './user-management/UserStats';
import { UserPermissions } from './user-management/UserPermissions';
import { AddUserForm } from './AddUserForm';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  joinDate: string;
  permissions?: string[];
  avatar?: string;
}

const mockUsers: User[] = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@techpulse.com',
    phone: '+1 (555) 000-0001',
    role: 'Administrator',
    department: 'IT',
    status: 'active',
    lastLogin: '2024-01-15 09:30',
    joinDate: '2023-01-15',
    permissions: ['read', 'write', 'delete', 'admin']
  },
  {
    id: 2,
    name: 'Sarah Williams',
    email: 's.williams@techpulse.com',
    phone: '+1 (555) 000-0002',
    role: 'Sales Manager',
    department: 'Sales',
    status: 'active',
    lastLogin: '2024-01-15 08:45',
    joinDate: '2023-03-10',
    permissions: ['read', 'write']
  },
  {
    id: 3,
    name: 'David Rodriguez',
    email: 'd.rodriguez@techpulse.com',
    phone: '+1 (555) 000-0003',
    role: 'Sales Representative',
    department: 'Sales',
    status: 'active',
    lastLogin: '2024-01-14 16:20',
    joinDate: '2023-06-01',
    permissions: ['read']
  },
  {
    id: 4,
    name: 'Jennifer Lee',
    email: 'j.lee@techpulse.com',
    phone: '+1 (555) 000-0004',
    role: 'Marketing Specialist',
    department: 'Marketing',
    status: 'active',
    lastLogin: '2024-01-14 14:15',
    joinDate: '2023-08-15',
    permissions: ['read', 'write']
  },
  {
    id: 5,
    name: 'Robert Johnson',
    email: 'r.johnson@techpulse.com',
    phone: '+1 (555) 000-0005',
    role: 'Customer Support',
    department: 'Support',
    status: 'inactive',
    lastLogin: '2024-01-10 11:30',
    joinDate: '2023-11-01',
    permissions: ['read']
  }
];

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const mockDataEnabled = localStorage.getItem('mockDataEnabled') === 'true';
    if (mockDataEnabled) {
      const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const combinedUsers = [...mockUsers, ...savedUsers];
      setUsers(combinedUsers);
    } else {
      const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      setUsers(savedUsers);
    }
  }, []);

  const handleEditUser = (user: User) => {
    console.log('Edit user:', user);
    // TODO: Implement edit functionality
  };

  const handleDeleteUser = (userId: number) => {
    const updatedUsers = users.filter(user => user.id !== userId);
    setUsers(updatedUsers);
    
    // Update localStorage
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const filteredSavedUsers = savedUsers.filter((user: User) => user.id !== userId);
    localStorage.setItem('users', JSON.stringify(filteredSavedUsers));
  };

  const handleToggleStatus = (userId: number) => {
    const updatedUsers = users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' as const }
        : user
    );
    setUsers(updatedUsers);
    
    // Update localStorage
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedSavedUsers = savedUsers.map((user: User) => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' as const }
        : user
    );
    localStorage.setItem('users', JSON.stringify(updatedSavedUsers));
  };

  const handleUpdatePermissions = (userId: number, permissions: string[]) => {
    const updatedUsers = users.map(user => 
      user.id === userId ? { ...user, permissions } : user
    );
    setUsers(updatedUsers);
    
    // Update localStorage
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedSavedUsers = savedUsers.map((user: User) => 
      user.id === userId ? { ...user, permissions } : user
    );
    localStorage.setItem('users', JSON.stringify(updatedSavedUsers));
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
            <p className="text-gray-600 mt-1">Manage system users and their permissions</p>
          </div>
          <AddUserForm />
        </div>

        {/* Stats */}
        <UserStats users={users} />

        {/* Main Content with Tabs */}
        <Tabs defaultValue="directory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="directory" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Directory
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              User Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="directory">
            <UserDirectory 
              users={users}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onToggleStatus={handleToggleStatus}
            />
          </TabsContent>

          <TabsContent value="permissions">
            <UserPermissions 
              users={users}
              onUpdatePermissions={handleUpdatePermissions}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="neomorphism-card p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">User Analytics</h3>
              <p className="text-gray-600">User analytics and insights coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}
