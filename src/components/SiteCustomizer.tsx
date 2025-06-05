
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Palette, 
  Layout, 
  Type, 
  Image, 
  Save, 
  RotateCcw, 
  Eye,
  Upload,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      base: number;
      heading: number;
    };
    lineHeight: number;
  };
  layout: {
    sidebarWidth: number;
    headerHeight: number;
    borderRadius: number;
    spacing: number;
  };
  branding: {
    logo: string;
    companyName: string;
    tagline: string;
    favicon: string;
  };
  features: {
    darkMode: boolean;
    animations: boolean;
    sidebar: boolean;
    breadcrumbs: boolean;
  };
}

// Mock API functions - replace with real endpoints
const customizerApi = {
  getConfig: async (): Promise<ThemeConfig> => {
    // Replace with: const response = await fetch('/api/site/customize');
    return {
      colors: {
        primary: '#8b5cf6',
        secondary: '#3b82f6',
        accent: '#ef4444',
        background: '#f0f2f5',
        surface: '#ffffff',
        text: '#1f2937'
      },
      typography: {
        fontFamily: 'Inter',
        fontSize: {
          base: 14,
          heading: 24
        },
        lineHeight: 1.5
      },
      layout: {
        sidebarWidth: 256,
        headerHeight: 64,
        borderRadius: 12,
        spacing: 16
      },
      branding: {
        logo: '',
        companyName: 'TechPulse CRM',
        tagline: 'Powerful CRM for IT Companies',
        favicon: ''
      },
      features: {
        darkMode: false,
        animations: true,
        sidebar: true,
        breadcrumbs: true
      }
    };
  },
  updateConfig: async (config: Partial<ThemeConfig>): Promise<ThemeConfig> => {
    // Replace with: const response = await fetch('/api/site/customize', { method: 'POST', body: JSON.stringify(config) });
    console.log('Updating config:', config);
    return config as ThemeConfig;
  },
  uploadImage: async (file: File, type: 'logo' | 'favicon'): Promise<string> => {
    // Replace with: const formData = new FormData(); formData.append('file', file); const response = await fetch('/api/site/upload', { method: 'POST', body: formData });
    return URL.createObjectURL(file);
  }
};

export function SiteCustomizer() {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState('theme');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['site-config'],
    queryFn: customizerApi.getConfig
  });

  const updateMutation = useMutation({
    mutationFn: customizerApi.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-config'] });
      toast({ title: 'Success', description: 'Site configuration updated successfully' });
    }
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, type }: { file: File; type: 'logo' | 'favicon' }) => customizerApi.uploadImage(file, type),
    onSuccess: (url, variables) => {
      const newConfig = {
        ...config,
        branding: {
          ...config?.branding,
          [variables.type]: url
        }
      };
      updateMutation.mutate(newConfig);
    }
  });

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neomorphism-violet"></div>
      </div>
    );
  }

  const updateConfig = (updates: Partial<ThemeConfig>) => {
    const newConfig = { ...config, ...updates };
    updateMutation.mutate(newConfig);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate({ file, type });
    }
  };

  const resetToDefaults = () => {
    const defaultConfig: ThemeConfig = {
      colors: {
        primary: '#8b5cf6',
        secondary: '#3b82f6',
        accent: '#ef4444',
        background: '#f0f2f5',
        surface: '#ffffff',
        text: '#1f2937'
      },
      typography: {
        fontFamily: 'Inter',
        fontSize: {
          base: 14,
          heading: 24
        },
        lineHeight: 1.5
      },
      layout: {
        sidebarWidth: 256,
        headerHeight: 64,
        borderRadius: 12,
        spacing: 16
      },
      branding: {
        logo: '',
        companyName: 'TechPulse CRM',
        tagline: 'Powerful CRM for IT Companies',
        favicon: ''
      },
      features: {
        darkMode: false,
        animations: true,
        sidebar: true,
        breadcrumbs: true
      }
    };
    updateMutation.mutate(defaultConfig);
  };

  const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div 
          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => document.getElementById(`color-${label}`)?.click()}
        />
        <Input
          id={`color-${label}`}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="neomorphism-input flex-1"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Site Customizer</h1>
          <p className="text-gray-600 mt-1">Customize your CRM's appearance and branding</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 neomorphism-card p-2">
            <Button
              variant={previewMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('desktop')}
              className="neomorphism-button"
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={previewMode === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('tablet')}
              className="neomorphism-button"
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={previewMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('mobile')}
              className="neomorphism-button"
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="neomorphism-button"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={() => updateMutation.mutate(config)}
            className="neomorphism-button bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="neomorphism-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Customization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="theme">Theme</TabsTrigger>
                  <TabsTrigger value="branding">Branding</TabsTrigger>
                </TabsList>

                <TabsContent value="theme" className="space-y-6 mt-6">
                  {/* Colors */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800">Colors</h4>
                    <ColorPicker
                      label="Primary"
                      value={config.colors.primary}
                      onChange={(value) => updateConfig({
                        colors: { ...config.colors, primary: value }
                      })}
                    />
                    <ColorPicker
                      label="Secondary"
                      value={config.colors.secondary}
                      onChange={(value) => updateConfig({
                        colors: { ...config.colors, secondary: value }
                      })}
                    />
                    <ColorPicker
                      label="Accent"
                      value={config.colors.accent}
                      onChange={(value) => updateConfig({
                        colors: { ...config.colors, accent: value }
                      })}
                    />
                  </div>

                  {/* Typography */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800">Typography</h4>
                    <div>
                      <Label>Font Family</Label>
                      <Select
                        value={config.typography.fontFamily}
                        onValueChange={(value) => updateConfig({
                          typography: { ...config.typography, fontFamily: value }
                        })}
                      >
                        <SelectTrigger className="neomorphism-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Open Sans">Open Sans</SelectItem>
                          <SelectItem value="Lato">Lato</SelectItem>
                          <SelectItem value="Poppins">Poppins</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Base Font Size: {config.typography.fontSize.base}px</Label>
                      <Slider
                        value={[config.typography.fontSize.base]}
                        onValueChange={([value]) => updateConfig({
                          typography: {
                            ...config.typography,
                            fontSize: { ...config.typography.fontSize, base: value }
                          }
                        })}
                        min={12}
                        max={18}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Layout */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800">Layout</h4>
                    <div>
                      <Label>Border Radius: {config.layout.borderRadius}px</Label>
                      <Slider
                        value={[config.layout.borderRadius]}
                        onValueChange={([value]) => updateConfig({
                          layout: { ...config.layout, borderRadius: value }
                        })}
                        min={0}
                        max={24}
                        step={2}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Spacing: {config.layout.spacing}px</Label>
                      <Slider
                        value={[config.layout.spacing]}
                        onValueChange={([value]) => updateConfig({
                          layout: { ...config.layout, spacing: value }
                        })}
                        min={8}
                        max={32}
                        step={4}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800">Features</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Dark Mode</Label>
                        <Switch
                          checked={config.features.darkMode}
                          onCheckedChange={(checked) => updateConfig({
                            features: { ...config.features, darkMode: checked }
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Animations</Label>
                        <Switch
                          checked={config.features.animations}
                          onCheckedChange={(checked) => updateConfig({
                            features: { ...config.features, animations: checked }
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Sidebar</Label>
                        <Switch
                          checked={config.features.sidebar}
                          onCheckedChange={(checked) => updateConfig({
                            features: { ...config.features, sidebar: checked }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="branding" className="space-y-6 mt-6">
                  {/* Company Info */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800">Company Information</h4>
                    <div>
                      <Label>Company Name</Label>
                      <Input
                        value={config.branding.companyName}
                        onChange={(e) => updateConfig({
                          branding: { ...config.branding, companyName: e.target.value }
                        })}
                        className="neomorphism-input"
                      />
                    </div>
                    <div>
                      <Label>Tagline</Label>
                      <Textarea
                        value={config.branding.tagline}
                        onChange={(e) => updateConfig({
                          branding: { ...config.branding, tagline: e.target.value }
                        })}
                        className="neomorphism-input"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800">Brand Assets</h4>
                    <div>
                      <Label>Logo</Label>
                      <div className="mt-2 space-y-3">
                        {config.branding.logo && (
                          <div className="neomorphism-card p-4">
                            <img 
                              src={config.branding.logo} 
                              alt="Logo" 
                              className="max-h-16 object-contain"
                            />
                          </div>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                          className="neomorphism-button w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </Button>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'logo')}
                          className="hidden"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Favicon</Label>
                      <div className="mt-2 space-y-3">
                        {config.branding.favicon && (
                          <div className="neomorphism-card p-4">
                            <img 
                              src={config.branding.favicon} 
                              alt="Favicon" 
                              className="w-8 h-8 object-contain"
                            />
                          </div>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('favicon-upload')?.click()}
                          className="neomorphism-button w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Favicon
                        </Button>
                        <input
                          id="favicon-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'favicon')}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <Card className="neomorphism-card h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
              <div className="text-sm text-gray-500 capitalize">
                {previewMode} View
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className={`mx-auto bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${
                  previewMode === 'desktop' ? 'w-full h-96' :
                  previewMode === 'tablet' ? 'w-3/4 h-80' :
                  'w-1/2 h-96'
                }`}
                style={{
                  borderRadius: `${config.layout.borderRadius}px`,
                  fontFamily: config.typography.fontFamily,
                  fontSize: `${config.typography.fontSize.base}px`
                }}
              >
                {/* Preview Header */}
                <div 
                  className="flex items-center justify-between p-4 border-b"
                  style={{ 
                    backgroundColor: config.colors.surface,
                    height: `${config.layout.headerHeight}px`
                  }}
                >
                  <div className="flex items-center gap-3">
                    {config.branding.logo && (
                      <img 
                        src={config.branding.logo} 
                        alt="Logo" 
                        className="h-8 object-contain"
                      />
                    )}
                    <div>
                      <h2 className="font-bold" style={{ color: config.colors.text }}>
                        {config.branding.companyName}
                      </h2>
                      <p className="text-xs opacity-75" style={{ color: config.colors.text }}>
                        {config.branding.tagline}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div 
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: config.colors.primary }}
                    />
                    <div 
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: config.colors.secondary }}
                    />
                  </div>
                </div>

                {/* Preview Content */}
                <div 
                  className="flex h-full"
                  style={{ backgroundColor: config.colors.background }}
                >
                  {config.features.sidebar && (
                    <div 
                      className="border-r"
                      style={{ 
                        backgroundColor: config.colors.surface,
                        width: `${config.layout.sidebarWidth / 4}px`
                      }}
                    >
                      <div className={`p-${config.layout.spacing / 4} space-y-2`}>
                        {['Dashboard', 'Leads', 'Opportunities'].map((item, index) => (
                          <div
                            key={item}
                            className="p-2 rounded text-sm"
                            style={{
                              backgroundColor: index === 0 ? config.colors.primary : 'transparent',
                              color: index === 0 ? 'white' : config.colors.text,
                              borderRadius: `${config.layout.borderRadius / 2}px`
                            }}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-1 p-4">
                    <div className="space-y-4">
                      <h3 
                        className="text-lg font-bold"
                        style={{ 
                          color: config.colors.text,
                          fontSize: `${config.typography.fontSize.heading}px`
                        }}
                      >
                        Sample Dashboard
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[config.colors.primary, config.colors.secondary, config.colors.accent, '#10b981'].map((color, index) => (
                          <div
                            key={index}
                            className="p-3 rounded shadow-sm"
                            style={{
                              backgroundColor: config.colors.surface,
                              borderRadius: `${config.layout.borderRadius}px`
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-xs" style={{ color: config.colors.text }}>
                                Metric {index + 1}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
