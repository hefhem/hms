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
  Settings,
  ChevronLeft,
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
  | 'tenant-settings'
  | 'audit';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  // Sidebar Collapsed State (Persisted in localStorage)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('hms_sidebar_collapsed') === 'true';
  });

  // Collapsible Sub-Menu Section States
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    clinical: true,
    diagnostics: true,
    pharmacy: true,
    financials: true,
    admin: true,
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('hms_sidebar_collapsed', String(next));
      return next;
    });
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const navGroups = [
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
        { id: 'tenant-settings', label: 'Company SMTP & Settings', icon: Settings, roles: ['ADMIN'] },
        { id: 'audit', label: 'System Audit Logs', icon: ShieldCheck, roles: ['ADMIN'] },
      ],
    },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-72'
      } bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 transition-all duration-300 relative overflow-x-hidden select-none z-30`}
    >
      <div className="p-3 overflow-y-auto overflow-x-hidden max-h-screen">
        {/* Brand Header & Toggle Button */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-950 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-white text-sm tracking-wide leading-tight truncate">ApexCare HMS</h1>
                <span className="text-[10px] text-cyan-400 font-mono font-semibold block truncate">Enterprise Suite</span>
              </div>
            </div>

            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shadow-md shrink-0"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-950">
              <Building2 className="w-5 h-5" />
            </div>
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shadow-md"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

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
                {/* Group Title (Expanded Only) */}
                {!isCollapsed && (
                  <button
                    onClick={() => toggleSection(group.id)}
                    className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <span className="truncate">{group.title}</span>
                    {isOpen ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                  </button>
                )}

                {/* Group Divider when Collapsed */}
                {isCollapsed && (
                  <div className="h-px bg-slate-800/80 my-2" title={group.title} />
                )}

                {(isOpen || isCollapsed) && (
                  <div className="space-y-1">
                    {filteredItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id as TabType)}
                          title={isCollapsed ? item.label : undefined}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group ${
                            isCollapsed ? 'justify-center' : 'justify-start'
                          } ${
                            isActive
                              ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40 shadow-md shadow-cyan-950/40 font-bold'
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                          {!isCollapsed && (
                            <span className="truncate whitespace-nowrap leading-none text-left">{item.label}</span>
                          )}

                          {/* Hover Tooltip for Collapsed Sidebar */}
                          {isCollapsed && (
                            <div className="fixed left-20 ml-2 px-3 py-1.5 bg-slate-950 text-white text-xs font-bold rounded-xl border border-slate-700 shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                              {item.label}
                            </div>
                          )}
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
      <div className="p-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 flex items-center justify-between">
        {!isCollapsed ? (
          <>
            <span className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span className="truncate">Hospital Workspace</span>
            </span>
            <span className="text-slate-600 shrink-0 text-[10px]">v2.3.0</span>
          </>
        ) : (
          <div className="w-full flex justify-center py-1" title="Hospital Workspace v2.3.0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
        )}
      </div>
    </aside>
  );
};
