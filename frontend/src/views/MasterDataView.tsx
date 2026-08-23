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
  Tag,
  Layers3,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { ExportOptions } from '../components/common/ExportOptions';

export const MasterDataView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pricelist' | 'hmo' | 'beds' | 'drugs'>('pricelist');

  // Data Collections (Single Source of Truth)
  const [services, setServices] = useState<any[]>([]);
  const [hmoProviders, setHmoProviders] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [drugs, setDrugs] = useState<any[]>([]);

  // Search & Category Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');

  // Selected Item for Editing
  const [editingItem, setEditingItem] = useState<any>(null);

  // Modals Visibility
  const [isUniversalPriceModalOpen, setIsUniversalPriceModalOpen] = useState(false);
  const [isHmoModalOpen, setIsHmoModalOpen] = useState(false);
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [isDrugModalOpen, setIsDrugModalOpen] = useState(false);

  // Universal Master Price List Form (Supports all Category Master Data)
  const [priceItemForm, setPriceItemForm] = useState({
    code: 'SRV-001',
    name: '',
    category: 'CONSULTATION',
    department: 'General OPD',
    specimenType: 'Whole Blood (EDTA)',
    referenceRange: '',
    modality: 'X-RAY',
    bodyRegion: 'Chest',
    prepInstructions: '',
    price: 50.0,
    currency: 'USD',
    isActive: true,
  });

  // HMO Form
  const [hmoForm, setHmoForm] = useState({
    code: '',
    name: '',
    planType: 'Comprehensive Corporate',
    contactEmail: '',
    contactPhone: '',
  });

  // Bed Form
  const [bedForm, setBedForm] = useState({
    bedNumber: '',
    wardName: 'General Male Ward',
    bedClass: 'GENERAL',
    pricePerNight: 80.0,
  });

  // Drug Form
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
      const [sRes, hRes, bRes, dRes] = await Promise.all([
        api.get('/services'),
        api.get('/insurance/providers'),
        api.get('/ipd/beds'),
        api.get('/pharmacy/drugs'),
      ]);
      setServices(sRes.data);
      setHmoProviders(hRes.data);
      setBeds(bRes.data);
      setDrugs(dRes.data);
    } catch (err: any) {
      showToast('error', 'Error Loading Universal Price List Master Data', err.message);
    }
  };

  // --- UNIVERSAL MASTER PRICE LIST & SERVICE CATALOG CRUD ---
  const handleSaveUniversalPriceItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/services/${editingItem.id}`, priceItemForm);
        showToast('success', 'Universal Price List Updated', `Updated price & master data for '${priceItemForm.name}'.`);
      } else {
        await api.post('/services', priceItemForm);
        showToast('success', 'Master Price Item Added', `Added '${priceItemForm.name}' to Universal Price List.`);
      }
      setIsUniversalPriceModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Price Item Save Failed', err.response?.data?.message || err.message);
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
    if (!confirm(`Are you sure you want to delete '${name}' from Universal Master Data?`)) return;
    try {
      if (type === 'service') await api.delete(`/services/${id}`);
      if (type === 'hmo') await api.delete(`/insurance/providers/${id}`);
      if (type === 'bed') await api.delete(`/ipd/beds/${id}`);
      if (type === 'drug') await api.delete(`/pharmacy/drugs/${id}`);
      showToast('success', 'Master Item Deleted', `Removed ${name} from system master records.`);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.response?.data?.message || err.message);
    }
  };

  // Filtered Services List (Single Source of Truth for Pricing & Master Catalogs)
  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.department && s.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategoryFilter ? s.category === selectedCategoryFilter : true;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
            <ReceiptText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Universal Master Data & Price List
            </h1>
            <p className="text-xs text-slate-400">
              Unified master data catalog for consultations, laboratory tests, radiology procedures, surgeries, beds, and pharmacy items.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'pricelist' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setPriceItemForm({
                  code: `SRV-00${services.length + 1}`,
                  name: '',
                  category: selectedCategoryFilter || 'CONSULTATION',
                  department: 'General OPD',
                  specimenType: 'Whole Blood (EDTA)',
                  referenceRange: '',
                  modality: 'X-RAY',
                  bodyRegion: 'Chest',
                  prepInstructions: '',
                  price: 50.0,
                  currency: currencyCode || 'USD',
                  isActive: true,
                });
                setIsUniversalPriceModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Item to Universal Price List
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

      {/* Streamlined Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2">
        <button
          onClick={() => {
            setActiveTab('pricelist');
            setSelectedCategoryFilter('');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'pricelist'
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ReceiptText className="w-4 h-4" />
          Universal Master Data & Price List ({services.length})
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
          HMO Insurance Providers ({hmoProviders.length})
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

      {/* Search & Category Filter Header for Universal Price List */}
      {activeTab === 'pricelist' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search code, service name, modality, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-mono">Category Filter:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
            >
              <option value="">All Master Categories</option>
              <option value="CONSULTATION">Consultations</option>
              <option value="LABORATORY">Laboratory Tests</option>
              <option value="RADIOLOGY">Radiology Imaging</option>
              <option value="SURGERY">Surgical Operations</option>
              <option value="NURSING">Nursing Care</option>
              <option value="OTHER">Other Services</option>
            </select>
          </div>

          <ExportOptions data={filteredServices} filename="universal_master_price_list" />
        </div>
      )}

      {/* UNIVERSAL MASTER PRICE LIST TABLE */}
      {activeTab === 'pricelist' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-emerald-400" />
                Universal Hospital Master Price List (Single Source of Truth)
              </h3>
              <p className="text-xs text-slate-400">
                All prices are centrally managed here and automatically derived across LIS, RIS/PACS, EMR Order Entry, and Patient Billing.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono tracking-wider">
                  <th className="py-3 px-4">Item Code</th>
                  <th className="py-3 px-4">Service Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Department / Sub-Type</th>
                  <th className="py-3 px-4">Specific Master Attributes</th>
                  <th className="py-3 px-4">Master Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredServices.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{item.code}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{item.name}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          item.category === 'LABORATORY'
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                            : item.category === 'RADIOLOGY'
                            ? 'bg-purple-950 text-purple-400 border border-purple-800'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">{item.department || 'General'}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {item.category === 'LABORATORY' && (
                        <span>Specimen: <strong className="text-slate-200">{item.specimenType || 'Blood'}</strong> | Ref: {item.referenceRange || 'Standard'}</span>
                      )}
                      {item.category === 'RADIOLOGY' && (
                        <span>Modality: <strong className="text-purple-300">{item.modality || 'X-Ray'}</strong> | Region: {item.bodyRegion || 'Chest'}</span>
                      )}
                      {item.category !== 'LABORATORY' && item.category !== 'RADIOLOGY' && (
                        <span>{item.prepInstructions || 'Standard Care Service'}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setPriceItemForm({
                              code: item.code,
                              name: item.name,
                              category: item.category || 'CONSULTATION',
                              department: item.department || 'General OPD',
                              specimenType: item.specimenType || 'Whole Blood (EDTA)',
                              referenceRange: item.referenceRange || '',
                              modality: item.modality || 'X-RAY',
                              bodyRegion: item.bodyRegion || 'Chest',
                              prepInstructions: item.prepInstructions || '',
                              price: item.price,
                              currency: item.currency || currencyCode || 'USD',
                              isActive: item.isActive !== false,
                            });
                            setIsUniversalPriceModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          title="Edit Universal Master Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('service', item.id, item.name)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors"
                          title="Delete Master Item"
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

      {/* OTHER TABS: HMO, BEDS, DRUGS */}
      {activeTab === 'hmo' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" /> HMO Insurance Providers & Coverage Schemes
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono tracking-wider">
                  <th className="py-3 px-4">Provider Code</th>
                  <th className="py-3 px-4">HMO Company Name</th>
                  <th className="py-3 px-4">Coverage Plan Type</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {hmoProviders.map((hmo) => (
                  <tr key={hmo.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{hmo.code}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{hmo.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{hmo.planType || 'Corporate'}</td>
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
                        <button onClick={() => handleDeleteItem('hmo', hmo.id, hmo.name)} className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors">
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

      {activeTab === 'beds' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Bed className="w-5 h-5 text-amber-400" /> Inpatient Ward Beds & Daily Rate Master
            </h3>
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
                        <button onClick={() => handleDeleteItem('bed', b.id, b.bedNumber)} className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors">
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

      {activeTab === 'drugs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Pill className="w-5 h-5 text-rose-400" /> Pharmacy Drug Formulary & Prices
            </h3>
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
                        <button onClick={() => handleDeleteItem('drug', d.id, d.name)} className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors">
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

      {/* UNIVERSAL MASTER PRICE LIST ITEM MODAL (DYNAMIC CATEGORY MASTER FIELDS) */}
      {isUniversalPriceModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-emerald-400" />
                {editingItem ? 'Edit Universal Master Price Item' : 'Add Item to Universal Price List'}
              </h3>
              <button onClick={() => setIsUniversalPriceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUniversalPriceItem} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Select Category</label>
                  <select
                    value={priceItemForm.category}
                    onChange={(e) => setPriceItemForm({ ...priceItemForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="CONSULTATION">Consultation</option>
                    <option value="LABORATORY">Laboratory Test</option>
                    <option value="RADIOLOGY">Radiology Imaging</option>
                    <option value="SURGERY">Surgical Operation</option>
                    <option value="NURSING">Nursing Care</option>
                    <option value="OTHER">Other Hospital Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Item Code</label>
                  <input
                    type="text"
                    required
                    value={priceItemForm.code}
                    onChange={(e) => setPriceItemForm({ ...priceItemForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Service Description / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC Panel) or Chest X-Ray Digital"
                  value={priceItemForm.name}
                  onChange={(e) => setPriceItemForm({ ...priceItemForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Department / Specialty</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hematology, Diagnostic Radiology, OPD"
                    value={priceItemForm.department}
                    onChange={(e) => setPriceItemForm({ ...priceItemForm, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Master Price / Fee</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={priceItemForm.price}
                    onChange={(e) => setPriceItemForm({ ...priceItemForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>

              {/* DYNAMIC CATEGORY MASTER FIELDS */}
              {priceItemForm.category === 'LABORATORY' && (
                <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <TestTube className="w-4 h-4" /> Laboratory Master Data Details:
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">Specimen Type</label>
                      <input
                        type="text"
                        placeholder="e.g. Whole Blood (EDTA), Serum, Urine"
                        value={priceItemForm.specimenType}
                        onChange={(e) => setPriceItemForm({ ...priceItemForm, specimenType: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">Clinical Reference Ranges</label>
                      <input
                        type="text"
                        placeholder="e.g. WBC: 4.5-11.0 x10^9/L, Hb: 12-17.5"
                        value={priceItemForm.referenceRange}
                        onChange={(e) => setPriceItemForm({ ...priceItemForm, referenceRange: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {priceItemForm.category === 'RADIOLOGY' && (
                <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                    <Film className="w-4 h-4" /> Radiology Master Data Details:
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">Imaging Modality</label>
                      <select
                        value={priceItemForm.modality}
                        onChange={(e) => setPriceItemForm({ ...priceItemForm, modality: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                      >
                        <option value="X-RAY">X-Ray Digital</option>
                        <option value="ULTRASOUND">Ultrasound Scan</option>
                        <option value="CT_SCAN">CT Scan</option>
                        <option value="MRI">MRI Scan</option>
                        <option value="MAMMOGRAPHY">Mammography</option>
                        <option value="ECHOCARDIOGRAM">Echocardiogram</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">Target Body Region</label>
                      <input
                        type="text"
                        placeholder="e.g. Chest, Abdomen, Brain, Spine"
                        value={priceItemForm.bodyRegion}
                        onChange={(e) => setPriceItemForm({ ...priceItemForm, bodyRegion: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Patient Preparation Instructions</label>
                    <input
                      type="text"
                      placeholder="e.g. Fasting 6-8 hours, full bladder required"
                      value={priceItemForm.prepInstructions}
                      onChange={(e) => setPriceItemForm({ ...priceItemForm, prepInstructions: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUniversalPriceModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950"
                >
                  {editingItem ? 'Save Master Price & Data' : 'Add to Universal Price List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
