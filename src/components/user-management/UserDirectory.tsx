
import { useState } from 'react';
import { User, Search, Filter, MoreHorizontal, Edit, Trash2, UserCheck, UserX, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface UserDirectoryProps {
  users: any[];
  onEditUser: (user: any) => void;
  onDeleteUser: (userId: number) => void;
  onToggleStatus: (userId: number) => void;
}

export function UserDirectory({ users, onEditUser, onDeleteUser, onToggleStatus }: UserDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const uniqueRoles = Array.from(new Set(users.map(user => user.role)));

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700'
  };

  const roleColors = {
    'Administrator': 'bg-purple-100 text-purple-700',
    'Sales Manager': 'bg-blue-100 text-blue-700',
    'Sales Representative': 'bg-cyan-100 text-cyan-700',
    'Marketing Specialist': 'bg-pink-100 text-pink-700',
    'Customer Support': 'bg-orange-100 text-orange-700'
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="neomorphism-card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search users by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 neomorphism-input"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 rounded-xl border-0 neomorphism-input text-gray-700 focus:outline-none focus:ring-2 focus:ring-neomorphism-blue"
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-xl border-0 neomorphism-input text-gray-700 focus:outline-none focus:ring-2 focus:ring-neomorphism-blue"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="neomorphism-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Login</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Mail size={12} />
                            {user.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone size={12} />
                            {user.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge className={roleColors[user.role as keyof typeof roleColors] || 'bg-gray-100 text-gray-700'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-800 font-medium">{user.department}</span>
                  </td>
                  <td className="py-4 px-4">
                    <Badge className={statusColors[user.status as keyof typeof statusColors]}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">{user.lastLogin}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onEditUser(user)}
                        className="p-2 hover:bg-blue-50 hover:text-neomorphism-blue"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onToggleStatus(user.id)}
                        className={`p-2 hover:bg-opacity-50 ${
                          user.status === 'active' 
                            ? 'hover:bg-red-50 hover:text-neomorphism-red' 
                            : 'hover:bg-green-50 hover:text-green-600'
                        }`}
                      >
                        {user.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onDeleteUser(user.id)}
                        className="p-2 hover:bg-red-50 hover:text-neomorphism-red"
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
    </div>
  );
}
