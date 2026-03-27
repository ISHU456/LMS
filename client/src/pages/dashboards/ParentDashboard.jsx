import { useState, useEffect } from 'react';
import { Home, User, CheckCircle, CreditCard, MessageCircle, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const ParentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const menuItems = [
    { id: 'overview', icon: Home, label: 'Child Overview' },
    { id: 'attendance', icon: CheckCircle, label: 'Attendance' },
    { id: 'fees', icon: CreditCard, label: 'Fee Status' },
    { id: 'communication', icon: MessageCircle, label: 'Communication' },
  ];

  const chartData = [
    { name: 'Month 1', score: 65 },
    { name: 'Month 2', score: 72 },
    { name: 'Month 3', score: 85 },
    { name: 'Month 4', score: 81 },
  ];

  if (isLoading) return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col lg:flex-row bg-gray-50 p-4 md:p-8 gap-6 animate-pulse">
       <div className="w-full lg:w-64 bg-gray-200 rounded-2xl h-48 lg:h-full"></div>
       <div className="flex-1 bg-gray-200 rounded-2xl h-56 lg:h-full"></div>
    </div>
  );

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col lg:flex-row bg-gray-50 dark:bg-[#0f172a]">
      <aside className="w-full lg:w-64 glass border-b lg:border-r border-gray-200 dark:border-gray-800 p-4 space-y-2 overflow-y-auto max-h-[40vh] lg:max-h-none">
        {menuItems.map(item => (
           <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === item.id ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}>
              <item.icon size={20} /> {item.label}
           </button>
        ))}
      </aside>
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8">
           <h1 className="text-3xl font-extrabold dark:text-white capitalize">{menuItems.find(i=>i.id===activeTab)?.label}</h1>
           <p className="text-gray-500 dark:text-gray-400 mt-1">Logged in securely as <span className="uppercase font-bold text-emerald-500">Parent/Guardian</span></p>
        </header>

        {activeTab === 'overview' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass p-6 rounded-2xl border-l-[6px] border-l-blue-500">
                <p className="text-sm font-medium text-gray-500">Current CGPA</p><h3 className="text-3xl font-black dark:text-white mt-1">8.2</h3>
              </div>
              <div className="glass p-6 rounded-2xl border-l-[6px] border-l-emerald-500">
                <p className="text-sm font-medium text-gray-500">Overall Attendance</p><h3 className="text-3xl font-black dark:text-white mt-1">88%</h3>
              </div>
               <div className="glass p-6 rounded-2xl border-l-[6px] border-l-rose-500">
                <p className="text-sm font-medium text-gray-500">Pending Fees</p><h3 className="text-3xl font-black dark:text-white mt-1">$1,250</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
               <div className="glass p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
                 <h3 className="text-xl font-bold dark:text-white mb-6">Child's Academic Progress</h3>
                 <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Area type="monotone" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
               </div>
               <div className="glass p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
                 <h3 className="text-xl font-bold dark:text-white mb-6">Recent Teacher Notes</h3>
                 <div className="space-y-3">
                   <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border-l-4 border-indigo-500"><span className="text-indigo-500 font-bold mr-2">Prof. Smith:</span> Great improvement in Mathematics this term.</div>
                   <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border-l-4 border-amber-500"><span className="text-amber-500 font-bold mr-2">Admin:</span> Please note the upcoming fee deadline on the 15th.</div>
                 </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex bg-gray-100 dark:bg-gray-900/50 h-[50vh] items-center justify-center text-gray-500 rounded-2xl">
            {activeTab} Module Loading...
          </div>
        )}
      </main>
    </div>
  );
};
export default ParentDashboard;
