import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Image as ImageIcon, Upload, Loader2, 
    Maximize, ShieldCheck, Zap, 
    Calendar, Target, Search, FileImage
} from 'lucide-react';

const Schedule = ({ 
    courseId, 
    isTeacher, 
    user, 
    timetableImageUrl, 
    handleTimetableImageUpload, 
    handleDeleteTimetableImage,
    isUploadingImage 
}) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-[#030712] overflow-hidden">
            {/* Main Schematic Area */}
            <div className={`flex-1 relative overflow-hidden flex flex-col items-center justify-center transition-all ${isFullscreen ? 'fixed inset-0 z-[200] bg-black/95 p-4' : ''}`}>
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-500/10 via-transparent to-transparent"></div>
                </div>

                <div className="w-full h-full bg-white dark:bg-gray-900 border-none overflow-hidden relative group">
                    {timetableImageUrl ? (
                        <div className="w-full h-full relative cursor-default overflow-auto custom-scrollbar">
                            <img 
                                src={timetableImageUrl} 
                                alt="Master Timetable" 
                                className={`w-full h-full object-contain bg-white dark:bg-gray-950 transition-transform duration-700 ${isFullscreen ? 'scale-100' : 'hover:scale-105'}`} 
                            />
                            
                            <div className="absolute bottom-8 right-8 z-20 flex gap-4">
                                <button 
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    className="w-14 h-14 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-100 dark:border-gray-800 flex items-center justify-center shadow-2xl text-gray-900 dark:text-white hover:bg-primary-600 hover:text-white transition-all scale-90 group-hover:scale-100 opacity-0 group-hover:opacity-100"
                                >
                                    <Maximize size={24} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center space-y-8 p-20 text-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary-500/20 blur-[60px] animate-pulse"></div>
                                <div className="w-32 h-32 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center relative">
                                    <FileImage size={56} className="text-gray-300 dark:text-gray-700" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-300 dark:text-gray-800 uppercase tracking-tighter mb-2">Schematic Manifest Empty</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest max-w-xs mx-auto">The centralized timeline graphic has not been authorized for this course yet.</p>
                            </div>
                        </div>
                    )}

                    {/* Teacher Interaction Overlay */}
                    {isTeacher && (
                        <div className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-all duration-500 flex flex-col items-center justify-center p-12 text-center text-white gap-8 ${isUploadingImage || !timetableImageUrl ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-full group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto'}`}>
                            <div className="space-y-4">
                                <div className="w-20 h-20 bg-primary-600/30 border border-primary-500/50 flex items-center justify-center mx-auto mb-6 backdrop-blur-xl">
                                    <ShieldCheck size={32} />
                                </div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter">
                                    {isUploadingImage ? 'Syncing Repository...' : 'Schematic Control Module'}
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Admin Protocol: {courseId.toUpperCase()}-SCDL</p>
                            </div>

                            <div className="w-full max-w-md space-y-4">
                                {isUploadingImage ? (
                                    <div className="flex flex-col items-center gap-6">
                                        <Loader2 size={48} className="animate-spin text-white" />
                                        <div className="w-full bg-white/10 h-1 overflow-hidden">
                                            <motion.div 
                                                className="h-full bg-white" 
                                                initial={{ width: 0 }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        <input 
                                            type="file" 
                                            id="master-schematic-up" 
                                            className="hidden" 
                                            accept="image/*" 
                                            onChange={handleTimetableImageUpload} 
                                        />
                                        <label 
                                            htmlFor="master-schematic-up"
                                            className="px-10 py-5 bg-white text-gray-900 font-black text-xs uppercase tracking-[0.3em] hover:bg-primary-600 hover:text-white transition-all cursor-pointer shadow-2xl active:scale-95 flex items-center justify-center gap-4"
                                        >
                                            <Upload size={20} /> UPLOAD NEW SCHEMATIC
                                        </label>
                                        
                                        {timetableImageUrl && (
                                            <button 
                                                onClick={handleDeleteTimetableImage}
                                                className="px-10 py-5 bg-rose-600/20 text-rose-500 border border-rose-500/50 hover:bg-rose-600 hover:text-white font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl flex items-center justify-center gap-4"
                                            >
                                                <Target size={20} /> PURGE DATA SOURCE
                                            </button>
                                        )}
                                        <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Authorized Key Required • Auto-Logging Enabled</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Close Fullscreen */}
            {isFullscreen && (
               <button 
                 onClick={()=>setIsFullscreen(false)}
                 className="fixed top-8 right-8 z-[210] w-14 h-14 bg-white text-black flex items-center justify-center shadow-2xl hover:bg-primary-600 hover:text-white transition-all"
               >
                 <ShieldCheck size={24} />
               </button>
            )}
        </div>
    );
};

export default Schedule;
