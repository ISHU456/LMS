import React, { useState } from 'react';
import { Plus, Clock, Map, Zap, Calendar, User, Loader2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const QuickScheduleAdd = ({ timetable, updateScheduleInDB, user, courseId, handleDeleteScheduleItem }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        days: ['Monday'],
        startTime: '10:00',
        endTime: '11:00',
        room: '',
        activity: '',
        type: 'lecture'
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const navigate = useNavigate();

    const toggleDay = (day) => {
        setFormData(prev => ({
            ...prev,
            days: prev.days.includes(day) 
                ? prev.days.filter(d => d !== day) 
                : [...prev.days, day]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.days.length === 0) return alert('Select at least one day');
        setIsLoading(true);

        const newEntries = formData.days.map(day => ({
            day: day,
            time: `${formData.startTime} - ${formData.endTime}`,
            room: formData.room,
            activity: `${courseId.toUpperCase()} ${formData.type.toUpperCase()} SESSION`,
            type: formData.type,
            addedBy: user.name
        }));

        const updated = [...timetable, ...newEntries];
        if (await updateScheduleInDB({ schedule: updated })) {
            setFormData({ ...formData, room: '', activity: '', days: ['Monday'] });
            setIsOpen(false);
        }
        setIsLoading(false);
    };

    return (
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white dark:border-gray-800 rounded-[2rem] shadow-xl overflow-hidden transition-all duration-500">
            <div className="flex items-center">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex-1 p-5 flex items-center justify-between group hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/30">
                            <Plus size={20} className={`translate-all duration-500 ${isOpen ? 'rotate-45' : ''}`} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xs font-black dark:text-white uppercase tracking-tighter">Quick Class Injection</h3>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Batch Protocol Deployment</p>
                        </div>
                    </div>
                </button>
                <div className="pr-4">
                    <button 
                        onClick={() => navigate(`/courses/${courseId}/quick-schedule`)}
                        className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                        title="Open Full Page Manager"
                    >
                        <ExternalLink size={16} />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-gray-100 dark:border-gray-800"
                    >
                        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[450px]">
                            {/* Scrollable Fields */}
                            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                        <Calendar size={12}/> Temporal Target Selection
                                    </label>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {days.map(d => (
                                            <button 
                                                key={d}
                                                type="button"
                                                onClick={() => toggleDay(d)}
                                                className={`py-2 rounded-lg text-[8px] font-black uppercase transition-all border ${formData.days.includes(d) ? 'bg-primary-600 border-primary-600 text-white shadow-md' : 'bg-gray-50 dark:bg-gray-800 border-transparent text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                            >
                                                {d.slice(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                            <Clock size={12}/> Entry
                                        </label>
                                        <input type="time" value={formData.startTime} onChange={e=>setFormData({...formData, startTime: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-[10px] font-black outline-none focus:ring-1 ring-primary-500 transition-all text-gray-900 dark:text-gray-100" required/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                            <Clock size={12}/> Exit
                                        </label>
                                        <input type="time" value={formData.endTime} onChange={e=>setFormData({...formData, endTime: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-[10px] font-black outline-none focus:ring-1 ring-primary-500 transition-all text-gray-900 dark:text-gray-100" required/>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pb-2">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                            <Map size={12}/> Sector
                                        </label>
                                        <input type="text" placeholder="e.g. B-201" value={formData.room} onChange={e=>setFormData({...formData, room: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-[10px] font-black outline-none focus:ring-1 ring-primary-500 transition-all text-gray-900 dark:text-gray-100" required/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                            <Zap size={12}/> Class Type
                                        </label>
                                        <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase outline-none focus:ring-1 ring-primary-500 transition-all text-gray-900 dark:text-gray-100">
                                            {['lecture', 'lab', 'tutorial', 'seminar'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Fixed Footer with Button */}
                            <div className="p-6 pt-2 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800">
                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                    {isLoading ? 'SYNCING ARCHIVE...' : 'AUTHORIZE DEPLOYMENT'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


export default QuickScheduleAdd;
