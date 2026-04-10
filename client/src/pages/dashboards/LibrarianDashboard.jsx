import { useState } from 'react';
import { BookOpen, BookCheck, Shield, MessageSquare, Home, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LibrarianDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'overview', icon: Home, label: 'Library Overview' },
    { id: 'issued', icon: BookCheck, label: 'Issued / Returned' },
    { id: 'overdue', icon: Shield, label: 'Overdue Books' },
    { id: 'requests', icon: MessageSquare, label: 'New Requests' },
  ];

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
           <span className="text-xs font-black uppercase tracking-widest text-amber-600">Library Portal</span>
           <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500">
              <X size={20} />
           </button>
        </div>
        {menuItems.map(item => (
           <button key={item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === item.id ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}>
              <item.icon size={20} /> <span className="text-sm font-bold uppercase tracking-tight">{item.label}</span>
           </button>
        ))}
      </aside>
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h1 className="text-3xl font-extrabold dark:text-white capitalize">{menuItems.find(i=>i.id===activeTab)?.label}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Logged in securely as <span className="uppercase font-bold text-amber-500">Librarian</span></p>
           </div>
           <button 
             onClick={() => setIsSidebarOpen(true)}
             className="lg:hidden flex items-center gap-2 self-start px-4 py-2 rounded-xl bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-600/20"
           >
             <BookOpen size={14} />
             Open Menu
           </button>
        </header>

        {activeTab === 'overview' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass p-6 rounded-2xl border-l-[6px] border-l-blue-500 flex justify-between">
                <div><p className="text-sm font-medium text-gray-500">Issued Today</p><h3 className="text-3xl font-black dark:text-white">45</h3></div>
              </div>
              <div className="glass p-6 rounded-2xl border-l-[6px] border-l-emerald-500 flex justify-between">
                <div><p className="text-sm font-medium text-gray-500">Returned Today</p><h3 className="text-3xl font-black dark:text-white">38</h3></div>
              </div>
               <div className="glass p-6 rounded-2xl border-l-[6px] border-l-rose-500 flex justify-between">
                <div><p className="text-sm font-medium text-gray-500">Overdue Books</p><h3 className="text-3xl font-black text-rose-500">12</h3></div>
              </div>
               <div className="glass p-6 rounded-2xl border-l-[6px] border-l-amber-500 flex justify-between">
                <div><p className="text-sm font-medium text-gray-500">Pending Requests</p><h3 className="text-3xl font-black dark:text-white">7</h3></div>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl mt-6">
               <h3 className="text-xl font-bold dark:text-white mb-4">Library Log Activity</h3>
               <div className="space-y-3">
                 <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border-l-4 border-amber-500"><span className="text-gray-500 mr-4">10 Mins Ago</span> "Introduction to Algorithms" issued to 033CS20</div>
                 <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border-l-4 border-emerald-500"><span className="text-gray-500 mr-4">1 Hour Ago</span> "Operating Systems" returned by 011ME19</div>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex bg-gray-100 dark:bg-gray-900/50 h-[50vh] items-center justify-center text-gray-500 rounded-2xl">
            {activeTab} Management Panel Loading...
          </div>
        )}
      </main>
    </div>
  );
};
export default LibrarianDashboard;
