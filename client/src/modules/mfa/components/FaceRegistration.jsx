import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import axios from 'axios';
import { loadModels } from '../utils/faceUtils';
import { Camera, CheckCircle, Smartphone, MapPin, UserCheck, ShieldCheck, ScanText, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../../features/auth/authSlice';

const FaceRegistration = () => {
    const webcamRef = useRef(null);
    const { user } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(true);
    const [captures, setCaptures] = useState([]);
    const [complete, setComplete] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const REQUIRED_CAPTURES = 5;

    useEffect(() => {
        let isMounted = true;
        loadModels().then((success) => {
            if (isMounted) {
                if (!success) setError("Critical Failure: Face Recognition Models could not be initialized.");
                setLoading(false);
            }
        });
        return () => { isMounted = false; };
    }, []);

    const captureSample = async () => {
        if (!webcamRef.current || !webcamRef.current.video) return;
        
        const video = webcamRef.current.video;
        if (video.readyState !== 4) {
            setError("Camera not ready. Please wait.");
            return;
        }

        setError(null);
        try {
            const detection = await faceapi.detectSingleFace(
                video, 
                new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
            )
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {
                const descriptor = Array.from(detection.descriptor);
                setCaptures(prev => {
                    const updated = [...prev, descriptor];
                    if (updated.length >= REQUIRED_CAPTURES) {
                        setComplete(true);
                        // AUTO-FINALIZE for persistence
                        setTimeout(() => handleRegister(updated), 500);
                    }
                    return updated;
                });
            } else {
                setError("Face not detected. Ensure your face is centered and well-lit.");
            }
        } catch (err) {
            console.error("Detection error:", err);
            setError("Analysis failed. Try adjusting your position.");
        }
    };

    const handleRegister = async (passedDescriptors = null) => {
        const finalDescriptors = passedDescriptors || captures;
        if (submitting || finalDescriptors.length < REQUIRED_CAPTURES) return;
        
        setSubmitting(true);
        try {
            await axios.post('/api/mfa/register-face', 
                { descriptors: finalDescriptors },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            
            // Re-fetch user profile to sync all data (including faceRegistered)
            const profileResponse = await axios.get('/api/auth/profile', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            
            // Sync Redux Store and State
            dispatch(updateProfile({ ...profileResponse.data, faceRegistered: true }));
            
            setSubmitting(false);
            setComplete(true);
            
            // ROLE-AWARE REDIRECT
            setTimeout(() => {
                const role = profileResponse.data?.role || user?.role;
                if (role === 'admin') navigate('/admin-dashboard');
                else if (role === 'student') navigate('/dashboard');
                else if (role === 'teacher' || role === 'hod' || role === 'faculty') navigate('/faculty-dashboard');
                else navigate('/');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed");
            setSubmitting(false);
        }
    };

    if (complete) {
        return (
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-lg border border-slate-100 flex flex-col items-center gap-6 animate-scale-up">
                <div className={`w-28 h-28 ${submitting ? 'bg-blue-100 text-blue-600 animate-pulse' : 'bg-green-100 text-green-600'} rounded-full flex items-center justify-center`}>
                    {submitting ? <ShieldCheck className="w-14 h-14" /> : <CheckCircle className="w-14 h-14 animate-bounce-subtle" />}
                </div>
                <div className="space-y-3">
                   <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">
                       {submitting ? 'Securing Profile...' : 'Identity Activated'}
                   </h2>
                   <p className="text-slate-500 text-sm font-medium leading-relaxed">
                       {submitting ? 'The Neural Engine is encrypting your biometric signatures. Do not close this tab.' : 'Your biometric data is successfully synced. You will now be redirected to the Neural Gateway.'}
                   </p>
                </div>
                
                {submitting && (
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-blue-600 animate-shrink" style={{ transitionDuration: '5000ms' }}></div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 flex flex-col md:flex-row gap-8 animate-fade-in transition-all">
            <div className="flex-1">
                <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-100 border-4 border-slate-100 shadow-inner group">
                    <Webcam 
                        ref={webcamRef} 
                        mirrored={true}
                        className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                         <div className="w-4/5 h-4/5 border-2 border-dashed border-white/50 rounded-full animate-pulse flex items-center justify-center">
                            <ScanText className="w-12 h-12 text-white/30" />
                         </div>
                    </div>
                    {loading && (
                        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center backdrop-blur-sm z-10">
                            <div className="flex flex-col items-center gap-4">
                                <div className="animate-spin h-10 w-10 border-4 border-white/30 border-t-white rounded-full"></div>
                                <span className="text-white text-xs font-black uppercase tracking-widest">Warming Up Neural Engine...</span>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="mt-8 flex gap-2 justify-center">
                    {Array.from({ length: REQUIRED_CAPTURES }).map((_, i) => (
                        <div key={i} className={`h-1.5 w-full rounded-full transition-all duration-500 ${i < captures.length ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                    ))}
                </div>
                
                <div className="mt-6 flex flex-col gap-3">
                    <button 
                        onClick={captureSample}
                        disabled={loading || complete}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 group active:scale-95"
                    >
                        <Camera className={`w-5 h-5 group-hover:rotate-12 transition-transform`} />
                        Capture Biometric Sample ({captures.length}/{REQUIRED_CAPTURES})
                    </button>
                    {error && <p className="text-red-500 text-sm text-center font-medium animate-pulse">! {error}</p>}
                </div>
            </div>

            <div className="flex-1 space-y-6 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Enrollment Details</h3>
                    <p className="text-xl font-bold text-slate-800">Secure Identity Enrollment</p>
                </div>
                
                {[ 
                    { icon: ShieldCheck, label: "Neural Mapping", desc: "Hashing 128 unique facial vectors" },
                    { icon: Smartphone, label: "Multi-Model", desc: "Cross-component liveness verification" },
                    { icon: MapPin, label: "Geographical Bind", desc: "Attendance locked to GPS coordinates" }
                ].map((item, i) => (
                    <div key={i} className="flex gap-4 items-start p-4 hover:bg-slate-50 rounded-2xl transition-colors cursor-default">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><item.icon className="w-5 h-5" /></div>
                        <div>
                             <h4 className="font-bold text-slate-700 text-sm leading-none mb-1">{item.label}</h4>
                             <p className="text-xs text-slate-500 leading-tight">{item.desc}</p>
                        </div>
                    </div>
                ))}

                <div className="mt-auto p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 italic">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-[10px] text-amber-700 font-medium">Please avoid hats, tinted glasses, or extreme backlighting for better biometric precision.</p>
                </div>
            </div>
        </div>
    );
};

export default FaceRegistration;
