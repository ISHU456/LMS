import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Shield, Globe, Lock, Unlock, Zap, Building2, Calendar, RefreshCw, Server, Users, Settings2, ShieldAlert, Check, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const THEMES = [
    { id: 'academic', name: 'Classic Academic (Paper/Slate)', light: '#FDFBF7', dark: '#0f172a' },
    { id: 'indigo', name: 'Indigo Fusion (Slate/Obsidian)', light: '#F0F4F8', dark: '#0B0E14' },
    { id: 'nature', name: 'Nature\'s Breath (Mint/Forest)', light: '#F0FDF4', dark: '#052E16' },
    { id: 'amethyst', name: 'Royal Amethyst (Lavender/Midnight)', light: '#F5F3FF', dark: '#1E1B4B' },
    { id: 'sunset', name: 'Sunset Horizon (Rose/Burgundy)', light: '#FFF1F2', dark: '#450A0A' },
    { id: 'ocean', name: 'Ocean Deep (Sky/Sea)', light: '#F0F9FF', dark: '#082F49' },
    { id: 'cyber', name: 'Cyber Gold (Lemon/Bronze)', light: '#FEFCE8', dark: '#1A1600' }
];

const AdminSystemSettings = ({ user }) => {
    const [settings, setSettings] = useState({
        institutionName: '',
        academicYear: '',
        currentSemester: 1,
        maintenanceMode: false,
        registrationOpen: true,
        allowSelfRegistration: true,
        aiDailyCredits: 10,
        facultyNeuralCredit: 8,
        globalAlert: '',
        teacherSignupAllowed: true,
        autoApproveTeachers: false
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setIsLoading(true);
                const res = await axios.get('http://localhost:5001/api/admin/settings', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setSettings(prev => ({ ...prev, ...res.data }));
            } catch (err) {
                console.error("Failed to load environment variables", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [user]);

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            await axios.put('http://localhost:5001/api/admin/settings', settings, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) {
            alert('Failed to synchronize system parameters.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div className="h-96 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[4rem] border border-white/10">
            <RefreshCw className="text-indigo-500 animate-spin mb-6" size={48} />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic">Querying Environment Hub...</p>
        </div>
    );

    return (
        <div className="max-w-[1800px] mx-auto space-y-16 pb-32">
            {/* Success Toast */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }} 
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }} 
                        exit={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
                        className="fixed bottom-12 right-12 z-[100] bg-indigo-600 text-white px-10 py-6 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(79,70,229,0.5)] flex items-center gap-5 border border-white/20 backdrop-blur-xl"
                    >
                        <ShieldAlert size={24} />
                        <span className="text-[12px] font-black uppercase tracking-[0.2em]">Global Protocol Synchronized Across Lattice</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl p-8 lg:p-12 rounded-3xl border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] group overflow-hidden relative ring-1 ring-black/5">
                <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                    <Shield size={300} className="text-indigo-500" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-700 relative overflow-hidden">
                        <Settings2 size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-1 bg-indigo-500 rounded-full" />
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-500 italic block">System Core v2.4.0</span>
                        </div>
                        <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">System Configuration</h2>
                        <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 italic flex items-center gap-2">
                           <Server size={10} className="text-indigo-500" /> Master Administrative Control Authority
                        </p>
                    </div>
                </div>

                <div className="relative z-10 mt-8 xl:mt-0 flex gap-4">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-14 px-8 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-slate-950 transition-all flex items-center gap-3 disabled:opacity-50 group active:scale-95"
                    >
                        {isSaving ? <RefreshCw className="animate-spin" size={18}/> : <Save className="group-hover:rotate-12 transition-transform" size={18} />}
                        {isSaving ? 'Synching...' : 'Authorize Global protocol'}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* 1. IDENTITY & ACADEMIC LATTICE */}
                <motion.section 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 shadow-xl space-y-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><Building2 size={16} /></div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Institutional Identity</h3>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2 italic">Academy Full Name</label>
                            <input 
                                type="text" 
                                value={settings.institutionName}
                                onChange={(e) => setSettings({...settings, institutionName: e.target.value})}
                                className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-tight outline-none transition-all dark:text-white shadow-inner"
                                placeholder="Enter University/College Name..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2 italic">Academic Cycle</label>
                                <div className="relative group">
                                    <select 
                                        value={settings.academicYear}
                                        onChange={(e) => setSettings({...settings, academicYear: e.target.value})}
                                        className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-indigo-500/30 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest outline-none transition-all dark:text-white appearance-none cursor-pointer shadow-inner"
                                    >
                                        <option value="2024-25">2024-25 Cycle</option>
                                        <option value="2025-26">2025-26 Cycle</option>
                                        <option value="2026-27">2026-27 Cycle</option>
                                    </select>
                                    <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" size={12} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2 italic">Active Semester</label>
                                <div className="relative group">
                                    <select 
                                        value={settings.currentSemester}
                                        onChange={(e) => setSettings({...settings, currentSemester: parseInt(e.target.value)})}
                                        className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-indigo-500/30 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest outline-none transition-all dark:text-white appearance-none cursor-pointer shadow-inner"
                                    >
                                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Node {s}</option>)}
                                    </select>
                                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* 2. SECURITY & ACCESS OVERRIDE */}
                <motion.section 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 shadow-xl space-y-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center"><Lock size={16} /></div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Security & Neural Protocols</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <ProtocolToggle 
                            label="Maintenance Lockdown" 
                            detail="Restrict public and user access to the academic grid"
                            active={settings.maintenanceMode}
                            color="rose"
                            onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                        />
                        <ProtocolToggle 
                            label="Enrollment Gateway" 
                            detail="Allow new student identity registrations"
                            active={settings.registrationOpen}
                            color="indigo"
                            onClick={() => setSettings({...settings, registrationOpen: !settings.registrationOpen})}
                        />
                        <ProtocolToggle 
                            label="Faculty Entry Point" 
                            detail="Allow teachers to apply for sectoral clearance"
                            active={settings.teacherSignupAllowed}
                            color="violet"
                            onClick={() => setSettings({...settings, teacherSignupAllowed: !settings.teacherSignupAllowed})}
                        />
                        <ProtocolToggle 
                            label="Autonomous Induction" 
                            detail="Auto-Approve all new faculty applications (CAUTION)"
                            active={settings.autoApproveTeachers}
                            color="amber"
                            onClick={() => setSettings({...settings, autoApproveTeachers: !settings.autoApproveTeachers})}
                        />
                    </div>
                </motion.section>

                {/* 3. NEURAL PARAMETERS */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 shadow-xl space-y-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center"><Zap size={16} /></div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Neural Engine Configurations</h3>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-6 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner group">
                            <div>
                                <p className="text-xs font-black dark:text-white uppercase tracking-tighter">AI Daily Interaction Quota</p>
                                <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">Credits allocated daily</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="number" 
                                    value={settings.aiDailyCredits}
                                    onChange={(e) => setSettings({...settings, aiDailyCredits: parseInt(e.target.value) || 0})}
                                    className="w-20 bg-white dark:bg-slate-900 border-2 border-indigo-500/20 focus:border-indigo-500 rounded-xl px-3 py-2 text-base font-black text-center outline-none transition-all dark:text-white shadow-lg"
                                />
                                <span className="text-[8px] font-black text-indigo-500 uppercase">XP/UNIT</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-6 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl border border-indigo-500/10 shadow-inner group">
                            <div>
                                <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">Faculty Neural Weight</p>
                                <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase tracking-widest italic">Synchronized Faculty Focus Credits</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="number" 
                                    value={settings.facultyNeuralCredit}
                                    onChange={(e) => setSettings({...settings, facultyNeuralCredit: parseInt(e.target.value) || 0})}
                                    className="w-20 bg-white dark:bg-slate-900 border-2 border-indigo-500/20 focus:border-indigo-500 rounded-xl px-3 py-2 text-base font-black text-center outline-none transition-all dark:text-white shadow-lg"
                                />
                                <span className="text-[8px] font-black text-indigo-500 uppercase">CRD/NODE</span>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* 4. THEME AESTHETICS */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 shadow-xl space-y-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><Palette size={16} /></div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Interface Aesthetics</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                        <div className="flex flex-col p-6 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner group">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs font-black dark:text-white uppercase tracking-tighter">Institutional Aesthetic Themes</p>
                                    <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">Unified color palettes for all visual modes</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: settings.lightModeBgColor }} title="Current Light" />
                                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: settings.darkModeBgColor }} title="Current Dark" />
                                </div>
                            </div>
                            
                            <div className="relative group">
                                <select 
                                    onChange={(e) => {
                                        const theme = THEMES.find(t => t.id === e.target.value);
                                        if (theme) {
                                            setSettings({
                                                ...settings, 
                                                lightModeBgColor: theme.light, 
                                                darkModeBgColor: theme.dark
                                            });
                                            document.documentElement.style.setProperty('--bg-light', theme.light);
                                            document.documentElement.style.setProperty('--bg-dark', theme.dark);
                                        }
                                    }}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none transition-all dark:text-white appearance-none cursor-pointer shadow-sm focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="">Select Integrated Theme Palette...</option>
                                    {THEMES.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <Palette className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            </div>
                            
                            <p className="text-[7px] font-black text-indigo-500 uppercase tracking-widest mt-4 italic">* Selecting a theme updates both Light and Dark mode parameters synchronously.</p>
                        </div>
                    </div>
                </motion.section>

                {/* 5. GLOBAL BROADCAST BANNER */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 shadow-xl space-y-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center"><Globe size={16} /></div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Sector-Wide Emergency Banner</h3>
                    </div>
                    
                    <div className="relative">
                        <textarea 
                            rows="3"
                            placeholder="INITIATE EMERGENCY PROTOCOL BROADCAST..."
                            value={settings.globalAlert}
                            onChange={(e) => setSettings({...settings, globalAlert: e.target.value})}
                            className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-rose-500/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-6 py-6 text-[10px] font-black uppercase tracking-widest outline-none transition-all dark:text-red-400 resize-none shadow-inner leading-relaxed placeholder:opacity-30"
                        ></textarea>
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-4 italic">* High-priority alerts appear at the crown of dashboards.</p>
                </motion.section>
            </div>
        </div>
    );
};

const ProtocolToggle = ({ label, detail, active, onClick, color }) => {
    const activeColors = {
        rose: 'bg-rose-600 shadow-rose-600/30 border-rose-400/50',
        indigo: 'bg-indigo-600 shadow-indigo-600/30 border-indigo-400/50',
        violet: 'bg-violet-600 shadow-violet-600/30 border-violet-400/50',
        amber: 'bg-amber-600 shadow-amber-600/30 border-amber-400/50'
    };

    return (
        <div className="flex items-center justify-between p-6 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner transition-all hover:bg-white/50 dark:hover:bg-slate-900 group">
            <div className="max-w-[70%]">
                <p className="text-xs font-black dark:text-white uppercase tracking-tighter group-hover:text-indigo-500 transition-colors">{label}</p>
                <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">{detail}</p>
            </div>
            <button 
                type="button"
                onClick={onClick}
                className={`w-12 h-7 rounded-full relative border-2 transition-all duration-500 ${active ? activeColors[color] : 'bg-slate-200 dark:bg-slate-800/80 border-slate-300 dark:border-white/10'}`}
            >
                <motion.div 
                    animate={{ x: active ? 22 : 2 }}
                    className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center"
                >
                    {active ? <Check size={8} className={`text-${color}-600`} /> : <RefreshCw size={8} className="text-slate-400" />}
                </motion.div>
            </button>
        </div>
    );
};

export default AdminSystemSettings;
