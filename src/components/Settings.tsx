
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Database, 
  Mail, 
  Globe, 
  Key,
  Download,
  Upload,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface SystemSettings {
  general: {
    siteName: string;
    siteUrl: string;
    timezone: string;
    language: string;
    dateFormat: string;
    currency: string;
  };
  security: {
    requireTwoFactor: boolean;
    sessionTimeout: number;
    passwordMinLength: number;
    loginAttempts: number;
    apiRateLimit: number;
    allowedDomains: string[];
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    leadNotifications: boolean;
    dealNotifications: boolean;
    systemAlerts: boolean;
  };
  email: {
    provider: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
  integrations: {
    googleAnalytics: string;
    salesforceEnabled: boolean;
    hubspotEnabled: boolean;
    slackWebhook: string;
    zapierEnabled: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: string;
    retentionDays: number;
    storageLocation: string;
  };
}

// Mock API functions - replace with real endpoints
const settingsApi = {
  getSettings: async (): Promise<SystemSettings> => {
    // Replace with: const response = await fetch('/api/settings');
    return {
      general: {
        siteName: 'TechPulse CRM',
        siteUrl: 'https://crm.techpulse.com',
        timezone: 'America/New_York',
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD'
      },
      security: {
        requireTwoFactor: false,
        sessionTimeout: 30,
        passwordMinLength: 8,
        loginAttempts: 5,
        apiRateLimit: 1000,
        allowedDomains: ['techpulse.com', 'company.com']
      },
      notifications: {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        leadNotifications: true,
        dealNotifications: true,
        systemAlerts: true
      },
      email: {
        provider: 'smtp',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: 'noreply@techpulse.com',
        smtpPassword: '',
        fromEmail: 'noreply@techpulse.com',
        fromName: 'TechPulse CRM'
      },
      integrations: {
        googleAnalytics: '',
        salesforceEnabled: false,
        hubspotEnabled: false,
        slackWebhook: '',
        zapierEnabled: false
      },
      backup: {
        autoBackup: true,
        backupFrequency: 'daily',
        retentionDays: 30,
        storageLocation: 'cloud'
      }
    };
  },
  updateSettings: async (settings: Partial<SystemSettings>): Promise<SystemSettings> => {
    // Replace with: const response = await fetch('/api/settings', { method: 'PUT', body: JSON.stringify(settings) });
    console.log('Updating settings:', settings);
    return settings as SystemSettings;
  },
  testEmailConnection: async (emailConfig: SystemSettings['email']): Promise<boolean> => {
    // Replace with: const response = await fetch('/api/settings/test-email', { method: 'POST', body: JSON.stringify(emailConfig) });
    console.log('Testing email connection:', emailConfig);
    return true;
  },
  exportData: async (): Promise<string> => {
    // Replace with: const response = await fetch('/api/settings/export');
    return 'backup-data-url';
  },
  importData: async (file: File): Promise<void> => {
    // Replace with: const formData = new FormData(); formData.append('file', file); await fetch('/api/settings/import', { method: 'POST', body: formData });
    console.log('Importing data from file:', file.name);
  }
};

export function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getSettings
  });

  const updateMutation = useMutation({
    mutationFn: settingsApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({ title: 'Success', description: 'Settings updated successfully' });
    }
  });

  const testEmailMutation = useMutation({
    mutationFn: settingsApi.testEmailConnection,
    onSuccess: (success) => {
      toast({ 
        title: success ? 'Success' : 'Error', 
        description: success ? 'Email connection test passed' : 'Email connection test failed',
        variant: success ? 'default' : 'destructive'
      });
    }
  });

  const exportMutation = useMutation({
    mutationFn: settingsApi.exportData,
    onSuccess: (url) => {
      // In real implementation, trigger download
      toast({ title: 'Success', description: 'Data export initiated' });
    }
  });

  const importMutation = useMutation({
    mutationFn: settingsApi.importData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({ title: 'Success', description: 'Data imported successfully' });
    }
  });

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neomorphism-violet"></div>
      </div>
    );
  }

  const updateSettings = (section: keyof SystemSettings, updates: any) => {
    const newSettings = {
      ...settings,
      [section]: { ...settings[section], ...updates }
    };
    updateMutation.mutate(newSettings);
  };

  const handleTestEmail = () => {
    setIsTestingEmail(true);
    testEmailMutation.mutate(settings.email);
    setTimeout(() => setIsTestingEmail(false), 2000);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure your CRM system preferences and integrations</p>
        </div>
        <Button 
          onClick={() => updateMutation.mutate(settings)}
          className="neomorphism-button bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      <Card className="neomorphism-card">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="backup">Backup</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.general.siteName}
                    onChange={(e) => updateSettings('general', { siteName: e.target.value })}
                    className="neomorphism-input"
                  />
                </div>
                <div>
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input
                    id="siteUrl"
                    value={settings.general.siteUrl}
                    onChange={(e) => updateSettings('general', { siteUrl: e.target.value })}
                    className="neomorphism-input"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={settings.general.timezone} 
                    onValueChange={(value) => updateSettings('general', { timezone: value })}
                  >
                    <SelectTrigger className="neomorphism-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select 
                    value={settings.general.language} 
                    onValueChange={(value) => updateSettings('general', { language: value })}
                  >
                    <SelectTrigger className="neomorphism-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select 
                    value={settings.general.dateFormat} 
                    onValueChange={(value) => updateSettings('general', { dateFormat: value })}
                  >
                    <SelectTrigger className="neomorphism-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={settings.general.currency} 
                    onValueChange={(value) => updateSettings('general', { currency: value })}
                  >
                    <SelectTrigger className="neomorphism-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6 mt-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Security settings affect all users. Changes take effect immediately.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Require Two-Factor Authentication</Label>
                    <Switch
                      checked={settings.security.requireTwoFactor}
                      onCheckedChange={(checked) => updateSettings('security', { requireTwoFactor: checked })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSettings('security', { sessionTimeout: parseInt(e.target.value) })}
                      className="neomorphism-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => updateSettings('security', { passwordMinLength: parseInt(e.target.value) })}
                      className="neomorphism-input"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                    <Input
                      id="loginAttempts"
                      type="number"
                      value={settings.security.loginAttempts}
                      onChange={(e) => updateSettings('security', { loginAttempts: parseInt(e.target.value) })}
                      className="neomorphism-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="apiRateLimit">API Rate Limit (per hour)</Label>
                    <Input
                      id="apiRateLimit"
                      type="number"
                      value={settings.security.apiRateLimit}
                      onChange={(e) => updateSettings('security', { apiRateLimit: parseInt(e.target.value) })}
                      className="neomorphism-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="allowedDomains">Allowed Email Domains</Label>
                    <Textarea
                      id="allowedDomains"
                      value={settings.security.allowedDomains.join('\n')}
                      onChange={(e) => updateSettings('security', { allowedDomains: e.target.value.split('\n').filter(d => d.trim()) })}
                      className="neomorphism-input"
                      placeholder="domain1.com&#10;domain2.com"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Notification Channels
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Email Notifications</Label>
                      <Switch
                        checked={settings.notifications.emailEnabled}
                        onCheckedChange={(checked) => updateSettings('notifications', { emailEnabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>SMS Notifications</Label>
                      <Switch
                        checked={settings.notifications.smsEnabled}
                        onCheckedChange={(checked) => updateSettings('notifications', { smsEnabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Push Notifications</Label>
                      <Switch
                        checked={settings.notifications.pushEnabled}
                        onCheckedChange={(checked) => updateSettings('notifications', { pushEnabled: checked })}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800">Notification Types</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>New Lead Notifications</Label>
                      <Switch
                        checked={settings.notifications.leadNotifications}
                        onCheckedChange={(checked) => updateSettings('notifications', { leadNotifications: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Deal Updates</Label>
                      <Switch
                        checked={settings.notifications.dealNotifications}
                        onCheckedChange={(checked) => updateSettings('notifications', { dealNotifications: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>System Alerts</Label>
                      <Switch
                        checked={settings.notifications.systemAlerts}
                        onCheckedChange={(checked) => updateSettings('notifications', { systemAlerts: checked })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Configuration
                </h4>
                <Button
                  variant="outline"
                  onClick={handleTestEmail}
                  disabled={isTestingEmail}
                  className="neomorphism-button"
                >
                  {isTestingEmail ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={settings.email.smtpHost}
                      onChange={(e) => updateSettings('email', { smtpHost: e.target.value })}
                      className="neomorphism-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={settings.email.smtpPort}
                      onChange={(e) => updateSettings('email', { smtpPort: parseInt(e.target.value) })}
                      className="neomorphism-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpUser">SMTP Username</Label>
                    <Input
                      id="smtpUser"
                      value={settings.email.smtpUser}
                      onChange={(e) => updateSettings('email', { smtpUser: e.target.value })}
                      className="neomorphism-input"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={settings.email.smtpPassword}
                      onChange={(e) => updateSettings('email', { smtpPassword: e.target.value })}
                      className="neomorphism-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={settings.email.fromEmail}
                      onChange={(e) => updateSettings('email', { fromEmail: e.target.value })}
                      className="neomorphism-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={settings.email.fromName}
                      onChange={(e) => updateSettings('email', { fromName: e.target.value })}
                      className="neomorphism-input"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4" />
                    External Integrations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
                      <Input
                        id="googleAnalytics"
                        value={settings.integrations.googleAnalytics}
                        onChange={(e) => updateSettings('integrations', { googleAnalytics: e.target.value })}
                        className="neomorphism-input"
                        placeholder="GA-XXXXXXXXX-X"
                      />
                    </div>
                    <div>
                      <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
                      <Input
                        id="slackWebhook"
                        value={settings.integrations.slackWebhook}
                        onChange={(e) => updateSettings('integrations', { slackWebhook: e.target.value })}
                        className="neomorphism-input"
                        placeholder="https://hooks.slack.com/..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800">CRM Integrations</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Salesforce Integration</Label>
                      <Switch
                        checked={settings.integrations.salesforceEnabled}
                        onCheckedChange={(checked) => updateSettings('integrations', { salesforceEnabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>HubSpot Integration</Label>
                      <Switch
                        checked={settings.integrations.hubspotEnabled}
                        onCheckedChange={(checked) => updateSettings('integrations', { hubspotEnabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Zapier Integration</Label>
                      <Switch
                        checked={settings.integrations.zapierEnabled}
                        onCheckedChange={(checked) => updateSettings('integrations', { zapierEnabled: checked })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="backup" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Backup Settings
                  </h4>
                  <div className="flex items-center justify-between">
                    <Label>Automatic Backups</Label>
                    <Switch
                      checked={settings.backup.autoBackup}
                      onCheckedChange={(checked) => updateSettings('backup', { autoBackup: checked })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select 
                      value={settings.backup.backupFrequency} 
                      onValueChange={(value) => updateSettings('backup', { backupFrequency: value })}
                    >
                      <SelectTrigger className="neomorphism-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="retentionDays">Retention Period (days)</Label>
                    <Input
                      id="retentionDays"
                      type="number"
                      value={settings.backup.retentionDays}
                      onChange={(e) => updateSettings('backup', { retentionDays: parseInt(e.target.value) })}
                      className="neomorphism-input"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800">Data Management</h4>
                  <div className="space-y-3">
                    <Button
                      onClick={() => exportMutation.mutate()}
                      className="neomorphism-button w-full"
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export All Data
                    </Button>
                    <Button
                      onClick={() => document.getElementById('import-file')?.click()}
                      className="neomorphism-button w-full"
                      variant="outline"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import Data
                    </Button>
                    <input
                      id="import-file"
                      type="file"
                      accept=".json,.csv"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </div>
                  
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      <strong>Danger Zone</strong><br />
                      Irreversible actions that affect all system data.
                    </AlertDescription>
                  </Alert>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      if (confirm('Are you sure? This action cannot be undone.')) {
                        toast({ title: 'Success', description: 'System reset initiated' });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reset System
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
