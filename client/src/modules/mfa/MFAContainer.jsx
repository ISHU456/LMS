import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useMFA } from './MFAContext';
import BlinkCheck from './components/BlinkCheck';
import FaceCamera from './components/FaceCamera';
import LocationCheck from './components/LocationCheck';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from '../../features/auth/authSlice';
import { ShieldCheck, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

const MFAContainer = () => {
    const { mfaState, resetMFA, restartMFA } = useMFA();
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        if (mfaState.verificationStep === 'verifying') {
            onVerify();
        }
    }, [mfaState.verificationStep]);

    const onVerify = async () => {
        setVerifying(true);
        setError(null);
        try {
            const response = await axios.post('/api/mfa/verify', {
                tempToken: mfaState.tempToken,
                descriptor: mfaState.faceDescriptor,
                location: mfaState.location
            });

            if (response.data.token) {
                // IMPORTANT: Update both LocalStorage and Redux Store
                localStorage.setItem('user', JSON.stringify(response.data));
                dispatch(updateProfile(response.data));
                
                setSuccess(true);
                setTimeout(() => {
                   const role = response.data.role;
                   if (role === 'admin') navigate('/admin-dashboard');
                   else if (role === 'student') navigate('/dashboard');
                   else navigate('/faculty-dashboard');
                   
                   resetMFA();
                }, 1500);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Biometric Identity Not Authorized';
            setError(`[ ACCESS DENIED ] - ${errorMsg}`);
            setVerifying(false);
            
            // Automatic retry after 2 seconds as requested (Restart progress but keep session)
            setTimeout(() => {
                setError(null);
                restartMFA(); 
            }, 2000);
        }
    };

    return (
        <div className="relative overflow-hidden glass rounded-[3rem] shadow-2xl w-full max-w-lg border border-white/20 dark:border-gray-800/60 flex flex-col items-center min-h-[500px] backdrop-blur-3xl transition-all duration-500 hover:shadow-primary-500/10">
            {/* Red Error Overlay Popup */}
            {error && (
                <div className="absolute inset-x-0 top-0 z-[60] animate-slide-down">
                    <div className="bg-red-600/95 backdrop-blur-md text-white p-4 flex items-center justify-center gap-3 shadow-2xl">
                        <ShieldAlert className="w-6 h-6 animate-pulse" />
                        <span className="font-black text-xs uppercase tracking-[0.2em]">{error}</span>
                    </div>
                </div>
            )}

            <div className={`mt-10 mb-6 p-6 rounded-[2rem] shadow-2xl transition-all duration-500 border ${success ? 'bg-emerald-500/10 border-emerald-500/30 ring-4 ring-emerald-500/10' : error ? 'bg-rose-500/10 border-rose-500/30 ring-4 ring-rose-500/10 animate-shake' : 'bg-primary-500/10 border-primary-500/30 ring-4 ring-primary-500/10'}`}>
                {success ? <CheckCircle2 className="w-12 h-12 text-emerald-500" /> : error ? <ShieldAlert className="w-12 h-12 text-rose-500" /> : <ShieldCheck className="w-12 h-12 text-primary-500 animate-pulse" />}
            </div>

            <h2 className="text-3xl font-black mb-2 text-gray-900 dark:text-white text-center tracking-tighter uppercase">Biometric Verification</h2>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-primary-600 dark:text-primary-400 mb-8 px-4 py-1 rounded-full bg-primary-500/10 border border-primary-500/20">Authentication Required</p>
            
            <div className="w-full flex justify-center flex-col items-center">
                {mfaState.verificationStep === 'liveness' && <BlinkCheck />}
                {mfaState.verificationStep === 'face' && <FaceCamera />}
                {mfaState.verificationStep === 'location' && <LocationCheck />}
                {mfaState.verificationStep === 'verifying' && (
                    <div className="flex flex-col items-center py-10 transition-all">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-6"></div>
                        <p className="text-blue-700 font-semibold text-lg animate-pulse tracking-wide">Finalizing Secure Session...</p>
                    </div>
                )}
                {success && (
                    <div className="text-center py-10 text-green-600 space-y-3">
                        <p className="text-2xl font-bold animate-fade-in">Identity Verified!</p>
                        <p className="text-sm opacity-70">Redirecting to Dashboard...</p>
                    </div>
                )}
                {(error || mfaState.verificationStep === 'failed') && (
                    <div className="text-center py-10 space-y-6">
                        <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-red-600 font-medium">
                            {error || mfaState.error || 'Identity Verification Interrupted'}
                        </div>
                        <button 
                            onClick={restartMFA}
                            className="bg-neutral-800 hover:bg-neutral-900 text-white px-8 py-3 rounded-full transition-all hover:shadow-lg font-bold shadow-xl shadow-red-500/10"
                        >
                            Retry Verification
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-auto mb-10 w-full px-12">
                <div className="flex justify-between items-center relative">
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-100 dark:bg-gray-800 -z-10 -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-0 h-[2px] bg-primary-500 -z-10 -translate-y-1/2 transition-all duration-700" style={{ width: mfaState.verificationStep === 'liveness' ? '0%' : mfaState.verificationStep === 'face' ? '50%' : '100%' }}></div>
                    
                    <div className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] transition-all shadow-lg ${mfaState.verificationStep === 'liveness' || mfaState.verificationStep === 'face' || mfaState.verificationStep === 'location' || mfaState.verificationStep === 'verifying' ? 'bg-primary-500 text-white border-2 border-white dark:border-dark-bg' : 'bg-white dark:bg-dark-card border-2 border-gray-200 dark:border-gray-700 text-gray-400'}`}>1</div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Liveness</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] transition-all shadow-lg ${mfaState.verificationStep === 'face' || mfaState.verificationStep === 'location' || mfaState.verificationStep === 'verifying' ? 'bg-primary-500 text-white border-2 border-white dark:border-dark-bg' : 'bg-white dark:bg-dark-card border-2 border-gray-200 dark:border-gray-700 text-gray-400'}`}>2</div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Facial</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] transition-all shadow-lg ${mfaState.verificationStep === 'location' || mfaState.verificationStep === 'verifying' ? 'bg-primary-500 text-white border-2 border-white dark:border-dark-bg' : 'bg-white dark:bg-dark-card border-2 border-gray-200 dark:border-gray-700 text-gray-400'}`}>3</div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Location</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MFAContainer;
