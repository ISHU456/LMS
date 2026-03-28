import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Shield, Globe, Lock, Unlock, Zap, Building2, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminSystemSettings = ({ user }) => {
    const [settings, setSettings] = useState({
        institutionName: '',
        academicYear: '',
        currentSemester: 1,
        maintenanceMode: false,
        registrationOpen: true,
        allowSelfRegistration: true,
        aiDailyCredits: 10,
        globalAlert: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get('http://localhost:5001/api/admin/settings', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setSettings(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await axios.put('http://localhost:5001/api/admin/settings', settings, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('Institutional parameters updated across all sectors.');
        } catch (err) {
            alert('Failed to synchronize system parameters.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="h-64 flex items-center justify-center animate-pulse bg-gray-50 dark:bg-gray-800/50 rounded-[40px] text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Environment Variables...</div>;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
            <header className="flex items-center gap-4 mb-10">
                <div className="w-16 h-16 rounded-[24px] bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-500/30">
                    <Shield size={32} />
                </div>
                <div>
                    <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter">System Configuration</h2>
                    <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mt-1">Master Control Panel for Institutional Parameters</p>
                </div>
            </header>

            <form onSubmit={handleSave} className="space-y-8">
                {/* 1. IDENTITY & BRANDING */}
                <section className="glass p-10 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-xl space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                        <Building2 size={14} /> Institutional Identity
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2 col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Academy Name</label>
                            <input 
                                type="text" 
                                value={settings.institutionName}
                                onChange={(e) => setSettings({...settings, institutionName: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-gray-800 rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all dark:text-white"
                            />
                        </div>
                    </div>
                </section>

                {/* 2. BINARY PROTOCOLS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="glass p-10 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-xl space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                            <Lock size={14} /> Security Protocols
                        </h3>
                        
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-3xl">
                            <div>
                                <p className="text-xs font-black dark:text-white uppercase">Maintenance Mode</p>
                                <p className="text-[9px] font-bold text-gray-500 mt-1 uppercase">Restrict Public Data Access</p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                                className={`w-14 h-8 rounded-full relative transition-colors ${settings.maintenanceMode ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-3xl">
                            <div>
                                <p className="text-xs font-black dark:text-white uppercase">Enrollment Portal</p>
                                <p className="text-[9px] font-bold text-gray-500 mt-1 uppercase">Allow New Identity Creation</p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setSettings({...settings, registrationOpen: !settings.registrationOpen})}
                                className={`w-14 h-8 rounded-full relative transition-colors ${settings.registrationOpen ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${settings.registrationOpen ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </section>

                    <section className="glass p-10 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-xl space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                            <Zap size={14} /> Neural Overrides
                        </h3>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">AI Daily Quota</label>
                            <input 
                                type="number" 
                                value={settings.aiDailyCredits}
                                onChange={(e) => setSettings({...settings, aiDailyCredits: parseInt(e.target.value)})}
                                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-red-500 rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all dark:text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Active Semester</label>
                            <select 
                                value={settings.currentSemester}
                                onChange={(e) => setSettings({...settings, currentSemester: parseInt(e.target.value)})}
                                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-red-500 rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all dark:text-white"
                            >
                                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                            </select>
                        </div>
                    </section>
                </div>

                {/* 3. GLOBAL BANNER */}
                <section className="glass p-10 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-xl space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                        <Globe size={14} /> System-Wide Announcement Bar
                    </h3>
                    <textarea 
                        rows="2"
                        placeholder="Active emergency alerts or maintenance notices..."
                        value={settings.globalAlert}
                        onChange={(e) => setSettings({...settings, globalAlert: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-red-500 rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all dark:text-white resize-none"
                    ></textarea>
                </section>

                <div className="flex justify-end pt-4">
                    <button 
                        type="submit"
                        disabled={isSaving}
                        className="px-12 py-5 bg-red-600 text-white rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-red-500 shadow-2xl shadow-red-500/30 transition-all flex items-center gap-3 disabled:bg-gray-400"
                    >
                        <Save size={20} /> {isSaving ? 'Synchronizing...' : 'Apply Global Configuration'}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default AdminSystemSettings;
