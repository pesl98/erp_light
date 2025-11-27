import React, { useState } from 'react';
import { Product, Supplier } from '../types';
import { Search, Plus, Sparkles, Filter, AlertCircle, Edit2, X, Save } from 'lucide-react';
import { generateMockInventory } from '../services/geminiService';

interface InventoryProps {
  products: Product[];
  suppliers: Supplier[];
  onSeedData: (products: Product[], suppliers: Supplier[]) => void;
  onUpdateProduct: (product: Product) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, suppliers, onSeedData, onUpdateProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleGenerateData = async () => {
    setIsGenerating(true);
    const data = await generateMockInventory();
    if (data.products.length > 0) {
      onSeedData(data.products, data.suppliers);
    }
    setIsGenerating(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
        onUpdateProduct({
            ...editingProduct,
            lastUpdated: new Date().toISOString()
        });
        setEditingProduct(null);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500">View and manage stock levels. Edit items to change status.</p>
        </div>
        <div className="flex gap-2">
           {products.length === 0 && (
            <button
              onClick={handleGenerateData}
              disabled={isGenerating}
              className="flex items-center space-x-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-md transition-all disabled:opacity-50"
            >
              <Sparkles size={18} />
              <span>{isGenerating ? 'AI Generating...' : 'Auto-Fill with AI'}</span>
            </button>
           )}
           <button className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors">
              <Plus size={18} />
              <span>Add Product</span>
           </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by SKU, Name, or Category..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
          <Filter size={18} />
          <span>Filters</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 font-semibold text-sm text-slate-600">Product Info</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Status</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Stock Status</th>
                <th className="p-4 font-semibold text-sm text-slate-600 text-right">Unit Price</th>
                <th className="p-4 font-semibold text-sm text-slate-600 text-right">Value</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                   <td colSpan={6} className="p-8 text-center text-slate-400">
                      {isGenerating ? 'Generating data...' : 'No products found. Try using "Auto-Fill with AI".'}
                   </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLowStock = product.stockLevel <= product.reorderPoint;
                  const isInactive = product.status === 'INACTIVE';
                  
                  return (
                    <tr key={product.id} className={`hover:bg-slate-50 transition-colors ${isInactive ? 'bg-slate-50/50' : ''}`}>
                      <td className="p-4">
                        <div className={`flex flex-col ${isInactive ? 'opacity-50' : ''}`}>
                          <span className="font-medium text-slate-900">{product.name}</span>
                          <span className="text-xs text-slate-400">SKU: {product.sku}</span>
                          <span className="text-xs text-slate-500">{product.category}</span>
                        </div>
                      </td>
                      <td className="p-4">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              isInactive 
                                ? 'bg-slate-200 text-slate-500 border border-slate-300' 
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                              {product.status || 'ACTIVE'}
                          </span>
                      </td>
                      <td className="p-4">
                         <div className={`flex items-center space-x-2 ${isInactive ? 'opacity-50' : ''}`}>
                            <div className="flex flex-col">
                                <span className={`font-semibold ${isLowStock && !isInactive ? 'text-red-600' : 'text-slate-700'}`}>
                                    {product.stockLevel}
                                </span>
                                <span className="text-xs text-slate-400">Reorder: {product.reorderPoint}</span>
                            </div>
                            {isLowStock && !isInactive && <AlertCircle size={16} className="text-red-500" />}
                         </div>
                      </td>
                      <td className={`p-4 text-right text-slate-600 ${isInactive ? 'opacity-50' : ''}`}>${product.unitPrice.toFixed(2)}</td>
                      <td className={`p-4 text-right font-medium text-slate-900 ${isInactive ? 'opacity-50' : ''}`}>
                        ${(product.stockLevel * product.unitPrice).toFixed(2)}
                      </td>
                      <td className="p-4">
                          <button 
                            onClick={() => setEditingProduct(product)}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                              <Edit2 size={18} />
                          </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-lg font-bold text-slate-900">Edit Product</h3>
                  <button 
                    onClick={() => setEditingProduct(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/50 transition-colors"
                  >
                      <X size={20} />
                  </button>
              </div>
              
              <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</label>
                          <input 
                            type="text" 
                            required
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-slate-50"
                            value={editingProduct.sku}
                            readOnly
                            title="SKU cannot be changed"
                          />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</label>
                          <div className="relative">
                              <select 
                                 className={`w-full p-2.5 border rounded-lg text-sm font-medium appearance-none outline-none focus:ring-2 focus:ring-primary-500 ${
                                     editingProduct.status === 'INACTIVE' 
                                     ? 'bg-slate-100 border-slate-200 text-slate-600' 
                                     : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                 }`}
                                 value={editingProduct.status || 'ACTIVE'}
                                 onChange={e => setEditingProduct({...editingProduct, status: e.target.value as 'ACTIVE' | 'INACTIVE'})}
                              >
                                  <option value="ACTIVE">Active</option>
                                  <option value="INACTIVE">Inactive</option>
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                        value={editingProduct.name}
                        onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                      />
                  </div>

                  <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</label>
                      <input 
                        type="text" 
                        required
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                        value={editingProduct.category}
                        onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                      />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Stock</label>
                          <input 
                            type="number" 
                            min="0"
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                            value={editingProduct.stockLevel}
                            onChange={e => setEditingProduct({...editingProduct, stockLevel: parseInt(e.target.value) || 0})}
                          />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reorder Point</label>
                          <input 
                            type="number" 
                            min="0"
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                            value={editingProduct.reorderPoint}
                            onChange={e => setEditingProduct({...editingProduct, reorderPoint: parseInt(e.target.value) || 0})}
                          />
                      </div>
                  </div>

                  <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit Price ($)</label>
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                        value={editingProduct.unitPrice}
                        onChange={e => setEditingProduct({...editingProduct, unitPrice: parseFloat(e.target.value) || 0})}
                      />
                  </div>

                  <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
                      <button 
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="px-5 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 shadow-sm transition-colors flex items-center space-x-2"
                      >
                          <Save size={18} />
                          <span>Save Changes</span>
                      </button>
                  </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;