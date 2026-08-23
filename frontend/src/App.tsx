import React, { useState, useEffect } from 'react';
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
import { PlatformAdminView } from './views/PlatformAdminView';
import { TenantSettingsView } from './views/TenantSettingsView';
import { AuditView } from './views/AuditView';
import { ConcurrencyModal } from './components/common/ConcurrencyModal';
import { MfaSetupModal } from './components/common/MfaSetupModal';
import { CurrencySettingsModal } from './components/common/CurrencySettingsModal';
import { ChangePasswordModal } from './components/common/ChangePasswordModal';

const tabToPathMap: Record<TabType, string> = {
  dashboard: '/dashboard',
  patients: '/patients',
  appointments: '/appointments',
  emr: '/emr',
  lab: '/lab',
  radiology: '/radiology',
  ipd: '/ipd',
  pharmacy: '/pharmacy',
  services: '/services',
  billing: '/billing',
  insurance: '/insurance',
  masterdata: '/masterdata',
  users: '/users',
  'tenant-settings': '/tenant-settings',
  audit: '/audit',
};

const getTabFromPath = (pathname: string): TabType => {
  const cleanPath = pathname.toLowerCase().replace(/\/$/, '') || '/';
  if (cleanPath === '/' || cleanPath === '/dashboard') return 'dashboard';
  for (const [tab, path] of Object.entries(tabToPathMap)) {
    if (cleanPath === path) return tab as TabType;
  }
  return 'dashboard';
};

const MainContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  const [activeTab, setActiveTabState] = useState<TabType>(() => getTabFromPath(window.location.pathname));
  const [activeEmrPatientId, setActiveEmrPatientId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('patientId') || '';
  });

  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const isPlatformPath = window.location.pathname.startsWith('/platform');

  const setActiveTab = (tab: TabType, patientId?: string) => {
    setActiveTabState(tab);
    let newPath = tabToPathMap[tab] || '/dashboard';
    if (tab === 'emr') {
      const pid = patientId !== undefined ? patientId : activeEmrPatientId;
      if (pid) {
        newPath += `?patientId=${encodeURIComponent(pid)}`;
      }
    }
    if (window.location.pathname + window.location.search !== newPath) {
      window.history.pushState({ tab }, '', newPath);
    }
  };

  const handleNavigateToEmr = (patientId: string) => {
    setActiveEmrPatientId(patientId);
    setActiveTab('emr', patientId);
  };

  // Synchronize browser back/forward history navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const currentTab = getTabFromPath(window.location.pathname);
      setActiveTabState(currentTab);
      const params = new URLSearchParams(window.location.search);
      setActiveEmrPatientId(params.get('patientId') || '');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-mono text-sm">
        Initializing HMS Enterprise Care...
      </div>
    );
  }

  // Dedicated Standalone Platform Portal Route (/platform)
  if (isPlatformPath) {
    return <PlatformAdminView />;
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
