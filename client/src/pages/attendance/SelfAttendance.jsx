import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useMFA } from '../../modules/mfa/MFAContext';
import FaceCamera from '../../modules/mfa/components/FaceCamera';
import LocationCheck from '../../modules/mfa/components/LocationCheck';
import BlinkCheck from '../../modules/mfa/components/BlinkCheck';
import { CheckCircle, AlertCircle, MapPin, ClipboardCheck, ArrowLeft } from 'lucide-react';

const SelfAttendance = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { mfaState, completeStep, resetMFA, setVerificationStep } = useMFA();
    
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [step, setStep] = useState('liveness'); // liveness -> face -> location -> finish

    useEffect(() => {
        resetMFA();
        setVerificationStep('liveness'); // Start with liveness
    }, [courseId]);

    useEffect(() => {
        if (mfaState.verificationStep === 'verifying') {
            submitAttendance();
        }
    }, [mfaState.verificationStep]);

    const submitAttendance = async () => {
        setVerifying(true);
        setError(null);
        try {
            const userStr = localStorage.getItem('user');
            const token = userStr ? JSON.parse(userStr).token : null;

            const response = await axios.post('/api/mfa/mark-attendance', {
                courseId,
                descriptor: mfaState.faceDescriptor,
                location: mfaState.location
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 201) {
                setSuccess(true);
                setTimeout(() => navigate('/dashboard'), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Attendance verification failed');
            setVerifying(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 min-h-screen">
            <button 
                onClick={() => navigate(-1)} 
                className="absolute top-24 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>

            <div className="w-full max-w-md bg-white/80 dark:bg-[#080c14]/80 backdrop-blur-3xl rounded-[3.5rem] shadow-2xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800/60 overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                <header className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                        <ClipboardCheck className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white">Smart Attendance</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Course ID: <span className="font-mono text-blue-600 font-bold uppercase">{courseId.slice(-6)}</span></p>
                </header>

                <div className="space-y-6">
                    {!success && !error && !verifying && (
                        <>
                            {mfaState.verificationStep === 'liveness' && <BlinkCheck />}
                            {mfaState.verificationStep === 'face' && <FaceCamera />}
                            {mfaState.verificationStep === 'location' && <LocationCheck />}
                        </>
                    )}

                    {verifying && (
                        <div className="flex flex-col items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                            <p className="text-slate-600 font-bold animate-pulse">Syncing Biometric Grid...</p>
                        </div>
                    )}

                    {success && (
                        <div className="text-center py-10 animate-scale-up">
                            <div className="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/10">
                                <CheckCircle className="w-12 h-12" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Verified & Logged</h2>
                            <p className="text-slate-500">Your attendance for today has been securely recorded.</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-10 animate-shake">
                            <div className="bg-red-100 text-red-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/10">
                                <AlertCircle className="w-12 h-12" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Verification Error</h2>
                            <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm mb-6 font-medium">
                                {error}
                            </div>
                            <button 
                                onClick={() => {
                                    resetMFA();
                                    setError(null);
                                    setVerifying(false);
                                }}
                                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl transition-all"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>

                {!success && !error && (
                    <div className="mt-10 flex items-center justify-between px-2">
                        <div className="flex flex-col items-center gap-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${mfaState.verificationStep === 'liveness' ? 'bg-blue-600 text-white scale-125' : 'bg-slate-100 text-slate-400'}`}>1</div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">Life</span>
                        </div>
                        <div className="flex-1 h-px bg-slate-100 mx-2"></div>
                        <div className="flex flex-col items-center gap-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${mfaState.verificationStep === 'face' ? 'bg-blue-600 text-white scale-125' : 'bg-slate-100 text-slate-400'}`}>2</div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">Face</span>
                        </div>
                        <div className="flex-1 h-px bg-slate-100 mx-2"></div>
                        <div className="flex flex-col items-center gap-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${mfaState.verificationStep === 'location' ? 'bg-blue-600 text-white scale-125' : 'bg-slate-100 text-slate-400'}`}>3</div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">GPS</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SelfAttendance;
