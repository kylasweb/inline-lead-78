
import { Shield, UserCheck, UserX, Calendar } from 'lucide-react';

interface UserStatsProps {
  users: any[];
}

export function UserStats({ users }: UserStatsProps) {
  const activeUsers = users.filter(u => u.status === 'active').length;
  const inactiveUsers = users.filter(u => u.status === 'inactive').length;
  const departments = new Set(users.map(u => u.department)).size;

  return (
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
            <p className="text-3xl font-bold text-green-600 mt-2">{activeUsers}</p>
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
            <p className="text-3xl font-bold text-red-600 mt-2">{inactiveUsers}</p>
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
            <p className="text-3xl font-bold text-neomorphism-violet mt-2">{departments}</p>
          </div>
          <div className="p-3 bg-gradient-to-r from-neomorphism-violet to-neomorphism-red rounded-xl">
            <Calendar className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
