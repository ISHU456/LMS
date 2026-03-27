import { useState, useEffect } from 'react';
import axios from 'axios';
import { Megaphone, Send, Shield, Zap, Bell, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminGlobalBroadcasts = ({ user }) => {
    const [broadcasts, setBroadcasts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'normal',
        category: 'General'
    });

    useEffect(() => {
        fetchBroadcasts();
    }, [user]);

    const fetchBroadcasts = async () => {
        try {
            const res = await axios.get('http://localhost:5001/api/admin/broadcasts', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setBroadcasts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await axios.post('http://localhost:5001/api/admin/broadcasts', formData, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setFormData({ title: '', content: '', priority: 'normal', category: 'General' });
            fetchBroadcasts();
            alert('Signal broadcasted across all sectors.');
        } catch (err) {
            alert('Signal failure: Transmission lost.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12">
            <header className="flex items-center gap-4 mb-10">
                <div className="w-16 h-16 rounded-[24px] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                    <Megaphone size={32} />
                </div>
                <div>
                    <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter">Global Broadcast Hub</h2>
                    <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mt-1">Direct Neural Mass-Communication to Institutional Nodes</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* TRANSMISSION MODULE */}
                <section className="glass p-10 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-xl space-y-8 h-fit">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2 italic">
                        <Send size={14} /> New Transmission
                    </h3>

                    <form onSubmit={handleSend} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Transmission Title</label>
                            <input 
                                required
                                type="text" 
                                placeholder="Semester Finalization Protocol..."
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all dark:text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Frequency Group</label>
                            <div className="flex gap-3">
                                {['General', 'Emergency', 'Academic', 'Holiday'].map(cat => (
                                    <button 
                                        type="button"
                                        key={cat}
                                        onClick={() => setFormData({...formData, category: cat})}
                                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.category === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border border-transparent hover:border-indigo-300'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Message Content</label>
                            <textarea 
                                required
                                rows="6"
                                placeholder="Enter system-wide announcement content..."
                                value={formData.content}
                                onChange={(e) => setFormData({...formData, content: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-indigo-500 rounded-[28px] px-8 py-6 text-sm font-bold outline-none transition-all dark:text-white resize-none shadow-inner italic"
                            ></textarea>
                        </div>

                        <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl">
                            <div className="flex items-center gap-3">
                                <Shield size={18} className={formData.priority === 'high' ? 'text-red-500' : 'text-gray-400'} />
                                <div>
                                    <p className="text-[10px] font-black dark:text-white uppercase tracking-widest">High Priority Protocol</p>
                                    <p className="text-[8px] font-bold text-gray-500 uppercase mt-0.5">Bypass Regular Filters</p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setFormData({...formData, priority: formData.priority === 'high' ? 'normal' : 'high'})}
                                className={`w-12 h-6 rounded-full relative transition-colors ${formData.priority === 'high' ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                            >
                                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${formData.priority === 'high' ? 'left-6.5' : 'left-0.5'}`} />
                            </button>
                        </div>

                        <button 
                            type="submit"
                            disabled={isSaving}
                            className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-500 shadow-2xl shadow-indigo-500/40 transition-all flex items-center justify-center gap-3 disabled:bg-gray-400"
                        >
                            <Zap size={20} className="animate-pulse" /> {isSaving ? 'Synchronizing Frequency...' : 'Broadcast Mass-Identity Signal'}
                        </button>
                    </form>
                </section>

                {/* SIGNAL LOGS */}
                <section className="space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2 italic px-2">
                        <Clock size={14} /> Historical Signal Stream
                    </h3>

                    <div className="space-y-6 max-h-[800px] overflow-y-auto pr-4 scrollbar-thin">
                        <AnimatePresence>
                            {broadcasts.length > 0 ? broadcasts.map((b, idx) => (
                                <motion.div 
                                    key={b._id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="glass p-8 rounded-[40px] border border-gray-100 dark:border-gray-800 hover:shadow-2xl transition-all group relative overflow-hidden"
                                >
                                    {b.important && (
                                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500 shadow-[2px_0_10px_rgba(239,68,68,0.5)]" />
                                    )}

                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                                {b.author?.profilePic ? (
                                                    <img src={b.author.profilePic} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Bell size={20} className="text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black dark:text-white uppercase tracking-widest">{b.title}</p>
                                                <span className="text-[8px] font-bold text-gray-400 uppercase italic">VIA {b.author?.name || 'CENTRAL SYSTEM'}</span>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black text-indigo-500 uppercase bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-xl">{b.category}</span>
                                    </div>

                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-6 leading-relaxed italic">{b.content}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 size={12} className="text-emerald-500" />
                                            <span className="text-[8px] font-black text-gray-400 uppercase">Received by All Nodes</span>
                                        </div>
                                        <span className="text-[8px] font-black text-gray-400 uppercase">{new Date(b.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-800/20 rounded-[40px] border-2 border-dashed border-gray-100 dark:border-gray-800">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">No Institutional Broadcasts Active</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AdminGlobalBroadcasts;
