
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Database, Users, Building, Target, Trash2 } from 'lucide-react';

export function Settings() {
  const [mockDataEnabled, setMockDataEnabled] = useState(true); // Default to enabled
  const { toast } = useToast();

  useEffect(() => {
    // Check if mock data setting exists, if not set it to enabled by default
    const savedSetting = localStorage.getItem('mockDataEnabled');
    if (savedSetting === null) {
      localStorage.setItem('mockDataEnabled', 'true');
      setMockDataEnabled(true);
    } else {
      setMockDataEnabled(savedSetting === 'true');
    }
  }, []);

  const handleMockDataToggle = (enabled: boolean) => {
    setMockDataEnabled(enabled);
    localStorage.setItem('mockDataEnabled', enabled.toString());
    
    if (!enabled) {
      // Clear all mock data when disabled
      clearAllData();
      toast({
        title: 'Mock Data Disabled',
        description: 'All sample data has been cleared. Your CRM is now ready for real data.',
      });
    } else {
      toast({
        title: 'Mock Data Enabled',
        description: 'Sample data is now available throughout the CRM system.',
      });
    }
    
    // Reload page to reflect changes
    setTimeout(() => window.location.reload(), 1000);
  };

  const clearAllData = () => {
    // Clear all stored data
    const keysToKeep = ['darkMode', 'flat20Theme', 'mockDataEnabled', 'authToken', 'userRole'];
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  };

  const handleClearAllData = () => {
    clearAllData();
    toast({
      title: 'Data Cleared',
      description: 'All user data has been cleared from the system.',
    });
    
    // Reload page to reflect changes
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your CRM system preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Data Management */}
        <Card className="neomorphism-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="mock-data" className="text-base font-medium">
                  Sample Data
                </Label>
                <p className="text-sm text-gray-600">
                  Enable sample data to explore CRM features with demo content
                </p>
              </div>
              <Switch
                id="mock-data"
                checked={mockDataEnabled}
                onCheckedChange={handleMockDataToggle}
              />
            </div>

            <div className="pt-4 border-t">
              <div className="space-y-2">
                <Label className="text-base font-medium text-red-600">
                  Danger Zone
                </Label>
                <p className="text-sm text-gray-600">
                  Clear all user data from the system. This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleClearAllData}
                  className="mt-2"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card className="neomorphism-card">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Version</p>
                <p className="text-gray-600">1.0.0</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Build</p>
                <p className="text-gray-600">Production</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Database</p>
                <p className="text-gray-600">Local Storage</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Authentication</p>
                <p className="text-gray-600">JWT</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Integration Recommendation */}
        <Card className="neomorphism-card border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Building className="w-5 h-5" />
              Recommended: Database Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                For production use, connect your CRM to a real database with Supabase integration.
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  <Users className="w-3 h-3" />
                  User Management
                </div>
                <div className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                  <Database className="w-3 h-3" />
                  Real Database
                </div>
                <div className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                  <Target className="w-3 h-3" />
                  Real-time Updates
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Click the green Supabase button in the top right to connect your database.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
