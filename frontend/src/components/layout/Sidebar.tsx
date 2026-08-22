import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  Pill,
  CreditCard,
  ShieldCheck,
  Building2,
  TestTube,
  ReceiptText,
  Film,
  Bed,
  Shield,
  Database,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Globe,
  Server,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type TabType =
  | 'dashboard'
  | 'patients'
  | 'appointments'
  | 'emr'
  | 'lab'
  | 'radiology'
  | 'ipd'
  | 'pharmacy'
  | 'services'
  | 'billing'
  | 'insurance'
  | 'masterdata'
  | 'users'
  | 'tenants'
  | 'audit';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  // Collapsible Sub-Menu Section States
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    saas: true,
    clinical: true,
    diagnostics: true,
    pharmacy: true,
    financials: true,
    admin: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const navGroups = [
    {
      id: 'saas',
      title: '🏢 Multi-Tenant SaaS Platform',
      items: [
        { id: 'tenants', label: 'Tenant Workspaces & SMTP', icon: Globe, roles: ['ADMIN'] },
      ],
    },
    {
      id: 'clinical',
      title: 'Clinical Care',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'BILLING_CLERK'] },
        { id: 'patients', label: 'Patient Master', icon: Users, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
        { id: 'appointments', label: 'Appointments Queue', icon: Calendar, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
        { id: 'emr', label: 'EMR Consultations', icon: Stethoscope, roles: ['ADMIN', 'DOCTOR'] },
      ],
    },
    {
      id: 'diagnostics',
      title: 'Diagnostics & Ward',
      items: [
        { id: 'lab', label: 'Laboratory (LIS)', icon: TestTube, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
        { id: 'radiology', label: 'Radiology (RIS/PACS)', icon: Film, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
        { id: 'ipd', label: 'IPD Ward & Beds', icon: Bed, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
      ],
    },
    {
      id: 'pharmacy',
      title: 'Pharmacy & Stock',
      items: [
        { id: 'pharmacy', label: 'Pharmacy Inventory', icon: Pill, roles: ['ADMIN', 'PHARMACIST', 'DOCTOR'] },
      ],
    },
    {
      id: 'financials',
      title: 'Financials & HMO',
      items: [
        { id: 'services', label: 'Service Price List', icon: ReceiptText, roles: ['ADMIN', 'BILLING_CLERK'] },
        { id: 'billing', label: 'Billing & Invoices', icon: CreditCard, roles: ['ADMIN', 'BILLING_CLERK'] },
        { id: 'insurance', label: 'HMO & Insurance Claims', icon: Shield, roles: ['ADMIN', 'BILLING_CLERK', 'RECEPTIONIST'] },
      ],
    },
    {
      id: 'admin',
      title: 'Master Data & Admin',
      items: [
        { id: 'masterdata', label: 'Master Data Catalog', icon: Database, roles: ['ADMIN', 'BILLING_CLERK'] },
        { id: 'users', label: 'User Roles & Staff', icon: UserCheck, roles: ['ADMIN'] },
        { id: 'audit', label: 'System Audit Logs', icon: ShieldCheck, roles: ['ADMIN'] },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
      <div className="p-5 overflow-y-auto max-h-screen">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-950">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-wide leading-none">ApexCare HMS</h1>
            <span className="text-[10px] text-cyan-400 font-mono font-semibold">Enterprise Hospital Suite</span>
          </div>
        </div>

        {/* Grouped Sub-Menu Navigation */}
        <nav className="space-y-4">
          {navGroups.map((group) => {
            const filteredItems = group.items.filter((item) =>
              user ? item.roles.includes(user.role) : true,
            );

            if (filteredItems.length === 0) return null;
            const isOpen = openSections[group.id];

            return (
              <div key={group.id} className="space-y-1">
                <button
                  onClick={() => toggleSection(group.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <span>{group.title}</span>
                  {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {isOpen && (
                  <div className="space-y-1 pl-1">
                    {filteredItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id as TabType)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-950'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Multi-Tenant Engine
        </span>
        <span className="text-slate-600">v2.2.0</span>
      </div>
    </aside>
  );
};
