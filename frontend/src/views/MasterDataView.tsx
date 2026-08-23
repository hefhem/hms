import React, { useEffect, useState } from 'react';
import {
  Database,
  Plus,
  Shield,
  Bed,
  ReceiptText,
  Pill,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  TestTube,
  Film,
  Search,
  Check,
  DollarSign,
  Layers,
  FileText,
  Activity,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { ExportOptions } from '../components/common/ExportOptions';

export const MasterDataView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'lab_services' | 'radiology_services' | 'pricelist' | 'hmo' | 'beds' | 'drugs'>('lab_services');

  // Data Collections
  const [hmoProviders, setHmoProviders] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [drugs, setDrugs] = useState<any[]>([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Selected Item for Editing
  const [editingItem, setEditingItem] = useState<any>(null);

  // Modals Visibility
  const [isHmoModalOpen, setIsHmoModalOpen] = useState(false);
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [isLabServiceModalOpen, setIsLabServiceModalOpen] = useState(false);
  const [isRadServiceModalOpen, setIsRadServiceModalOpen] = useState(false);
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

  const [labServiceForm, setLabServiceForm] = useState({
    code: 'LAB-TEST-01',
    name: '',
    category: 'LABORATORY',
    department: 'Hematology',
    specimenType: 'Whole Blood (EDTA)',
    referenceRange: '4.5 - 11.0 x10^9/L',
    price: 45.0,
    currency: 'USD',
  });

  const [radServiceForm, setRadServiceForm] = useState({
    code: 'RAD-PROC-01',
    name: '',
    category: 'RADIOLOGY',
    department: 'Diagnostic Radiology',
    modality: 'X-RAY',
    bodyRegion: 'Chest',
    prepInstructions: 'Remove metallic jewelry and accessories.',
    price: 85.0,
    currency: 'USD',
  });

  const [serviceForm, setServiceForm] = useState({
    code: '',
    name: '',
    category: 'CONSULTATION',
    department: 'General OPD',
    price: 50.0,
    currency: 'USD',
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

  const { formatCurrency, currencyCode } = useSettings();
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

  // --- IPD BEDS CRUD ---
  const handleSaveBed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/ipd/beds/${editingItem.id}`, bedForm);
        showToast('success', 'Bed Master Updated', `Updated Bed ${bedForm.bedNumber}`);
      } else {
        await api.post('/ipd/beds', bedForm);
        showToast('success', 'Bed Master Created', `Created Bed ${bedForm.bedNumber}`);
      }
      setIsBedModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Bed Save Failed', err.response?.data?.message || err.message);
    }
  };

  // --- LABORATORY SERVICE MASTER CRUD ---
  const handleSaveLabService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/services/${editingItem.id}`, { ...labServiceForm, category: 'LABORATORY' });
        showToast('success', 'Lab Master Test Updated', `Updated ${labServiceForm.name}`);
      } else {
        await api.post('/services', { ...labServiceForm, category: 'LABORATORY' });
        showToast('success', 'Lab Master Test Created', `Added ${labServiceForm.name} to Laboratory Master Catalog.`);
      }
      setIsLabServiceModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Lab Test Save Failed', err.response?.data?.message || err.message);
    }
  };

  // --- RADIOLOGY SERVICE MASTER CRUD ---
  const handleSaveRadService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/services/${editingItem.id}`, { ...radServiceForm, category: 'RADIOLOGY' });
        showToast('success', 'Radiology Master Procedure Updated', `Updated ${radServiceForm.name}`);
      } else {
        await api.post('/services', { ...radServiceForm, category: 'RADIOLOGY' });
        showToast('success', 'Radiology Procedure Created', `Added ${radServiceForm.name} to Radiology Master Catalog.`);
      }
      setIsRadServiceModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Radiology Procedure Save Failed', err.response?.data?.message || err.message);
    }
  };

  // --- GENERAL SERVICES & PRICE LIST CRUD ---
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/services/${editingItem.id}`, serviceForm);
        showToast('success', 'Service Price List Updated', `Updated ${serviceForm.name}`);
      } else {
        await api.post('/services', serviceForm);
        showToast('success', 'Service Item Created', `Added ${serviceForm.name} to Price List.`);
      }
      setIsServiceModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Service Save Failed', err.response?.data?.message || err.message);
    }
  };

  // --- PHARMACY DRUG FORMULARY CRUD ---
  const handleSaveDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/pharmacy/drugs/${editingItem.id}`, drugForm);
        showToast('success', 'Drug Master Updated', `Updated ${drugForm.name}`);
      } else {
        await api.post('/pharmacy/drugs', drugForm);
        showToast('success', 'Drug Master Created', `Added ${drugForm.name} to Pharmacy Formulary.`);
      }
      setIsDrugModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Drug Save Failed', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteItem = async (type: string, id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete '${name}' from Master Data?`)) return;
    try {
      if (type === 'hmo') await api.delete(`/insurance/providers/${id}`);
      if (type === 'bed') await api.delete(`/ipd/beds/${id}`);
      if (type === 'service') await api.delete(`/services/${id}`);
      if (type === 'drug') await api.delete(`/pharmacy/drugs/${id}`);
      showToast('success', 'Master Item Deleted', `Removed ${name} from system master records.`);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.response?.data?.message || err.message);
    }
  };

  // Filtering for Lab Services, Rad Services & Central Price List
  const labServicesList = services.filter((s) => s.category === 'LABORATORY' && (
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.department && s.department.toLowerCase().includes(searchTerm.toLowerCase()))
  ));

  const radServicesList = services.filter((s) => s.category === 'RADIOLOGY' && (
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.modality && s.modality.toLowerCase().includes(searchTerm.toLowerCase()))
  ));

  const masterPriceList = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? s.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Hospital Master Data & Services Catalog
            </h1>
            <p className="text-xs text-slate-400">
              Centralized catalog management for Laboratory Tests, Radiology Procedures, Pharmacy Formulary, Ward Beds, and Price Lists.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'lab_services' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setLabServiceForm({
                  code: `LAB-TEST-0${services.filter((s) => s.category === 'LABORATORY').length + 1}`,
                  name: '',
                  category: 'LABORATORY',
                  department: 'Hematology',
                  specimenType: 'Whole Blood (EDTA)',
                  referenceRange: '',
                  price: 45.0,
                  currency: currencyCode || 'USD',
                });
                setIsLabServiceModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-950 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Laboratory Test Master
            </button>
          )}

          {activeTab === 'radiology_services' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setRadServiceForm({
                  code: `RAD-PROC-0${services.filter((s) => s.category === 'RADIOLOGY').length + 1}`,
                  name: '',
                  category: 'RADIOLOGY',
                  department: 'Diagnostic Radiology',
                  modality: 'X-RAY',
                  bodyRegion: 'Chest',
                  prepInstructions: '',
                  price: 85.0,
                  currency: currencyCode || 'USD',
                });
                setIsRadServiceModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-950 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Radiology Procedure Master
            </button>
          )}

          {activeTab === 'pricelist' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setServiceForm({
                  code: `SRV-GEN-0${services.length + 1}`,
                  name: '',
                  category: 'CONSULTATION',
                  department: 'General OPD',
                  price: 50.0,
                  currency: currencyCode || 'USD',
                });
                setIsServiceModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Price List Item
            </button>
          )}

          {activeTab === 'hmo' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setHmoForm({ code: `HMO-${hmoProviders.length + 1}`, name: '', planType: 'Comprehensive Corporate', contactEmail: '', contactPhone: '' });
                setIsHmoModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-950 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add HMO Provider
            </button>
          )}

          {activeTab === 'beds' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setBedForm({ bedNumber: `BED-${beds.length + 101}`, wardName: 'General Male Ward', bedClass: 'GENERAL', pricePerNight: 80.0 });
                setIsBedModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-950 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Ward Bed
            </button>
          )}

          {activeTab === 'drugs' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setDrugForm({ code: `MED-${drugs.length + 1}`, name: '', category: 'Antibiotics', unitPrice: 12.5, quantityInStock: 100, reorderLevel: 20, unit: 'Tablets' });
                setIsDrugModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Drug Formulary
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('lab_services')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'lab_services'
              ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <TestTube className="w-4 h-4" />
          Laboratory Catalog ({services.filter((s) => s.category === 'LABORATORY').length})
        </button>

        <button
          onClick={() => setActiveTab('radiology_services')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'radiology_services'
              ? 'bg-purple-950 text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Film className="w-4 h-4" />
          Radiology Catalog ({services.filter((s) => s.category === 'RADIOLOGY').length})
        </button>

        <button
          onClick={() => setActiveTab('pricelist')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'pricelist'
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ReceiptText className="w-4 h-4" />
          Universal Price List ({services.length})
        </button>

        <button
          onClick={() => setActiveTab('hmo')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'hmo'
              ? 'bg-blue-950 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          HMO Insurance ({hmoProviders.length})
        </button>

        <button
          onClick={() => setActiveTab('beds')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'beds'
              ? 'bg-amber-950 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Bed className="w-4 h-4" />
          IPD Beds ({beds.length})
        </button>

        <button
          onClick={() => setActiveTab('drugs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'drugs'
              ? 'bg-rose-950 text-rose-400 border border-rose-500/30 shadow-lg shadow-rose-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Pill className="w-4 h-4" />
          Pharmacy Formulary ({drugs.length})
        </button>
      </div>

      {/* Search & Filter Bar for Master Catalogs */}
      {(activeTab === 'lab_services' || activeTab === 'radiology_services' || activeTab === 'pricelist') && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search catalog code, test name, modality, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {activeTab === 'pricelist' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400">Category Filter:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value="">All Categories</option>
                <option value="CONSULTATION">Consultations</option>
                <option value="LABORATORY">Laboratory Tests</option>
                <option value="RADIOLOGY">Radiology Imaging</option>
                <option value="SURGERY">Surgical Operations</option>
                <option value="NURSING">Nursing Care</option>
                <option value="OTHER">Other Services</option>
              </select>
            </div>
          )}

          <ExportOptions data={activeTab === 'lab_services' ? labServicesList : activeTab === 'radiology_services' ? radServicesList : masterPriceList} filename={`${activeTab}_master_catalog`} />
        </div>
      )}

      {/* TAB 1: 🧪 LABORATORY SERVICES MASTER CATALOG */}
      {activeTab === 'lab_services' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <TestTube className="w-5 h-5 text-cyan-400" /> Laboratory Tests & Diagnostics Master Catalog
              </h3>
              <p className="text-xs text-slate-400">Configure lab test codes, specimen requirements, clinical reference ranges, and test fees.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono tracking-wider">
                  <th className="py-3 px-4">Test Code</th>
                  <th className="py-3 px-4">Laboratory Test Name</th>
                  <th className="py-3 px-4">Sub-Department</th>
                  <th className="py-3 px-4">Specimen Type</th>
                  <th className="py-3 px-4">Clinical Reference Ranges</th>
                  <th className="py-3 px-4">Standard Test Fee</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {labServicesList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{item.code}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{item.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold">
                        {item.department || 'Laboratory'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">{item.specimenType || 'Venous Blood'}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono max-w-xs truncate">{item.referenceRange || 'Standard Range'}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setLabServiceForm({
                              code: item.code,
                              name: item.name,
                              category: 'LABORATORY',
                              department: item.department || 'Hematology',
                              specimenType: item.specimenType || 'Whole Blood (EDTA)',
                              referenceRange: item.referenceRange || '',
                              price: item.price,
                              currency: item.currency || currencyCode || 'USD',
                            });
                            setIsLabServiceModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          title="Edit Master Test"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('service', item.id, item.name)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors"
                          title="Delete Master Test"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ☢️ RADIOLOGY SERVICES MASTER CATALOG */}
      {activeTab === 'radiology_services' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Film className="w-5 h-5 text-purple-400" /> Radiology & Imaging Procedures Master Catalog
              </h3>
              <p className="text-xs text-slate-400">Manage imaging procedure codes, modalities (X-Ray, Ultrasound, CT, MRI), body regions, patient preparation, and study fees.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono tracking-wider">
                  <th className="py-3 px-4">Procedure Code</th>
                  <th className="py-3 px-4">Radiology Procedure Name</th>
                  <th className="py-3 px-4">Modality</th>
                  <th className="py-3 px-4">Target Body Region</th>
                  <th className="py-3 px-4">Patient Preparation Notes</th>
                  <th className="py-3 px-4">Procedure Fee</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {radServicesList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-400">{item.code}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{item.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-purple-950 text-purple-400 border border-purple-500/30 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold">
                        {item.modality || 'X-RAY'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">{item.bodyRegion || 'Chest'}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono max-w-xs truncate">{item.prepInstructions || 'Standard procedure'}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setRadServiceForm({
                              code: item.code,
                              name: item.name,
                              category: 'RADIOLOGY',
                              department: item.department || 'Diagnostic Radiology',
                              modality: item.modality || 'X-RAY',
                              bodyRegion: item.bodyRegion || 'Chest',
                              prepInstructions: item.prepInstructions || '',
                              price: item.price,
                              currency: item.currency || currencyCode || 'USD',
                            });
                            setIsRadServiceModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          title="Edit Procedure"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('service', item.id, item.name)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors"
                          title="Delete Procedure"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: 📋 UNIVERSAL MASTER PRICE LIST */}
      {activeTab === 'pricelist' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-emerald-400" /> Universal Hospital Services Master Price List
              </h3>
              <p className="text-xs text-slate-400">Centralized fee matrix for Consultations, Laboratory Tests, Radiology Procedures, Surgeries, and Nursing Care.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono tracking-wider">
                  <th className="py-3 px-4">Item Code</th>
                  <th className="py-3 px-4">Service Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {masterPriceList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{item.code}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{item.name}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        item.category === 'LABORATORY'
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          : item.category === 'RADIOLOGY'
                          ? 'bg-purple-950 text-purple-400 border border-purple-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">{item.department || 'General'}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${item.isActive !== false ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                        {item.isActive !== false ? '● ACTIVE' : '○ INACTIVE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setServiceForm({
                              code: item.code,
                              name: item.name,
                              category: item.category || 'CONSULTATION',
                              department: item.department || 'General OPD',
                              price: item.price,
                              currency: item.currency || currencyCode || 'USD',
                            });
                            setIsServiceModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('service', item.id, item.name)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: 🛡️ HMO INSURANCE PROVIDERS */}
      {activeTab === 'hmo' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" /> HMO Insurance Providers & Coverage Schemes
              </h3>
              <p className="text-xs text-slate-400">Maintain corporate HMO insurance contracts, provider codes, and policy plans.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono tracking-wider">
                  <th className="py-3 px-4">Provider Code</th>
                  <th className="py-3 px-4">HMO Company Name</th>
                  <th className="py-3 px-4">Coverage Plan Type</th>
                  <th className="py-3 px-4">Contact Email</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {hmoProviders.map((hmo) => (
                  <tr key={hmo.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{hmo.code}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{hmo.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{hmo.planType || 'Corporate'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{hmo.contactEmail || 'N/A'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{hmo.contactPhone || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingItem(hmo);
                            setHmoForm({ code: hmo.code, name: hmo.name, planType: hmo.planType || '', contactEmail: hmo.contactEmail || '', contactPhone: hmo.contactPhone || '' });
                            setIsHmoModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('hmo', hmo.id, hmo.name)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: 🛏️ IPD WARD BEDS & RATES */}
      {activeTab === 'beds' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Bed className="w-5 h-5 text-amber-400" /> Inpatient Ward Beds & Daily Rate Master
              </h3>
              <p className="text-xs text-slate-400">Configure bed numbers, ward classifications (VIP, General, ICU), and nightly rates.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono tracking-wider">
                  <th className="py-3 px-4">Bed #</th>
                  <th className="py-3 px-4">Ward Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Price / Night</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {beds.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{b.bedNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{b.wardName}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{b.bedClass}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{formatCurrency(b.pricePerNight)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingItem(b);
                            setBedForm({ bedNumber: b.bedNumber, wardName: b.wardName, bedClass: b.bedClass, pricePerNight: b.pricePerNight });
                            setIsBedModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('bed', b.id, b.bedNumber)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: 💊 PHARMACY DRUG FORMULARY */}
      {activeTab === 'drugs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Pill className="w-5 h-5 text-rose-400" /> Pharmacy Drug Formulary & Prices
              </h3>
              <p className="text-xs text-slate-400">Manage pharmaceutical inventory, unit prices, reorder thresholds, and drug stock master.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono tracking-wider">
                  <th className="py-3 px-4">Drug Code</th>
                  <th className="py-3 px-4">Medication Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Stock Qty</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {drugs.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-400">{d.code}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{d.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{d.category}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-200">{d.quantityInStock} {d.unit}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{formatCurrency(d.unitPrice)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingItem(d);
                            setDrugForm({ code: d.code, name: d.name, category: d.category, unitPrice: d.unitPrice, quantityInStock: d.quantityInStock, reorderLevel: d.reorderLevel, unit: d.unit });
                            setIsDrugModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('drug', d.id, d.name)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: LAB SERVICE MASTER MODAL */}
      {isLabServiceModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <TestTube className="w-5 h-5 text-cyan-400" />
                {editingItem ? 'Edit Laboratory Master Test' : 'Create Laboratory Master Test'}
              </h3>
              <button onClick={() => setIsLabServiceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLabService} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Test Code</label>
                  <input
                    type="text"
                    required
                    value={labServiceForm.code}
                    onChange={(e) => setLabServiceForm({ ...labServiceForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Sub-Department</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hematology, Biochemistry"
                    value={labServiceForm.department}
                    onChange={(e) => setLabServiceForm({ ...labServiceForm, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Laboratory Test Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC Panel)"
                  value={labServiceForm.name}
                  onChange={(e) => setLabServiceForm({ ...labServiceForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Specimen Type</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Whole Blood (EDTA)"
                    value={labServiceForm.specimenType}
                    onChange={(e) => setLabServiceForm({ ...labServiceForm, specimenType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Test Fee / Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={labServiceForm.price}
                    onChange={(e) => setLabServiceForm({ ...labServiceForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Clinical Reference Ranges</label>
                <textarea
                  rows={2}
                  placeholder="e.g. WBC: 4.5-11.0 x10^9/L, Hb: 12.0-17.5 g/dL"
                  value={labServiceForm.referenceRange}
                  onChange={(e) => setLabServiceForm({ ...labServiceForm, referenceRange: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLabServiceModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-950"
                >
                  {editingItem ? 'Save Changes' : 'Add Lab Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RADIOLOGY SERVICE MASTER MODAL */}
      {isRadServiceModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Film className="w-5 h-5 text-purple-400" />
                {editingItem ? 'Edit Radiology Master Procedure' : 'Create Radiology Master Procedure'}
              </h3>
              <button onClick={() => setIsRadServiceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRadService} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Procedure Code</label>
                  <input
                    type="text"
                    required
                    value={radServiceForm.code}
                    onChange={(e) => setRadServiceForm({ ...radServiceForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Modality</label>
                  <select
                    value={radServiceForm.modality}
                    onChange={(e) => setRadServiceForm({ ...radServiceForm, modality: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="X-RAY">X-Ray Digital</option>
                    <option value="ULTRASOUND">Ultrasound Scan</option>
                    <option value="CT_SCAN">CT Scan</option>
                    <option value="MRI">MRI Scan</option>
                    <option value="MAMMOGRAPHY">Mammography</option>
                    <option value="ECHOCARDIOGRAM">Echocardiogram</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Procedure Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chest X-Ray Digital View (PA)"
                  value={radServiceForm.name}
                  onChange={(e) => setRadServiceForm({ ...radServiceForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Target Body Region</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chest, Abdomen, Brain"
                    value={radServiceForm.bodyRegion}
                    onChange={(e) => setRadServiceForm({ ...radServiceForm, bodyRegion: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Procedure Fee</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={radServiceForm.price}
                    onChange={(e) => setRadServiceForm({ ...radServiceForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Patient Preparation Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fasting 6-8 hours, remove all metallic objects"
                  value={radServiceForm.prepInstructions}
                  onChange={(e) => setRadServiceForm({ ...radServiceForm, prepInstructions: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRadServiceModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-950"
                >
                  {editingItem ? 'Save Changes' : 'Add Procedure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CENTRAL PRICE LIST ITEM MODAL */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">
                {editingItem ? 'Edit Price List Item' : 'Add Price List Item'}
              </h3>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Item Code</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.code}
                    onChange={(e) => setServiceForm({ ...serviceForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="CONSULTATION">Consultation</option>
                    <option value="LABORATORY">Laboratory Test</option>
                    <option value="RADIOLOGY">Radiology Imaging</option>
                    <option value="SURGERY">Surgical Operation</option>
                    <option value="NURSING">Nursing Care</option>
                    <option value="OTHER">Other Service</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Service Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. General Doctor Consultation"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Unit Price / Fee</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950"
                >
                  {editingItem ? 'Save Price' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
