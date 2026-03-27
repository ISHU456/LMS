import { useState } from 'react';
import { BookOpen, BookCheck, Shield, MessageSquare, Home } from 'lucide-react';

const LibrarianDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const menuItems = [
    { id: 'overview', icon: Home, label: 'Library Overview' },
    { id: 'issued', icon: BookCheck, label: 'Issued / Returned' },
    { id: 'overdue', icon: Shield, label: 'Overdue Books' },
    { id: 'requests', icon: MessageSquare, label: 'New Requests' },
  ];

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col lg:flex-row bg-gray-50 dark:bg-[#0f172a]">
      <aside className="w-full lg:w-64 glass border-b lg:border-r border-gray-200 dark:border-gray-800 p-4 space-y-2 overflow-y-auto max-h-[40vh] lg:max-h-none">
        {menuItems.map(item => (
           <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === item.id ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}>
              <item.icon size={20} /> {item.label}
           </button>
        ))}
      </aside>
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8">
           <h1 className="text-3xl font-extrabold dark:text-white capitalize">{menuItems.find(i=>i.id===activeTab)?.label}</h1>
           <p className="text-gray-500 dark:text-gray-400 mt-1">Logged in securely as <span className="uppercase font-bold text-amber-500">Librarian</span></p>
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
