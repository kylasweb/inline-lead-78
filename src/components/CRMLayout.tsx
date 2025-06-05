
import { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Briefcase, 
  BarChart3, 
  Settings, 
  Menu,
  X,
  Home,
  Shield,
  Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CRMLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'leads', label: 'Lead Management', icon: UserPlus },
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'staff', label: 'Staff Management', icon: Users },
  { id: 'roles', label: 'User Roles', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'customizer', label: 'Site Customizer', icon: Palette },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function CRMLayout({ children, activeTab, onTabChange }: CRMLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-neomorphism-background flex">
      {/* Sidebar */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="h-full neomorphism-card m-4 p-4 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen && (
              <h1 className="text-xl font-bold text-gray-800">TechPulse CRM</h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="neomorphism-button p-2 text-gray-600 hover:text-neomorphism-blue"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navigationItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue text-white shadow-neomorphism-sm"
                      : "text-gray-600 hover:text-neomorphism-violet hover:bg-gray-50",
                    !sidebarOpen && "justify-center"
                  )}
                >
                  <item.icon size={20} />
                  {sidebarOpen && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-xl",
              !sidebarOpen && "justify-center"
            )}>
              <div className="w-8 h-8 bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue rounded-full flex items-center justify-center text-white font-semibold text-sm">
                AD
              </div>
              {sidebarOpen && (
                <div>
                  <p className="text-sm font-medium text-gray-800">Admin User</p>
                  <p className="text-xs text-gray-500">admin@techpulse.com</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
