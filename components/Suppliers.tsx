import React, { useState } from 'react';
import { Supplier } from '../types';
import { Search, Plus, Edit2, Trash2, X, Save, Building2, Mail, Clock } from 'lucide-react';

interface SuppliersProps {
  suppliers: Supplier[];
  onAddSupplier: (s: Supplier) => void;
  onUpdateSupplier: (s: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
}

const Suppliers: React.FC<SuppliersProps> = ({ suppliers, onAddSupplier, onUpdateSupplier, onDeleteSupplier }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({
      name: '',
      contactEmail: '',
      leadTimeDays: 7
  });

  const handleOpenModal = (supplier?: Supplier) => {
      if (supplier) {
          setEditingSupplier(supplier);
          setFormData(supplier);
      } else {
          setEditingSupplier(null);
          setFormData({ name: '', contactEmail: '', leadTimeDays: 7 });
      }
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingSupplier) {
          onUpdateSupplier({ ...editingSupplier, ...formData } as Supplier);
      } else {
          const newSupplier: Supplier = {
              id: Math.random().toString(36).substr(2, 9),
              ...formData as any
          };
          onAddSupplier(newSupplier);
      }
      setIsModalOpen(false);
  };

  const filteredSuppliers = suppliers.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Supplier Management</h1>
          <p className="text-slate-500">Manage vendor records and contact information.</p>
        </div>
        <button 
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          <Plus size={18} />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative">
        <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search suppliers..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredSuppliers.length === 0 ? (
             <div className="col-span-full text-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                 No suppliers found.
             </div>
         ) : (
             filteredSuppliers.map(supplier => (
                 <div key={supplier.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-4">
                         <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                             <Building2 size={24} />
                         </div>
                         <div className="flex space-x-2">
                             <button onClick={() => handleOpenModal(supplier)} className="text-slate-400 hover:text-primary-600 p-1">
                                 <Edit2 size={18} />
                             </button>
                             <button onClick={() => onDeleteSupplier(supplier.id)} className="text-slate-400 hover:text-red-600 p-1">
                                 <Trash2 size={18} />
                             </button>
                         </div>
                     </div>
                     <h3 className="text-lg font-bold text-slate-900 mb-1">{supplier.name}</h3>
                     <div className="space-y-2 mt-4">
                         <div className="flex items-center text-sm text-slate-500">
                             <Mail size={16} className="mr-2 text-slate-400" />
                             {supplier.contactEmail}
                         </div>
                         <div className="flex items-center text-sm text-slate-500">
                             <Clock size={16} className="mr-2 text-slate-400" />
                             {supplier.leadTimeDays} days lead time
                         </div>
                     </div>
                 </div>
             ))
         )}
      </div>

      {/* Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                 <div className="flex justify-between items-center p-6 border-b border-slate-100">
                      <h3 className="text-lg font-bold text-slate-900">{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                 </div>
                 <form onSubmit={handleSubmit} className="p-6 space-y-4">
                     <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name</label>
                         <input 
                            type="text" 
                            required 
                            className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                         />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                         <input 
                            type="email" 
                            required 
                            className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            value={formData.contactEmail}
                            onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                         />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Lead Time (Days)</label>
                         <input 
                            type="number" 
                            required 
                            min="1"
                            className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            value={formData.leadTimeDays}
                            onChange={e => setFormData({...formData, leadTimeDays: parseInt(e.target.value) || 0})}
                         />
                     </div>
                     <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-4">
                         <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                         <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2">
                             <Save size={18} />
                             <span>Save Supplier</span>
                         </button>
                     </div>
                 </form>
             </div>
         </div>
      )}
    </div>
  );
};

export default Suppliers;