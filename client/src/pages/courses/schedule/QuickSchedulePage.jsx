import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, Clock, Map, Zap, User, Plus, 
    ArrowLeft, Layout, ShieldCheck, Loader2, 
    Trash2, Edit3, X, Check, Save
} from 'lucide-react';

const QuickSchedulePage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    
    const [timetable, setTimetable] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingIdx, setEditingIdx] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    // Injection Form State
    const [formData, setFormData] = useState({
        days: ['Monday'],
        startTime: '10:00',
        endTime: '11:00',
        room: '',
        activity: '',
        type: 'lecture'
    });

    const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        fetchSchedule();
    }, [courseId]);

    const fetchSchedule = async () => {
        try {
            setIsLoading(true);
            const code = courseId.toUpperCase();
            const res = await axios.get(`http://localhost:5000/api/courses/${code}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setTimetable(res.data.schedule || []);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const updateScheduleInDB = async (newSchedule) => {
        try {
            setIsSaving(true);
            const code = courseId.toUpperCase();
            const res = await axios.put(`http://localhost:5000/api/courses/${code}/schedule`, 
                { schedule: newSchedule },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setTimetable(res.data.schedule);
            return true;
        } catch (err) {
            alert('Sync failed');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const toggleDay = (day) => {
        setFormData(prev => ({
            ...prev,
            days: prev.days.includes(day) 
                ? prev.days.filter(d => d !== day) 
                : [...prev.days, day]
        }));
    };

    const handleInject = async (e) => {
        e.preventDefault();
        if (formData.days.length === 0) return alert('Select at least one day');
        
        const newEntries = formData.days.map(day => ({
            day: day,
            time: `${formData.startTime} - ${formData.endTime}`,
            room: formData.room,
            activity: `${courseId.toUpperCase()} ${formData.type.toUpperCase()} SESSION`,
            type: formData.type,
            addedBy: user.name
        }));

        const updated = [...timetable, ...newEntries];
        if (await updateScheduleInDB(updated)) {
            setFormData({ ...formData, room: '', activity: '', days: ['Monday'] });
        }
    };

    const handleDelete = async (index) => {
        if (!window.confirm('Erase this entry?')) return;
        const updated = timetable.filter((_, i) => i !== index);
        updateScheduleInDB(updated);
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Decrypting Temporal Nodes...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f8fafc] dark:bg-[#030712] overflow-hidden">
            {/* Header */}
            <header className="shrink-0 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm relative z-20">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-all shadow-inner"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-3">
                            <Zap size={28} className="text-primary-600" /> Quick Class Manager
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{courseId}</span>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">•</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rapid Injection Protocol</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] font-black dark:text-gray-300 uppercase tracking-widest">Authorized Faculty</span>
                        <span className="text-[8px] font-black text-primary-500 uppercase tracking-[0.2em]">{user.name}</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-black text-sm shadow-xl shadow-primary-500/30">
                        {user.name.charAt(0)}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Left: Injection Terminal */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl p-10 max-h-[820px] overflow-y-auto custom-scrollbar">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-xl shadow-primary-500/20">
                                    <Plus size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black dark:text-white uppercase">Batch Injection</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Automated Timeline Deployment</p>
                                </div>
                            </div>

                            <form onSubmit={handleInject} className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                        <Calendar size={14}/> Temporal Targets
                                    </label>
                                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                        {daysList.map(d => (
                                            <button 
                                                key={d}
                                                type="button"
                                                onClick={() => toggleDay(d)}
                                                className={`py-4 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${formData.days.includes(d) ? 'bg-primary-600 border-primary-500 text-white shadow-xl' : 'bg-gray-50 dark:bg-gray-800 border-transparent text-gray-400 hover:border-primary-500/30'}`}
                                            >
                                                {d.slice(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                            <Clock size={14}/> Entry Terminal
                                        </label>
                                        <input type="time" value={formData.startTime} onChange={e=>setFormData({...formData, startTime: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl px-6 py-4 text-xs font-black outline-none focus:ring-2 ring-primary-500 transition-all text-gray-900 dark:text-gray-100" required/>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                            <Clock size={14}/> Exit Terminal
                                        </label>
                                        <input type="time" value={formData.endTime} onChange={e=>setFormData({...formData, endTime: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl px-6 py-4 text-xs font-black outline-none focus:ring-2 ring-primary-500 transition-all text-gray-900 dark:text-gray-100" required/>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                            <Map size={14}/> Sector
                                        </label>
                                        <input type="text" placeholder="e.g. B-201" value={formData.room} onChange={e=>setFormData({...formData, room: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl px-6 py-4 text-xs font-black outline-none focus:ring-2 ring-primary-500 transition-all text-gray-900 dark:text-gray-100" required/>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                            <Zap size={14}/> Node Category
                                        </label>
                                        <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:ring-2 ring-primary-500 transition-all text-gray-900 dark:text-gray-100">
                                            {['lecture', 'lab', 'tutorial', 'seminar'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>



                                <button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="w-full py-6 bg-primary-600 hover:bg-primary-700 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-primary-500/20 active:scale-95 transition-all flex items-center justify-center gap-4"
                                >
                                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                    {isSaving ? 'SYNCING ARCHIVE...' : 'AUTHORIZE DEPLOYMENT'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right: Current Manifest */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col h-full max-h-[800px]">
                            <div className="p-10 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black dark:text-white uppercase tracking-tight">Active Temporal Manifest</h3>
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Live Synchronization Active</p>
                                </div>
                                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{timetable.length} NODES</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                <div className="grid grid-cols-1 gap-4">
                                    <AnimatePresence>
                                        {timetable.map((item, idx) => (
                                            <motion.div 
                                                key={idx}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="p-6 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 rounded-3xl group hover:border-primary-500/30 transition-all duration-300 flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex flex-col items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                                        <span className="text-[11px] font-black text-primary-600 uppercase tracking-tighter">{item.day.slice(0, 3)}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black dark:text-white uppercase tracking-tight group-hover:text-primary-600 transition-colors">{item.activity}</h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Clock size={12}/> {item.time}</span>
                                                            <span className="text-gray-200 dark:text-gray-700">|</span>
                                                            <span className="text-[10px] font-black text-primary-500/70 uppercase tracking-widest flex items-center gap-1.5"><Map size={12}/> {item.room}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleDelete(idx)}
                                                    className="p-4 text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {timetable.length === 0 && (
                                        <div className="py-20 text-center space-y-4">
                                            <Layout size={48} className="text-gray-200 mx-auto" />
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Temporal database is void.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default QuickSchedulePage;
