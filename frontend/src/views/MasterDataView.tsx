import React, { useEffect, useState } from 'react';
import { Database, Plus, Shield, Bed, ReceiptText, Pill, CheckCircle2, X, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { ExportOptions } from '../components/common/ExportOptions';

export const MasterDataView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hmo' | 'beds' | 'services' | 'drugs'>('hmo');

  // Master Data Collections
  const [hmoProviders, setHmoProviders] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [drugs, setDrugs] = useState<any[]>([]);

  // Selected Item for Editing
  const [editingItem, setEditingItem] = useState<any>(null);

  // Modals Visibility
  const [isHmoModalOpen, setIsHmoModalOpen] = useState(false);
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isDrugModalOpen, setIsDrugModalOpen] = useState(false);

  // Forms State
  const [hmoForm, setHmoForm] = useState({
    code: '',
    name: '',
    planType: 'Comprehensive Corporate',
    contactEmail: '',
    contactPhone: '',
  });

  const [bedForm, setBedForm] = useState({
    bedNumber: '',
    wardName: 'General Male Ward',
    bedClass: 'GENERAL',
    pricePerNight: 80.0,
  });

  const [serviceForm, setServiceForm] = useState({
    code: '',
    name: '',
    category: 'CONSULTATION',
    price: 50.0,
  });

  const [drugForm, setDrugForm] = useState({
    code: '',
    name: '',
    category: 'Antibiotics',
    unitPrice: 12.5,
    quantityInStock: 100,
    reorderLevel: 20,
    unit: 'Tablets',
  });

  const { formatCurrency } = useSettings();
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [hRes, bRes, sRes, dRes] = await Promise.all([
        api.get('/insurance/providers'),
        api.get('/ipd/beds'),
        api.get('/services'),
        api.get('/pharmacy/drugs'),
      ]);
      setHmoProviders(hRes.data);
      setBeds(bRes.data);
      setServices(sRes.data);
      setDrugs(dRes.data);
    } catch (err: any) {
      showToast('error', 'Error Loading Master Data', err.message);
    }
  };

  // --- HMO PROVIDERS CRUD ---
  const handleSaveHmo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/insurance/providers/${editingItem.id}`, hmoForm);
        showToast('success', 'HMO Master Updated', `Updated ${hmoForm.name}`);
      } else {
        await api.post('/insurance/providers', hmoForm);
        showToast('success', 'HMO Master Created', `Created ${hmoForm.name}`);
      }
      setIsHmoModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'HMO Save Failed', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteHmo = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this HMO Provider Master entry?')) return;
    try {
      await api.delete(`/insurance/providers/${id}`);
      showToast('success', 'HMO Master Deleted', 'Entry removed');
      fetchData();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.response?.data?.message || err.message);
    }
  };

  // --- BEDS CRUD ---
  const handleSaveBed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/ipd/beds/${editingItem.id}`, bedForm);
        showToast('success', 'Bed Master Updated', `Bed ${bedForm.bedNumber} updated.`);
      } else {
        await api.post('/ipd/beds', bedForm);
        showToast('success', 'Bed Master Created', `Bed ${bedForm.bedNumber} added.`);
      }
      setIsBedModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Bed Save Failed', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteBed = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Ward Bed entry?')) return;
    try {
      await api.delete(`/ipd/beds/${id}`);
      showToast('success', 'Bed Deleted', 'Bed entry removed');
      fetchData();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.response?.data?.message || err.message);
    }
  };

  // --- SERVICES CRUD ---
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/services/${editingItem.id}`, serviceForm);
        showToast('success', 'Service Master Updated', `Service ${serviceForm.name} updated.`);
      } else {
        await api.post('/services', serviceForm);
        showToast('success', 'Service Master Created', `Service ${serviceForm.name} created.`);
      }
      setIsServiceModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Service Save Failed', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Service Master entry?')) return;
    try {
      await api.delete(`/services/${id}`);
      showToast('success', 'Service Deleted', 'Service entry removed');
      fetchData();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.response?.data?.message || err.message);
    }
  };

  // --- DRUGS CRUD ---
  const handleSaveDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/pharmacy/drugs/${editingItem.id}`, drugForm);
        showToast('success', 'Drug Master Updated', `Drug ${drugForm.name} updated.`);
      } else {
        await api.post('/pharmacy/drugs', drugForm);
        showToast('success', 'Drug Master Created', `Drug ${drugForm.name} created.`);
      }
      setIsDrugModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Drug Save Failed', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteDrug = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Drug Master entry?')) return;
    try {
      await api.delete(`/pharmacy/drugs/${id}`);
      showToast('success', 'Drug Deleted', 'Drug entry removed');
      fetchData();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Central Master Data & Configuration Catalog</h2>
          <p className="text-xs text-slate-400">Full Create, Read, Update & Delete (CRUD) for HMOs, Ward Beds, Services & Drugs</p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'hmo' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setHmoForm({ code: `HMO-${Math.floor(100+Math.random()*900)}`, name: '', planType: 'Comprehensive Corporate', contactEmail: '', contactPhone: '' });
                setIsHmoModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add HMO Provider
            </button>
          )}

          {activeTab === 'beds' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setBedForm({ bedNumber: '', wardName: 'General Male Ward', bedClass: 'GENERAL', pricePerNight: 80.0 });
                setIsBedModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Ward Bed
            </button>
          )}

          {activeTab === 'services' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setServiceForm({ code: `SRV-GEN-${Math.floor(100+Math.random()*900)}`, name: '', category: 'CONSULTATION', price: 50.0 });
                setIsServiceModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Master Service
            </button>
          )}

          {activeTab === 'drugs' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setDrugForm({ code: `DRUG-${Math.floor(100+Math.random()*900)}`, name: '', category: 'Antibiotics', unitPrice: 12.5, quantityInStock: 100, reorderLevel: 20, unit: 'Tablets' });
                setIsDrugModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Formulary Drug
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('hmo')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'hmo'
              ? 'bg-purple-950 text-purple-300 border border-purple-500/40 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4 text-purple-400" />
          HMO Payers Master ({hmoProviders.length})
        </button>

        <button
          onClick={() => setActiveTab('beds')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'beds'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bed className="w-4 h-4 text-cyan-400" />
          Ward Beds Master ({beds.length})
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'services'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ReceiptText className="w-4 h-4 text-emerald-400" />
          Service Charge Master ({services.length})
        </button>

        <button
          onClick={() => setActiveTab('drugs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'drugs'
              ? 'bg-amber-950 text-amber-300 border border-amber-500/40 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Pill className="w-4 h-4 text-amber-400" />
          Drug Formulary Master ({drugs.length})
        </button>
      </div>

      {/* Tab 1: HMO Payers Master */}
      {activeTab === 'hmo' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-white text-sm">HMO Insurance Providers Master Directory</h3>
            <ExportOptions data={hmoProviders} filename="hms_hmo_providers_master" />
          </div>
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4">Code</th>
                <th className="p-4">HMO Provider Name</th>
                <th className="p-4">Plan / Package Tier</th>
                <th className="p-4">Authorization Email</th>
                <th className="p-4">Contact Phone</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {hmoProviders.map((hmo) => (
                <tr key={hmo.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-purple-400">{hmo.code}</td>
                  <td className="p-4 font-bold text-white">{hmo.name}</td>
                  <td className="p-4 text-xs text-slate-300">{hmo.planType}</td>
                  <td className="p-4 font-mono text-xs text-cyan-400">{hmo.contactEmail}</td>
                  <td className="p-4 font-mono text-xs text-slate-400">{hmo.contactPhone}</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingItem(hmo);
                        setHmoForm({ code: hmo.code, name: hmo.name, planType: hmo.planType || '', contactEmail: hmo.contactEmail || '', contactPhone: hmo.contactPhone || '' });
                        setIsHmoModalOpen(true);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteHmo(hmo.id)}
                      className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Ward Beds Master */}
      {activeTab === 'beds' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-white text-sm">Hospital Ward Beds & Nightly Rate Master</h3>
            <ExportOptions data={beds} filename="hms_ward_beds_master" />
          </div>
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4">Bed Number</th>
                <th className="p-4">Ward Location</th>
                <th className="p-4">Bed Tier Class</th>
                <th className="p-4">Price / Night</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {beds.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-cyan-400">{b.bedNumber}</td>
                  <td className="p-4 font-medium text-white">{b.wardName}</td>
                  <td className="p-4 text-xs font-mono text-purple-300 font-bold">{b.bedClass}</td>
                  <td className="p-4 font-mono font-bold text-emerald-400">{formatCurrency(b.pricePerNight)}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        b.status === 'VACANT'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingItem(b);
                        setBedForm({ bedNumber: b.bedNumber, wardName: b.wardName, bedClass: b.bedClass, pricePerNight: b.pricePerNight });
                        setIsBedModalOpen(true);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBed(b.id)}
                      className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Service Charge Master */}
      {activeTab === 'services' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-white text-sm">Standardized Charge Master & Tariff Price List</h3>
            <ExportOptions data={services} filename="hms_service_master" />
          </div>
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4">Service Code</th>
                <th className="p-4">Service Description</th>
                <th className="p-4">Category</th>
                <th className="p-4">Standard Tariff</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {services.map((srv) => (
                <tr key={srv.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-cyan-400">{srv.code}</td>
                  <td className="p-4 font-medium text-white">{srv.name}</td>
                  <td className="p-4 font-mono text-xs text-purple-300">{srv.category}</td>
                  <td className="p-4 font-mono font-bold text-emerald-400">{formatCurrency(srv.price)}</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingItem(srv);
                        setServiceForm({ code: srv.code, name: srv.name, category: srv.category, price: srv.price });
                        setIsServiceModalOpen(true);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(srv.id)}
                      className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Drug Formulary Master */}
      {activeTab === 'drugs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-white text-sm">Approved Drug Formulary Catalog</h3>
            <ExportOptions data={drugs} filename="hms_drug_formulary" />
          </div>
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4">SKU Code</th>
                <th className="p-4">Medication Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Stock Level</th>
                <th className="p-4">Unit Price</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {drugs.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-cyan-400">{d.code}</td>
                  <td className="p-4 font-medium text-white">{d.name}</td>
                  <td className="p-4 font-mono text-xs text-amber-300">{d.category}</td>
                  <td className="p-4 font-mono font-bold text-slate-300">{d.quantityInStock} {d.unit}</td>
                  <td className="p-4 font-mono font-bold text-emerald-400">{formatCurrency(d.unitPrice)}</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingItem(d);
                        setDrugForm({ code: d.code, name: d.name, category: d.category, unitPrice: d.unitPrice, quantityInStock: d.quantityInStock, reorderLevel: d.reorderLevel || 20, unit: d.unit || 'Tablets' });
                        setIsDrugModalOpen(true);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDrug(d.id)}
                      className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* HMO Provider Modal (Create/Edit) */}
      {isHmoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsHmoModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">{editingItem ? 'Edit HMO Provider Master' : 'Add HMO Provider Master'}</h3>

            <form onSubmit={handleSaveHmo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">HMO Provider Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HMO-REL"
                  value={hmoForm.code}
                  onChange={(e) => setHmoForm({ ...hmoForm, code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Provider Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reliance HMO Care"
                  value={hmoForm.name}
                  onChange={(e) => setHmoForm({ ...hmoForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Plan / Tier Description</label>
                <input
                  type="text"
                  value={hmoForm.planType}
                  onChange={(e) => setHmoForm({ ...hmoForm, planType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={hmoForm.contactEmail}
                    onChange={(e) => setHmoForm({ ...hmoForm, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={hmoForm.contactPhone}
                    onChange={(e) => setHmoForm({ ...hmoForm, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsHmoModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg"
                >
                  Save HMO Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bed Modal (Create/Edit) */}
      {isBedModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsBedModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">{editingItem ? 'Edit Ward Bed Master' : 'Add Ward Bed Master'}</h3>

            <form onSubmit={handleSaveBed} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Bed Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BED-103"
                  value={bedForm.bedNumber}
                  onChange={(e) => setBedForm({ ...bedForm, bedNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Ward Location</label>
                <input
                  type="text"
                  required
                  value={bedForm.wardName}
                  onChange={(e) => setBedForm({ ...bedForm, wardName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Bed Class Tier</label>
                  <select
                    value={bedForm.bedClass}
                    onChange={(e) => setBedForm({ ...bedForm, bedClass: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  >
                    <option value="GENERAL">GENERAL</option>
                    <option value="PRIVATE">PRIVATE</option>
                    <option value="ICU">ICU</option>
                    <option value="ISOLATION">ISOLATION</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Price / Night</label>
                  <input
                    type="number"
                    required
                    value={bedForm.pricePerNight}
                    onChange={(e) => setBedForm({ ...bedForm, pricePerNight: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBedModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950"
                >
                  Save Bed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Modal (Create/Edit) */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsServiceModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">{editingItem ? 'Edit Service Charge Master' : 'Add Service Charge Master'}</h3>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Service Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SRV-CONS-CARD"
                  value={serviceForm.code}
                  onChange={(e) => setServiceForm({ ...serviceForm, code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Service Name / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiology Specialist Consultation"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  >
                    <option value="CONSULTATION">CONSULTATION</option>
                    <option value="LABORATORY">LABORATORY</option>
                    <option value="RADIOLOGY">RADIOLOGY</option>
                    <option value="NURSING">NURSING</option>
                    <option value="SURGERY">SURGERY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Standard Price</label>
                  <input
                    type="number"
                    required
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-950"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drug Modal (Create/Edit) */}
      {isDrugModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsDrugModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">{editingItem ? 'Edit Drug Formulary Master' : 'Add Drug Formulary Master'}</h3>

            <form onSubmit={handleSaveDrug} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">SKU Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DRUG-AMOX-500"
                  value={drugForm.code}
                  onChange={(e) => setDrugForm({ ...drugForm, code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Medication Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amoxicillin Trihydrate 500mg"
                  value={drugForm.name}
                  onChange={(e) => setDrugForm({ ...drugForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={drugForm.category}
                    onChange={(e) => setDrugForm({ ...drugForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Unit Price</label>
                  <input
                    type="number"
                    required
                    value={drugForm.unitPrice}
                    onChange={(e) => setDrugForm({ ...drugForm, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={drugForm.quantityInStock}
                    onChange={(e) => setDrugForm({ ...drugForm, quantityInStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={drugForm.unit}
                    onChange={(e) => setDrugForm({ ...drugForm, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDrugModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-lg"
                >
                  Save Drug
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
