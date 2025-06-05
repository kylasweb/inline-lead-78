
import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Shield, 
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  UserX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    joinDate: '2023-01-15'
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
    joinDate: '2023-03-10'
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
    joinDate: '2023-06-01'
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
    joinDate: '2023-08-15'
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
    joinDate: '2023-11-01'
  }
];

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

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const uniqueRoles = Array.from(new Set(users.map(user => user.role)));

  const toggleUserStatus = (userId: number) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' as const }
        : user
    ));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and their permissions</p>
        </div>
        <Button className="bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue hover:from-neomorphism-blue hover:to-neomorphism-violet text-white px-6 py-2 rounded-xl shadow-neomorphism-sm hover:shadow-neomorphism transition-all duration-200">
          <Plus size={20} className="mr-2" />
          Add User
        </Button>
      </div>

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="neomorphism-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{users.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-neomorphism-blue to-neomorphism-violet rounded-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="neomorphism-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active Users</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="neomorphism-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Inactive Users</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {users.filter(u => u.status === 'inactive').length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl">
              <UserX className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="neomorphism-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Departments</p>
              <p className="text-3xl font-bold text-neomorphism-violet mt-2">
                {new Set(users.map(u => u.department)).size}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-neomorphism-violet to-neomorphism-red rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
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
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Join Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user.name.split(' ').map(n => n[0]).join('')}
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
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[user.role as keyof typeof roleColors] || 'bg-gray-100 text-gray-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-800 font-medium">{user.department}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[user.status]}`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">{user.lastLogin}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">{user.joinDate}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 hover:bg-blue-50 hover:text-neomorphism-blue"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleUserStatus(user.id)}
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
