import React, { useEffect, useState } from 'react';
import { Shield, Lock, Eye, Filter, CheckCircle2, FileText, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { ExportOptions } from '../components/common/ExportOptions';

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { showToast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, [entityFilter, actionFilter]);

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/audit-logs', {
        params: { entityName: entityFilter || undefined, action: actionFilter || undefined },
      });
      setLogs(res.data);
    } catch (err: any) {
      showToast('error', 'Audit Log Error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* VAPT & Security Hardening Status Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 to-slate-900 border border-purple-500/30 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-900/60 border border-purple-400/30 rounded-2xl text-purple-300">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">VAPT & Security Hardening Status</h3>
            <p className="text-xs text-purple-200/80">
              Helmet HTTP headers active, NestJS Throttler Rate Limiter (120 req/min), TypeORM Parameterized Query SQLi Protection, MFA TOTP.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1 bg-emerald-950 border border-emerald-500/40 text-emerald-300 rounded-lg flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Audit Logging Active
          </span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          >
            <option value="">All Entities</option>
            <option value="PATIENT">PATIENT</option>
            <option value="DRUG">DRUG</option>
            <option value="PRESCRIPTION">PRESCRIPTION</option>
            <option value="INVOICE">INVOICE</option>
            <option value="USER">USER</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="DISPENSE">DISPENSE</option>
          </select>
        </div>

        <ExportOptions data={logs} filename="hms_audit_trail_logs" label="Export Audit Logs CSV" />
      </div>

      {/* Audit Logs Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Action</th>
              <th className="p-4">Target Entity</th>
              <th className="p-4">IP Address</th>
              <th className="p-4 text-right">Inspect Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-4 text-white font-medium">{log.userEmail || 'System'}</td>
                <td className="p-4 text-cyan-400">{log.userRole || 'ANONYMOUS'}</td>
                <td className="p-4 font-bold text-amber-400">{log.action}</td>
                <td className="p-4 text-purple-300 font-bold">{log.entityName}</td>
                <td className="p-4 text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg inline-flex items-center gap-1 font-sans text-xs font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Diff
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* JSON Diff Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button onClick={() => setSelectedLog(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Audit Record JSON Payload Diff</h3>
            <p className="text-xs text-slate-400 mb-4">Log ID: {selectedLog.id}</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 mb-2">Previous State</h4>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-amber-300 font-mono overflow-x-auto max-h-64">
                  {JSON.stringify(selectedLog.previousState, null, 2) || 'null'}
                </pre>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 mb-2">New Payload State</h4>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-emerald-300 font-mono overflow-x-auto max-h-64">
                  {JSON.stringify(selectedLog.newState, null, 2) || 'null'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
