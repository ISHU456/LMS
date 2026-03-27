import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Terminal, 
  Book, 
  Award, 
  Settings, 
  Trash2, 
  Edit, 
  PlusCircle, 
  CloudUpload,
  CheckCircle,
  Clock,
  LayoutGrid,
  TrendingUp,
  ShieldAlert,
  Save,
  ChevronRight,
  Database
} from 'lucide-react';
import { useSelector } from 'react-redux';

const AdminContestManager = () => {
    const { user } = useSelector(state => state.auth);
    const [activeTab, setActiveTab] = useState('contests');
    const [contests, setContests] = useState([]);
    const [problems, setProblems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Form States
    const [showCreateContest, setShowCreateContest] = useState(false);
    const [showCreateProblem, setShowCreateProblem] = useState(false);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [contestsRes, problemsRes] = await Promise.all([
                    axios.get('http://localhost:5001/api/coding-contests', { headers: { Authorization: `Bearer ${user.token}` } }),
                    axios.get('http://localhost:5001/api/coding-contests/admin/problems', { headers: { Authorization: `Bearer ${user.token}` } }) // Need to add this API
                ]);
                setContests(contestsRes.data);
                // Problems API might need to be added or derived
                setProblems(problemsRes.data || []);
            } catch (err) { console.error(err); }
            finally { setIsLoading(false); }
        };
        fetchData();
    }, [user.token]);

    const handleFinalize = async (contestId) => {
        if (!window.confirm('Finalize this contest and award prizes/badges? This cannot be undone.')) return;
        try {
            await axios.post(`http://localhost:5001/api/coding-contests/admin/finalize/${contestId}`, {}, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('Contest finalized successfully.');
        } catch (err) { alert('Finalization failed'); }
    };

    return (
        <div className="min-h-screen bg-[#030712] text-white flex">
            {/* Admin Vertical Sidebar */}
            <aside className="w-80 bg-gray-950 border-r border-gray-800 flex flex-col p-8 sticky top-0 h-screen shrink-0">
                <div className="flex items-center gap-3 mb-10">
                    <div className="p-2 bg-primary-600 rounded-xl">
                      <Terminal size={20} />
                    </div>
                    <h1 className="text-xl font-black uppercase tracking-tighter">Command Center</h1>
                </div>

                <nav className="flex-1 flex flex-col gap-2">
                    {[
                        { id: 'contests', label: 'All Rounds', icon: <Terminal size={18} /> },
                        { id: 'problems', label: 'Matrix Vault', icon: <Database size={18} /> },
                        { id: 'prizes', label: 'Treasury', icon: <Award size={18} /> },
                        { id: 'analytics', label: 'Network Scan', icon: <TrendingUp size={18} /> }
                    ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-xl shadow-primary-500/20' : 'text-gray-500 hover:bg-gray-900 hover:text-gray-300'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-8 border-t border-gray-900">
                    <div className="flex items-center gap-4 bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
                        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center font-black">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-tight line-clamp-1">{user?.name}</span>
                            <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Admin Clearance</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 p-12 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-12">
                        <div>
                           <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">{activeTab === 'contests' ? 'Weekly Contest Protocol' : activeTab === 'problems' ? 'Resource Problem Vault' : 'System Administration'}</h2>
                           <p className="text-gray-500 font-black uppercase text-[11px] tracking-widest">Global operations and infrastructure control</p>
                        </div>
                        <div className="flex gap-4">
                           <button 
                             onClick={() => setActiveTab('contests')}
                             className="px-6 py-3 bg-gray-900 border border-gray-800 text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition-all flex items-center gap-3"
                           >
                             <Search size={16} /> Search Network
                           </button>
                           <button 
                             onClick={() => setShowCreateContest(true)}
                             className="px-8 py-3 bg-primary-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary-500/20 flex items-center gap-3"
                           >
                             <PlusCircle size={18} /> Deploy New Round
                           </button>
                        </div>
                    </div>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                         {[
                             { label: 'Active Rounds', value: contests.filter(c => c.status === 'live').length, icon: <Terminal />, color: 'text-primary-500' },
                             { label: 'Total Matrix Problems', value: problems.length, icon: <Database />, color: 'text-emerald-500' },
                             { label: 'Total Submissions', value: '42.8k', icon: <CloudUpload />, color: 'text-amber-500' },
                             { label: 'Server Integrity', value: '99.9%', icon: <Settings />, color: 'text-purple-500' }
                         ].map((stat, i) => (
                             <div key={i} className="bg-gray-900/40 p-6 rounded-[2.5rem] border border-gray-800">
                                 <div className="flex justify-between items-center mb-4">
                                     <div className={`p-3 bg-black/20 rounded-xl ${stat.color}`}>{stat.icon}</div>
                                     <span className="text-[10px] font-black text-emerald-500">+12%</span>
                                 </div>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{stat.label}</p>
                                 <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                             </div>
                         ))}
                    </div>

                    {/* Main Table List */}
                    <div className="bg-gray-900/40 rounded-[3rem] border border-gray-800 overflow-hidden shadow-2xl">
                        <div className="grid grid-cols-12 px-10 py-6 border-b border-gray-800 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 bg-gray-900/20">
                            <div className="col-span-1">Round ID</div>
                            <div className="col-span-4">Operation Title</div>
                            <div className="col-span-2">Difficulty</div>
                            <div className="col-span-2">Timeline Status</div>
                            <div className="col-span-3 text-right">System Actions</div>
                        </div>

                        <div className="divide-y divide-gray-800/50">
                            {contests.length > 0 ? contests.map((contest, idx) => (
                                <div key={contest._id} className="grid grid-cols-12 items-center px-10 py-8 hover:bg-white/5 transition-colors">
                                    <div className="col-span-1 text-gray-700 font-black">#0{idx + 1}</div>
                                    <div className="col-span-4 flex flex-col">
                                        <span className="text-lg font-black uppercase tracking-tight">{contest.title}</span>
                                        <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">{contest.problems?.length} Nodes Linked</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="px-5 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-[10px] font-black uppercase tracking-widest text-gray-400">Mixed</span>
                                    </div>
                                    <div className="col-span-2 flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${contest.status === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-700'}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${contest.status === 'live' ? 'text-emerald-500' : 'text-gray-500'}`}>
                                            {contest.status === 'live' ? 'Active Matrix' : 'Standby'}
                                        </span>
                                    </div>
                                    <div className="col-span-3 flex justify-end gap-3">
                                        <button 
                                          onClick={() => handleFinalize(contest._id)}
                                          className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10"
                                        >
                                           <CheckCircle size={18} />
                                        </button>
                                        <button className="p-3 bg-gray-800 text-gray-400 rounded-xl border border-gray-700 hover:bg-primary-600 hover:text-white transition-all">
                                           <Edit size={18} />
                                        </button>
                                        <button className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                           <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-32 text-center">
                                    <Database size={48} className="mx-auto text-gray-800 mb-6" />
                                    <p className="text-gray-600 font-black uppercase tracking-widest text-xs">No rounds deployed in memory. Initiate sequence.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminContestManager;
