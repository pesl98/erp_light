import React from 'react';
import { LayoutDashboard, Package, ShoppingCart, Users, Menu, X, Box } from 'lucide-react';
import { ViewState } from '../types';

interface LayoutProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        onChangeView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center space-x-3 px-6 py-4 transition-colors duration-200 ${
        currentView === view
          ? 'bg-primary-50 text-primary-700 border-r-4 border-primary-600'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-full shadow-sm z-10">
        <div className="flex items-center space-x-2 px-6 py-8">
          <div className="bg-primary-600 p-2 rounded-lg text-white">
            <Box size={24} />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">Nexus ERP</span>
        </div>

        <nav className="flex-1 mt-6">
          <NavItem view={ViewState.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
          <NavItem view={ViewState.INVENTORY} icon={Package} label="Inventory" />
          <NavItem view={ViewState.PURCHASING} icon={ShoppingCart} label="Purchasing" />
          <NavItem view={ViewState.SUPPLIERS} icon={Users} label="Suppliers" />
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
              JD
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">John Doe</p>
              <p className="text-xs text-slate-500">Warehouse Mgr</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-slate-200 z-20 px-4 py-3 flex items-center justify-between">
         <div className="flex items-center space-x-2">
            <div className="bg-primary-600 p-1.5 rounded text-white">
               <Box size={20} />
            </div>
            <span className="font-bold text-slate-900">Nexus ERP</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} className="text-slate-600" /> : <Menu size={24} className="text-slate-600" />}
         </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-10 pt-16">
           <nav className="flex flex-col">
            <NavItem view={ViewState.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
            <NavItem view={ViewState.INVENTORY} icon={Package} label="Inventory" />
            <NavItem view={ViewState.PURCHASING} icon={ShoppingCart} label="Purchasing" />
            <NavItem view={ViewState.SUPPLIERS} icon={Users} label="Suppliers" />
           </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full relative pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;