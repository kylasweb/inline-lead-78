
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
  Palette,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Get current site name from localStorage or use default
  const getSiteName = () => {
    const savedConfig = localStorage.getItem('siteConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      return config.branding?.companyName || 'Inline CRM';
    }
    return 'Inline CRM';
  };

  const [siteName, setSiteName] = useState(getSiteName());

  // Listen for storage changes to update site name in real-time
  useState(() => {
    const handleStorageChange = () => {
      setSiteName(getSiteName());
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events for same-tab updates
    const handleSiteConfigUpdate = () => {
      setSiteName(getSiteName());
    };
    
    window.addEventListener('siteConfigUpdated', handleSiteConfigUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('siteConfigUpdated', handleSiteConfigUpdate);
    };
  });

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
  };

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
              <h1 className="text-xl font-bold text-gray-800">{siteName}</h1>
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
              "flex items-center gap-3 p-3 rounded-xl mb-2",
              !sidebarOpen && "justify-center"
            )}>
              <div className="w-8 h-8 bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              {sidebarOpen && (
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-neomorphism-violet font-medium">{user?.role}</p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="w-full flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </Button>
            )}
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
