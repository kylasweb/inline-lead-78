
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
  LogOut,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

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
  const { isDarkMode, isFlat20, toggleDarkMode, toggleFlat20 } = useTheme();
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
    <div className="min-h-screen bg-neomorphism-background flex transition-colors duration-300">
      {/* Sidebar */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-72" : "w-20"
      )}>
        <div className="h-full neomorphism-card m-4 p-4 flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen && (
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">{siteName}</h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="neomorphism-button p-2 text-gray-600 dark:text-gray-300 hover:text-neomorphism-blue transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Theme Controls */}
          {sidebarOpen && (
            <div className="mb-6 space-y-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
                </div>
                <Switch 
                  checked={isDarkMode}
                  onCheckedChange={toggleDarkMode}
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor size={16} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Flat 2.0</span>
                </div>
                <Switch 
                  checked={isFlat20}
                  onCheckedChange={toggleFlat20}
                  className="data-[state=checked]:bg-purple-500"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navigationItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border",
                    isActive 
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg border-transparent"
                      : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600",
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
          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-xl mb-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600",
              !sidebarOpen && "justify-center"
            )}>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                {user?.name?.charAt(0) || 'U'}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{user?.role}</p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 rounded-xl border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
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
