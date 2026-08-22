import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { Header } from './components/layout/Header';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { PatientsView } from './views/PatientsView';
import { AppointmentsView } from './views/AppointmentsView';
import { EmrView } from './views/EmrView';
import { LabView } from './views/LabView';
import { RadiologyView } from './views/RadiologyView';
import { IpdView } from './views/IpdView';
import { PharmacyView } from './views/PharmacyView';
import { ServicesView } from './views/ServicesView';
import { BillingView } from './views/BillingView';
import { InsuranceView } from './views/InsuranceView';
import { MasterDataView } from './views/MasterDataView';
import { UsersManagementView } from './views/UsersManagementView';
import { TenantManagementView } from './views/TenantManagementView';
import { PlatformAdminView } from './views/PlatformAdminView';
import { TenantSettingsView } from './views/TenantSettingsView';
import { AuditView } from './views/AuditView';
import { ConcurrencyModal } from './components/common/ConcurrencyModal';
import { MfaSetupModal } from './components/common/MfaSetupModal';
import { CurrencySettingsModal } from './components/common/CurrencySettingsModal';
import { ChangePasswordModal } from './components/common/ChangePasswordModal';

const MainContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [activeEmrPatientId, setActiveEmrPatientId] = useState<string>('');
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleNavigateToEmr = (patientId: string) => {
    setActiveEmrPatientId(patientId);
    setActiveTab('emr');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-mono text-sm">
        Initializing HMS Enterprise Care...
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenMfa={() => setIsMfaModalOpen(true)}
          onOpenCurrency={() => setIsCurrencyModalOpen(true)}
          onOpenChangePassword={() => setIsPasswordModalOpen(true)}
        />
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'patients' && <PatientsView />}
          {activeTab === 'appointments' && <AppointmentsView onNavigateToEmr={handleNavigateToEmr} />}
          {activeTab === 'emr' && <EmrView initialPatientId={activeEmrPatientId} />}
          {activeTab === 'lab' && <LabView />}
          {activeTab === 'radiology' && <RadiologyView />}
          {activeTab === 'ipd' && <IpdView />}
          {activeTab === 'pharmacy' && <PharmacyView />}
          {activeTab === 'services' && <ServicesView />}
          {activeTab === 'billing' && <BillingView />}
          {activeTab === 'insurance' && <InsuranceView />}
          {activeTab === 'masterdata' && <MasterDataView />}
          {activeTab === 'users' && <UsersManagementView />}
          {activeTab === 'tenants' && <TenantManagementView />}
          {activeTab === 'platform' && <PlatformAdminView />}
          {activeTab === 'tenant-settings' && <TenantSettingsView />}
          {activeTab === 'audit' && <AuditView />}
        </main>
      </div>

      {/* Root-Level Modals */}
      <ConcurrencyModal />
      <MfaSetupModal isOpen={isMfaModalOpen} onClose={() => setIsMfaModalOpen(false)} />
      <CurrencySettingsModal isOpen={isCurrencyModalOpen} onClose={() => setIsCurrencyModalOpen(false)} />
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </div>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SettingsProvider>
          <MainContent />
        </SettingsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
