
import { useState } from 'react';
import { CRMLayout } from '@/components/CRMLayout';
import { Dashboard } from '@/components/Dashboard';
import { LeadManagement } from '@/components/LeadManagement';
import { OpportunityPipeline } from '@/components/OpportunityPipeline';
import { UserManagement } from '@/components/UserManagement';

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
        return (
          <div className="neomorphism-card p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Staff Management</h2>
            <p className="text-gray-600">Staff management module coming soon...</p>
          </div>
        );
      case 'roles':
        return (
          <div className="neomorphism-card p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">User Roles Management</h2>
            <p className="text-gray-600">Role management module coming soon...</p>
          </div>
        );
      case 'analytics':
        return (
          <div className="neomorphism-card p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Analytics</h2>
            <p className="text-gray-600">Advanced analytics module coming soon...</p>
          </div>
        );
      case 'customizer':
        return (
          <div className="neomorphism-card p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Site Customizer</h2>
            <p className="text-gray-600">Theme customization module coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="neomorphism-card p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Settings</h2>
            <p className="text-gray-600">System settings module coming soon...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <CRMLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </CRMLayout>
  );
};

export default Index;
