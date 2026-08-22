import React, { useState } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const sampleCsvContent = `fullName,gender,dateOfBirth,phone,email,bloodGroup,allergies
David Miller,Male,1985-06-15,+1 555-0192,david.m@example.com,O+,Pollen
Sarah Jenkins,Female,1992-01-30,+1 555-0843,sarah.j@example.com,A+,Aspirin
Michael Chang,Male,1978-10-12,+1 555-0999,m.chang@example.com,B-,None`;

  const downloadTemplate = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hms_patient_import_template.csv';
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;

      const headers = lines[0].split(',').map((h) => h.trim());
      const records = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim());
        const row: any = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });
        return row;
      });

      setParsedData(records);
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/patients/bulk-import', { records: parsedData });
      showToast('success', 'Bulk Import Complete', `Successfully imported ${res.data.imported} records.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', 'Import Failed', err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-cyan-950 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Bulk Data CSV Import</h3>
            <p className="text-xs text-slate-400">Upload spreadsheet file to register patients in bulk</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Download CSV Template with required columns</span>
          </div>
          <button
            onClick={downloadTemplate}
            className="px-3 py-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-950 border border-cyan-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Template.csv
          </button>
        </div>

        <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center mb-6 bg-slate-950/50 hover:border-cyan-500/50 transition-colors">
          <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-file-input" />
          <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-slate-400" />
            <span className="text-sm font-medium text-slate-200">
              {file ? file.name : 'Click to select CSV file from your computer'}
            </span>
            <span className="text-xs text-slate-500">Supports standard CSV formatting</span>
          </label>
        </div>

        {parsedData.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Preview ({parsedData.length} Records Found)
            </h4>
            <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 sticky top-0 text-slate-400">
                  <tr>
                    <th className="p-2.5">Full Name</th>
                    <th className="p-2.5">Gender</th>
                    <th className="p-2.5">DOB</th>
                    <th className="p-2.5">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {parsedData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-900">
                      <td className="p-2.5 font-medium text-white">{row.fullName}</td>
                      <td className="p-2.5">{row.gender}</td>
                      <td className="p-2.5">{row.dateOfBirth}</td>
                      <td className="p-2.5">{row.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={parsedData.length === 0 || isSubmitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-xl shadow-lg shadow-cyan-950 flex items-center gap-2"
          >
            {isSubmitting ? 'Importing...' : `Import ${parsedData.length} Records`}
          </button>
        </div>
      </div>
    </div>
  );
};
