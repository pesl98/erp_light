import React from 'react';
import { Product, PurchaseOrder, POStatus } from '../types';
import { DollarSign, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface DashboardProps {
  products: Product[];
  orders: PurchaseOrder[];
}

const StatCard = ({ title, value, subtext, icon: Icon, colorClass }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon size={24} />
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ products, orders }) => {
  // Filter active products for stats to ensure accuracy
  const activeProducts = products.filter(p => p.status !== 'INACTIVE');

  const totalValue = activeProducts.reduce((acc, p) => acc + (p.stockLevel * p.unitPrice), 0);
  const lowStockItems = activeProducts.filter(p => p.stockLevel <= p.reorderPoint).length;
  const pendingOrders = orders.filter(o => o.status !== POStatus.RECEIVED).length;
  const receivedOrders = orders.filter(o => o.status === POStatus.RECEIVED).length;

  // Data for charts
  const categoryData = activeProducts.reduce((acc: any[], curr) => {
    const existing = acc.find(x => x.name === curr.category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: curr.category, value: 1 });
    }
    return acc;
  }, []);

  const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

  // Calculate value distribution
  const valueByCat = activeProducts.reduce((acc: any[], curr) => {
      const existing = acc.find(x => x.name === curr.category);
      if(existing) {
          existing.value += (curr.stockLevel * curr.unitPrice);
      } else {
          acc.push({ name: curr.category, value: (curr.stockLevel * curr.unitPrice)});
      }
      return acc;
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
           <p className="text-slate-500">Overview of inventory health and procurement.</p>
        </div>
        <div className="text-right">
            <span className="text-sm text-slate-400">Last updated: Now</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Inventory Value"
          value={`$${totalValue.toLocaleString()}`}
          subtext={`${activeProducts.length} active SKUs`}
          icon={DollarSign}
          colorClass="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          title="Low Stock Alert"
          value={lowStockItems}
          subtext="Active items below reorder point"
          icon={AlertTriangle}
          colorClass="bg-amber-100 text-amber-600"
        />
        <StatCard
          title="Pending Orders"
          value={pendingOrders}
          subtext="Waiting for delivery"
          icon={Clock}
          colorClass="bg-blue-100 text-blue-600"
        />
         <StatCard
          title="Completed Orders"
          value={receivedOrders}
          subtext="Lifetime received"
          icon={TrendingUp}
          colorClass="bg-indigo-100 text-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-4">Stock Value by Category</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valueByCat}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`}/>
                    <Tooltip cursor={{fill: '#f1f5f9'}} formatter={(val: number) => `$${val.toLocaleString()}`} />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Product Count Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <h3 className="font-semibold text-slate-900 mb-4">SKU Count Distribution</h3>
           <div className="h-64 flex justify-center items-center">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={categoryData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {categoryData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-slate-600">
              {categoryData.map((entry: any, index: number) => (
                  <div key={index} className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                      <span>{entry.name} ({entry.value})</span>
                  </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;