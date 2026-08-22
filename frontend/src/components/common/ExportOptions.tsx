import React from 'react';
import { Download } from 'lucide-react';

interface ExportOptionsProps {
  data: any[];
  filename: string;
  label?: string;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({ data, filename, label = 'Export CSV' }) => {
  const exportToCsv = () => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map((header) => {
        const val = row[header];
        const escaped = ('' + (val ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <button
      onClick={exportToCsv}
      disabled={!data || data.length === 0}
      className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-xl border border-slate-700 flex items-center gap-2 transition-all shadow-sm"
    >
      <Download className="w-4 h-4 text-cyan-400" />
      {label}
    </button>
  );
};
