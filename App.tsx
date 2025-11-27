import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Purchasing from './components/Purchasing';
import Suppliers from './components/Suppliers';
import { ViewState, Product, Supplier, PurchaseOrder, PurchaseRequisition, POStatus, PRStatus, POItem } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  
  // App State
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);

  // Load state from local storage on mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('nexus_products');
    const savedSuppliers = localStorage.getItem('nexus_suppliers');
    const savedOrders = localStorage.getItem('nexus_orders');
    const savedReqs = localStorage.getItem('nexus_reqs');

    if (savedProducts) {
      const parsed = JSON.parse(savedProducts);
      // Migration: Ensure status exists
      const migratedProducts = parsed.map((p: any) => ({
        ...p,
        status: p.status || 'ACTIVE'
      }));
      setProducts(migratedProducts);
    }
    if (savedSuppliers) setSuppliers(JSON.parse(savedSuppliers));
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    if (savedReqs) setRequisitions(JSON.parse(savedReqs));
  }, []);

  // Save state effects
  useEffect(() => {
    localStorage.setItem('nexus_products', JSON.stringify(products));
  }, [products]);
  
  useEffect(() => {
    localStorage.setItem('nexus_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('nexus_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('nexus_reqs', JSON.stringify(requisitions));
  }, [requisitions]);

  // --- Product Handlers ---
  const handleSeedData = (newProducts: Product[], newSuppliers: Supplier[]) => {
    setProducts(newProducts);
    setSuppliers(newSuppliers);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  // --- Supplier Handlers ---
  const handleAddSupplier = (supplier: Supplier) => {
      setSuppliers(prev => [...prev, supplier]);
  };

  const handleUpdateSupplier = (updatedSupplier: Supplier) => {
      setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
  };

  const handleDeleteSupplier = (id: string) => {
      setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  // --- Purchasing Handlers ---
  const handleAddRequisitions = (newReqs: PurchaseRequisition[]) => {
      setRequisitions(prev => [...prev, ...newReqs]);
  };

  const handleConvertPRtoPO = (prId: string, supplierId: string) => {
      const pr = requisitions.find(r => r.id === prId);
      if (!pr) return;

      // Update PR status
      const updatedReqs = requisitions.map(r => r.id === prId ? { ...r, status: PRStatus.CONVERTED } : r);
      setRequisitions(updatedReqs);

      // Create PO
      const totalAmount = pr.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const newPO: PurchaseOrder = {
          id: Math.random().toString(36).substr(2, 9),
          orderNumber: `PO-${Math.floor(Math.random() * 10000)}`,
          supplierId: supplierId,
          status: POStatus.DRAFT,
          dateCreated: new Date().toISOString(),
          items: pr.items,
          totalAmount,
          originalRequisitionId: pr.id
      };
      setOrders(prev => [...prev, newPO]);
  };

  const handleUpdatePOStatus = (id: string, status: POStatus) => {
    setOrders(prev => prev.map(order => {
        if (order.id !== id) return order;

        // Logic for Receiving Goods
        if (order.status !== POStatus.RECEIVED && status === POStatus.RECEIVED) {
            const updatedProducts = [...products];
            order.items.forEach(item => {
                const prodIndex = updatedProducts.findIndex(p => p.id === item.productId);
                if (prodIndex >= 0) {
                    updatedProducts[prodIndex] = {
                        ...updatedProducts[prodIndex],
                        stockLevel: updatedProducts[prodIndex].stockLevel + item.quantity,
                        lastUpdated: new Date().toISOString()
                    };
                }
            });
            setProducts(updatedProducts);
        }
        
        return { ...order, status };
    }));
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard products={products} orders={orders} />;
      case ViewState.INVENTORY:
        return (
          <Inventory 
            products={products} 
            suppliers={suppliers} 
            onSeedData={handleSeedData} 
            onUpdateProduct={handleUpdateProduct}
          />
        );
      case ViewState.PURCHASING:
        return (
          <Purchasing 
            products={products} 
            suppliers={suppliers} 
            orders={orders} 
            requisitions={requisitions}
            onAddRequisitions={handleAddRequisitions}
            onConvertPR={handleConvertPRtoPO}
            onUpdatePOStatus={handleUpdatePOStatus}
          />
        );
      case ViewState.SUPPLIERS:
        return (
            <Suppliers 
                suppliers={suppliers}
                onAddSupplier={handleAddSupplier}
                onUpdateSupplier={handleUpdateSupplier}
                onDeleteSupplier={handleDeleteSupplier}
            />
        );
      default:
        return <Dashboard products={products} orders={orders} />;
    }
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {renderContent()}
    </Layout>
  );
}

export default App;