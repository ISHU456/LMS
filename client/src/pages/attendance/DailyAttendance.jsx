import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useMFA } from '../../modules/mfa/MFAContext';
import FaceCamera from '../../modules/mfa/components/FaceCamera';
import LocationCheck from '../../modules/mfa/components/LocationCheck';
import BlinkCheck from '../../modules/mfa/components/BlinkCheck';
import { CheckCircle, AlertCircle, Clock, LogIn, LogOut, ShieldCheck, MapPin, Calendar, X } from 'lucide-react';

const DailyAttendance = () => {
    const navigate = useNavigate();
    const { mfaState, completeStep, resetMFA, setVerificationStep } = useMFA();
    
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState(null); // 'entry' or 'exit'
    const [showVerification, setShowVerification] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const userStr = localStorage.getItem('user');
            const token = userStr ? JSON.parse(userStr).token : null;
            const res = await axios.get('http://localhost:5001/api/attendance/daily/status', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const startAttendance = (type) => {
        resetMFA();
        setMode(type);
        setVerificationStep('liveness'); // Set liveness to start the flow
        setShowVerification(true);
        setError(null);
    };

    useEffect(() => {
        if (showVerification && mfaState.verificationStep === 'verifying') {
            submitAttendance();
        }
    }, [mfaState.verificationStep]);

    const submitAttendance = async () => {
        setVerifying(true);
        setError(null);
        try {
            const userStr = localStorage.getItem('user');
            const token = userStr ? JSON.parse(userStr).token : null;

            const url = mode === 'entry' 
                ? 'http://localhost:5001/api/attendance/daily/entry' 
                : 'http://localhost:5001/api/attendance/daily/exit';

            const response = await axios.post(url, {
                descriptor: Array.from(mfaState.faceDescriptor || []),
                location: mfaState.location
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 201 || response.status === 200) {
                setShowVerification(false);
                fetchStatus();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
            setVerifying(false);
        }
    };

    if (loading) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div></div>;

    return (
        <div className="flex-grow flex flex-col p-4 sm:p-6 bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] overflow-y-auto min-h-0 transition-colors duration-500">
            <div className="max-w-4xl mx-auto w-full space-y-8 py-8">
                
                {/* Header Card */}
                <div className="bg-white/70 dark:bg-[#080c14]/70 backdrop-blur-xl rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-xl border border-slate-200 dark:border-slate-800/60 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:bg-primary-500/10" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl">
                                    <ShieldCheck size={20} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Institutional Protocol</span>
                            </div>
                            <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">
                                Daily Attendance
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
                                <Calendar size={16} /> {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="px-6 py-4 bg-slate-50/50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-slate-800/60">
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Status Today</p>
                                <p className={`text-lg font-black uppercase ${status?.attendance?.status === 'present' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {status?.attendance?.status || 'Not Started'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {!showVerification ? (
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Entry Card */}
                    <div className={`p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] border transition-all duration-500 backdrop-blur-xl ${status?.attendance?.entry?.time ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/70 dark:bg-[#080c14]/70 border-slate-200 dark:border-slate-800/60 hover:shadow-2xl'}`}>
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-8">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${status?.attendance?.entry?.time ? 'bg-emerald-500 text-white' : 'bg-primary-500 text-white'}`}>
                                    <LogIn size={28} />
                                </div>
                                {status?.attendance?.entry?.time && (
                                    <div className="px-4 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        Completed
                                    </div>
                                )}
                            </div>
                            
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase mb-2 tracking-tight">Morning Entry</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                                Secure your institutional presence between 10:00 AM and 05:00 PM. Requires Face Identification and GPS proximity.
                            </p>
                            
                            <div className="mt-auto">
                                {status?.attendance?.entry?.time ? (
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                                        <Clock size={16} /> Marked at {new Date(status.attendance.entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => startAttendance('entry')}
                                        className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-primary-500/20 active:scale-95"
                                    >
                                        Seal Entry
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Exit Card */}
                    <div className={`p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] border transition-all duration-500 backdrop-blur-xl ${status?.attendance?.exit?.time ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/70 dark:bg-[#080c14]/70 border-slate-200 dark:border-slate-800/60 hover:shadow-2xl'}`}>
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-8">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${status?.attendance?.exit?.time ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-slate-800 text-gray-400'}`}>
                                    <LogOut size={28} />
                                </div>
                                {status?.attendance?.exit?.time && (
                                    <div className="px-4 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        Completed
                                    </div>
                                )}
                            </div>
                            
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase mb-2 tracking-tight">Institutional Exit</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                                Terminal presence verification. Must be completed after Entry and before 05:00 PM for full day credit.
                            </p>
                            
                            <div className="mt-auto">
                                {status?.attendance?.exit?.time ? (
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                                        <Clock size={16} /> Marked at {new Date(status.attendance.exit.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                ) : (
                                    <button 
                                        disabled={!status?.attendance?.entry?.time}
                                        onClick={() => startAttendance('exit')}
                                        className={`w-full py-4 font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg active:scale-95 ${status?.attendance?.entry?.time ? 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-black shadow-black/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-gray-700/50'}`}
                                    >
                                        Seal Exit
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 shadow-2xl border border-gray-100 dark:border-gray-800 relative">
                     <button onClick={() => setShowVerification(false)} className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <X size={24} />
                     </button>
                     
                     <div className="text-center mb-10">
                        <div className="mx-auto w-20 h-20 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary-500/5">
                            <ShieldCheck size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">Biometric Verification</h2>
                        <p className="text-gray-500 font-medium font-black uppercase tracking-widest text-[10px]">Authenticating identity and location for {mode} log.</p>
                     </div>

                     <div className="max-w-md mx-auto">
                        {!error && !verifying && (
                            <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-[2rem] border border-gray-100 dark:border-gray-700">
                                {mfaState.verificationStep === 'liveness' && <BlinkCheck />}
                                {mfaState.verificationStep === 'face' && <FaceCamera />}
                                {mfaState.verificationStep === 'location' && <LocationCheck />}
                            </div>
                        )}

                        {verifying && (
                            <div className="flex flex-col items-center py-12">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mb-6"></div>
                                <p className="text-gray-600 dark:text-gray-400 font-black uppercase tracking-widest animate-pulse">Synchronizing Node...</p>
                            </div>
                        )}

                        {error && (
                            <div className="text-center py-10 animate-shake">
                                <div className="bg-red-100 dark:bg-red-900/20 text-red-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/5">
                                    <AlertCircle size={40} />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase mb-4 tracking-tight">Security Block</h2>
                                <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 text-red-600 text-sm mb-10 font-bold uppercase tracking-wide">
                                    {error}
                                </div>
                                <button 
                                    onClick={() => {
                                        resetMFA();
                                        setError(null);
                                        setVerifying(false);
                                    }}
                                    className="w-full bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl transition-all active:scale-95"
                                >
                                    Retry Authentication
                                </button>
                            </div>
                        )}
                        
                        {!error && !verifying && (
                            <div className="mt-12 flex items-center justify-between px-4">
                               <Step num={1} label="Liveness" active={mfaState.verificationStep === 'liveness'} />
                               <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800 mx-4" />
                               <Step num={2} label="Biometric" active={mfaState.verificationStep === 'face'} />
                               <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800 mx-4" />
                               <Step num={3} label="GPS Grid" active={mfaState.verificationStep === 'location'} />
                            </div>
                        )}
                     </div>
                  </div>
                )}
            </div>
        </div>
    );
};

const Step = ({ num, label, active }) => (
    <div className="flex flex-col items-center gap-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-500 ${active ? 'bg-primary-600 text-white scale-125 shadow-lg shadow-primary-500/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}>
            {num}
        </div>
        <span className={`text-[9px] uppercase font-black tracking-widest transition-colors duration-500 ${active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>
            {label}
        </span>
    </div>
);

export default DailyAttendance;
