import { useState, useEffect } from 'react';
import { Home, Users, BarChart2, MessageSquare, BookOpen, Clock, UserCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const HODDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const menuItems = [
    { id: 'overview', icon: Home, label: 'Department Overview' },
    { id: 'faculty', icon: Users, label: 'Faculty Leave Requests' },
    { id: 'reports', icon: BarChart2, label: 'Performance Reports' },
    { id: 'feedback', icon: MessageSquare, label: 'Student Feedback' },
    { id: 'resources', icon: BookOpen, label: 'Resource Requests' },
  ];

  const chartData = [
    { subject: 'Algorithms', passRate: 85 },
    { subject: 'Databases', passRate: 92 },
    { subject: 'Networking', passRate: 78 },
    { subject: 'AI', passRate: 88 },
  ];

  if (isLoading) return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col lg:flex-row bg-gray-50 p-4 md:p-8 gap-6 animate-pulse">
       <div className="w-full lg:w-64 bg-gray-200 rounded-2xl h-48 lg:h-full"></div>
       <div className="flex-1 bg-gray-200 rounded-2xl h-56 lg:h-full"></div>
    </div>
  );

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col lg:flex-row bg-gray-50 dark:bg-[#0f172a] relative overflow-hidden">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`fixed lg:relative inset-y-0 left-0 w-64 glass border-r border-gray-200 dark:border-gray-800 p-4 space-y-2 z-[101] transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} bg-white dark:bg-[#0f172a]`}>
        <div className="flex items-center justify-between lg:hidden mb-6">
           <span className="text-xs font-black uppercase tracking-widest text-purple-600">HOD Portal</span>
           <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500">
              <X size={20} />
           </button>
        </div>
        {menuItems.map(item => (
           <button key={item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === item.id ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}>
              <item.icon size={20} /> <span className="text-sm font-bold uppercase tracking-tight">{item.label}</span>
           </button>
        ))}
      </aside>
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
         <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-3xl font-extrabold dark:text-white capitalize">{menuItems.find(i=>i.id===activeTab)?.label}</h1>
               <p className="text-gray-500 dark:text-gray-400 mt-1">Logged in securely as <span className="uppercase font-bold text-purple-500">Head of Department</span></p>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 self-start px-4 py-2 rounded-xl bg-purple-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-600/20"
            >
              <Users size={14} />
              Open Menu
            </button>
         </header>

        {activeTab === 'overview' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass p-6 rounded-2xl border-l-[6px] border-l-blue-500">
                <p className="text-sm font-medium text-gray-500">Total Students</p><h3 className="text-3xl font-black dark:text-white mt-1">450</h3>
              </div>
              <div className="glass p-6 rounded-2xl border-l-[6px] border-l-purple-500">
                <p className="text-sm font-medium text-gray-500">Total Faculty</p><h3 className="text-3xl font-black dark:text-white mt-1">24</h3>
              </div>
               <div className="glass p-6 rounded-2xl border-l-[6px] border-l-amber-500">
                <p className="text-sm font-medium text-gray-500">Leave Requests</p><h3 className="text-3xl font-black dark:text-white mt-1">2</h3>
              </div>
               <div className="glass p-6 rounded-2xl border-l-[6px] border-l-emerald-500">
                <p className="text-sm font-medium text-gray-500">Resource Requests</p><h3 className="text-3xl font-black dark:text-white mt-1">5</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
               <div className="glass p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
                 <h3 className="text-xl font-bold dark:text-white mb-6">Subject Pass Rates</h3>
                 <div className="h-[250px] w-full relative">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="subject" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="passRate" fill="#a855f7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    )}
                 </div>
               </div>
               <div className="glass p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
                 <h3 className="text-xl font-bold dark:text-white mb-6">Action Items</h3>
                 <div className="space-y-3">
                   <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border-l-4 border-amber-500 flex items-center justify-between">
                      <div><span className="font-bold">Prof. Johnson</span> requesting 2 days Medical Leave.</div>
                      <Clock size={20} className="text-amber-500" />
                   </div>
                   <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border-l-4 border-blue-500 flex items-center justify-between">
                      <div><span className="font-bold">Networking Lab</span> requesting new router shipment.</div>
                      <Clock size={20} className="text-blue-500" />
                   </div>
                 </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex bg-gray-100 dark:bg-gray-900/50 h-[50vh] items-center justify-center text-gray-500 rounded-2xl">
            {activeTab} Management Module...
          </div>
        )}
      </main>
    </div>
  );
};
export default HODDashboard;
