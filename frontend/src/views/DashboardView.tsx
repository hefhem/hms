import React, { useEffect, useState } from 'react';
import {
  Users,
  Calendar,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Pill,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';

export const DashboardView: React.FC = () => {
  const [patientCount, setPatientCount] = useState<number>(0);
  const [appointmentCount, setAppointmentCount] = useState<number>(0);
  const [lowStockDrugs, setLowStockDrugs] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<number>(0);
  const { formatCurrency, currencyCode } = useSettings();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const [patientsRes, appRes, drugsRes, invRes] = await Promise.all([
        api.get('/patients'),
        api.get('/appointments'),
        api.get('/pharmacy/drugs'),
        api.get('/billing/invoices'),
      ]);

      setPatientCount(patientsRes.data.length);
      setAppointmentCount(appRes.data.length);

      const lowStock = drugsRes.data.filter((d: any) => d.quantityInStock <= d.reorderLevel);
      setLowStockDrugs(lowStock);

      const totalPaid = invRes.data
        .filter((inv: any) => inv.paymentStatus === 'PAID')
        .reduce((sum: number, inv: any) => sum + inv.finalAmount, 0);
      setRevenue(totalPaid);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    }
  };

  const chartData = [
    { day: 'Mon', consultations: 12, revenue: 1400 },
    { day: 'Tue', consultations: 19, revenue: 2100 },
    { day: 'Wed', consultations: 15, revenue: 1850 },
    { day: 'Thu', consultations: 22, revenue: 2900 },
    { day: 'Fri', consultations: 28, revenue: 3400 },
    { day: 'Sat', consultations: 14, revenue: 1600 },
    { day: 'Sun', consultations: 8, revenue: 950 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Patients</span>
            <div className="text-2xl font-bold text-white mt-1">{patientCount}</div>
            <div className="flex items-center gap-1 text-emerald-400 text-xs mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+14% this month</span>
            </div>
          </div>
          <div className="p-3 bg-cyan-950/70 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Appointments Queue</span>
            <div className="text-2xl font-bold text-white mt-1">{appointmentCount}</div>
            <div className="flex items-center gap-1 text-cyan-400 text-xs mt-1">
              <Activity className="w-3.5 h-3.5" />
              <span>Active Queue</span>
            </div>
          </div>
          <div className="p-3 bg-blue-950/70 border border-blue-500/30 rounded-xl text-blue-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock Drugs</span>
            <div className="text-2xl font-bold text-white mt-1">{lowStockDrugs.length}</div>
            <div className="flex items-center gap-1 text-amber-400 text-xs mt-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Reorder alert</span>
            </div>
          </div>
          <div className="p-3 bg-amber-950/70 border border-amber-500/30 rounded-xl text-amber-400">
            <Pill className="w-6 h-6" />
          </div>
        </div>

        {/* Collections */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Revenue ({currencyCode})</span>
            <div className="text-2xl font-bold text-white mt-1">{formatCurrency(revenue)}</div>
            <div className="flex items-center gap-1 text-emerald-400 text-xs mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Invoiced & Settled</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-950/70 border border-emerald-500/30 rounded-xl text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Low Stock Banner Warning */}
      {lowStockDrugs.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-amber-200">Pharmacy Inventory Warning</h4>
              <p className="text-xs text-amber-300/80">
                {lowStockDrugs.map((d) => d.name).join(', ')} reached low stock reorder level.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Consultations */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4">Weekly Patient Consultations Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="consultationGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="consultations"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#consultationGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Growth Bar */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4">Daily Collections ({currencyCode})</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
