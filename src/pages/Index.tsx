
import { useState } from 'react';
import { CRMLayout } from '@/components/CRMLayout';
import { Dashboard } from '@/components/Dashboard';
import { LeadManagement } from '@/components/LeadManagement';
import { OpportunityPipeline } from '@/components/OpportunityPipeline';
import { UserManagement } from '@/components/UserManagement';
import { StaffManagement } from '@/components/StaffManagement';
import { UserRoles } from '@/components/UserRoles';
import { Analytics } from '@/components/Analytics';
import { SiteCustomizer } from '@/components/SiteCustomizer';
import { Settings } from '@/components/Settings';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'leads':
        return <LeadManagement />;
      case 'opportunities':
        return <OpportunityPipeline />;
      case 'users':
        return <UserManagement />;
      case 'staff':
        return <StaffManagement />;
      case 'roles':
        return <UserRoles />;
      case 'analytics':
        return <Analytics />;
      case 'customizer':
        return <SiteCustomizer />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ErrorBoundary>
      <CRMLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <ErrorBoundary>
          {renderContent()}
        </ErrorBoundary>
      </CRMLayout>
    </ErrorBoundary>
  );
};

export default Index;
