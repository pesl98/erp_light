import React, { useState } from 'react';
import { Product, Supplier, PurchaseOrder, PurchaseRequisition, POStatus, PRStatus } from '../types';
import { ShoppingCart, CheckCircle, Clock, FileText, BrainCircuit, Loader2, ClipboardList, ArrowRight, X } from 'lucide-react';
import { analyzeStockAndSuggestPR } from '../services/geminiService';

interface PurchasingProps {
  products: Product[];
  suppliers: Supplier[];
  orders: PurchaseOrder[];
  requisitions: PurchaseRequisition[];
  onAddRequisitions: (reqs: PurchaseRequisition[]) => void;
  onConvertPR: (prId: string, supplierId: string) => void;
  onUpdatePOStatus: (id: string, status: POStatus) => void;
}

const Purchasing: React.FC<PurchasingProps> = ({ 
    products, 
    suppliers, 
    orders, 
    requisitions, 
    onAddRequisitions, 
    onConvertPR, 
    onUpdatePOStatus 
}) => {
  const [activeTab, setActiveTab] = useState<'REQUISITIONS' | 'ORDERS'>('REQUISITIONS');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);
  
  // Conversion Modal State
  const [convertingPR, setConvertingPR] = useState<PurchaseRequisition | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  const handleAIAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisSummary(null);
    setActiveTab('REQUISITIONS');
    
    const activeProducts = products.filter(p => p.status !== 'INACTIVE');
    
    try {
      const result = await analyzeStockAndSuggestPR(activeProducts, suppliers);
      setAnalysisSummary(result.summary);
      if (result.requisitions.length > 0) {
        onAddRequisitions(result.requisitions);
      }
    } catch (error) {
      console.error(error);
      setAnalysisSummary("Failed to generate analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  const openConvertModal = (pr: PurchaseRequisition) => {
      setConvertingPR(pr);
      // Default to suggested supplier if it exists and is valid, otherwise first supplier
      const defaultSup = suppliers.find(s => s.id === pr.suggestedSupplierId)?.id || suppliers[0]?.id || '';
      setSelectedSupplierId(defaultSup);
  };

  const handleConfirmConversion = () => {
      if (convertingPR && selectedSupplierId) {
          onConvertPR(convertingPR.id, selectedSupplierId);
          setConvertingPR(null);
          setActiveTab('ORDERS'); // Switch to orders tab to see result
      }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case POStatus.DRAFT:
      case PRStatus.PENDING:
        return <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium uppercase">Pending/Draft</span>;
      case POStatus.ORDERED:
        return <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-medium uppercase">Ordered</span>;
      case POStatus.RECEIVED:
      case PRStatus.CONVERTED:
        return <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded text-xs font-medium uppercase">Done</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium uppercase">{status}</span>;
    }
  };

  const activeRequisitions = requisitions.filter(req => req.status === PRStatus.PENDING);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchasing</h1>
          <p className="text-slate-500">Manage requisitions and purchase orders.</p>
        </div>
        <button 
            onClick={handleAIAnalysis}
            disabled={analyzing || products.length === 0}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {analyzing ? <Loader2 className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
            <span className="font-semibold">{analyzing ? 'Analyzing Inventory...' : 'AI Smart Replenish'}</span>
        </button>
      </div>

      {/* AI Analysis Result Panel */}
      {analysisSummary && (
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start space-x-3 animate-fade-in">
            <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 mt-1">
                <BrainCircuit size={18} />
            </div>
            <div>
                <h3 className="font-semibold text-indigo-900 text-sm mb-1">AI Insight</h3>
                <p className="text-indigo-800 text-sm leading-relaxed">{analysisSummary}</p>
            </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
          <div className="flex space-x-8">
              <button 
                onClick={() => setActiveTab('REQUISITIONS')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'REQUISITIONS' 
                    ? 'border-primary-600 text-primary-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                  Requisitions ({activeRequisitions.length})
              </button>
              <button 
                onClick={() => setActiveTab('ORDERS')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'ORDERS' 
                    ? 'border-primary-600 text-primary-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                  Purchase Orders ({orders.length})
              </button>
          </div>
      </div>

      {/* Content Area */}
      <div className="animate-fade-in">
        {activeTab === 'REQUISITIONS' && (
            <div className="grid grid-cols-1 gap-6">
                {activeRequisitions.length === 0 ? (
                    <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                        <ClipboardList className="mx-auto text-slate-300 mb-4" size={48} />
                        <h3 className="text-lg font-medium text-slate-900">No Pending Requisitions</h3>
                        <p className="text-slate-500 mb-6">Run AI Analysis to generate replenishment requests.</p>
                    </div>
                ) : (
                    activeRequisitions.map(req => {
                        const suggestedSupplier = suppliers.find(s => s.id === req.suggestedSupplierId);
                        const itemCount = req.items.reduce((acc, i) => acc + i.quantity, 0);
                        const totalEst = req.items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);

                        return (
                            <div key={req.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex items-center space-x-3 mb-1">
                                        <span className="font-bold text-slate-900">{req.reqNumber}</span>
                                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-medium">Pending Approval</span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-2">
                                        {req.reason}
                                    </p>
                                    <div className="flex items-center text-xs text-slate-500 space-x-4">
                                        <span>{new Date(req.dateCreated).toLocaleDateString()}</span>
                                        <span>{itemCount} Items</span>
                                        <span>Est. ${totalEst.toLocaleString()}</span>
                                        {suggestedSupplier && <span>Sugg: {suggestedSupplier.name}</span>}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => openConvertModal(req)}
                                    className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                                >
                                    <span>Create PO</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        )}

        {activeTab === 'ORDERS' && (
            <div className="grid grid-cols-1 gap-6">
             {orders.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                   <ShoppingCart className="mx-auto text-slate-300 mb-4" size={48} />
                   <h3 className="text-lg font-medium text-slate-900">No Purchase Orders Yet</h3>
                </div>
             ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {orders.slice().reverse().map((po) => {
                      const supplier = suppliers.find(s => s.id === po.supplierId);
                      const itemCount = po.items.reduce((acc, item) => acc + item.quantity, 0);
                      
                      return (
                        <div key={po.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center space-x-4">
                            <div className="bg-slate-100 p-3 rounded-lg text-slate-500">
                              <FileText size={24} />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                  <span className="font-bold text-slate-900">{po.orderNumber}</span>
                                  {getStatusBadge(po.status)}
                              </div>
                              <p className="text-sm text-slate-500 mt-1">
                                 {supplier?.name || 'Unknown Vendor'} • {itemCount} items • <span className="font-medium text-slate-700">${po.totalAmount.toLocaleString()}</span>
                              </p>
                            </div>
                          </div>
     
                          <div className="flex items-center space-x-3">
                             {po.status === POStatus.DRAFT && (
                                 <button 
                                     onClick={() => onUpdatePOStatus(po.id, POStatus.ORDERED)}
                                     className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                 >
                                     Submit Order
                                 </button>
                             )}
                             {po.status === POStatus.ORDERED && (
                                 <button 
                                     onClick={() => onUpdatePOStatus(po.id, POStatus.RECEIVED)}
                                     className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center space-x-2"
                                 >
                                     <CheckCircle size={16} />
                                     <span>Receive Goods</span>
                                 </button>
                             )}
                             {po.status === POStatus.RECEIVED && (
                                  <span className="text-emerald-600 flex items-center space-x-1 text-sm font-medium">
                                     <CheckCircle size={16} />
                                     <span>Completed</span>
                                  </span>
                             )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
             )}
           </div>
        )}
      </div>

      {/* Convert to PO Modal */}
      {convertingPR && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-fade-in">
                 <div className="flex justify-between items-center p-6 border-b border-slate-100">
                      <h3 className="text-lg font-bold text-slate-900">Convert to Purchase Order</h3>
                      <button onClick={() => setConvertingPR(null)} className="text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                 </div>
                 <div className="p-6 space-y-4">
                     <p className="text-sm text-slate-600">
                         You are converting requisition <b>{convertingPR.reqNumber}</b> into an official Purchase Order.
                     </p>
                     
                     <div>
                         <label className="block text-sm font-medium text-slate-700 mb-2">Select Supplier</label>
                         <select 
                            className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-primary-500 outline-none"
                            value={selectedSupplierId}
                            onChange={(e) => setSelectedSupplierId(e.target.value)}
                         >
                             <option value="" disabled>Choose a supplier...</option>
                             {suppliers.map(s => (
                                 <option key={s.id} value={s.id}>{s.name}</option>
                             ))}
                         </select>
                     </div>

                     <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                         <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Items included</h4>
                         <ul className="space-y-2">
                             {convertingPR.items.map(item => {
                                 const prod = products.find(p => p.id === item.productId);
                                 return (
                                     <li key={item.productId} className="text-sm flex justify-between">
                                         <span>{prod?.name || 'Unknown Item'}</span>
                                         <span className="font-mono">x{item.quantity}</span>
                                     </li>
                                 )
                             })}
                         </ul>
                     </div>
                 </div>
                 <div className="p-6 border-t border-slate-100 flex justify-end space-x-3">
                      <button onClick={() => setConvertingPR(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                      <button 
                        onClick={handleConfirmConversion}
                        disabled={!selectedSupplierId}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          Confirm Order
                      </button>
                 </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default Purchasing;