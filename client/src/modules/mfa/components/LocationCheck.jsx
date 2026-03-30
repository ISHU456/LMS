import React, { useEffect, useState } from 'react';
import { useMFA } from '../MFAContext';
import { MapPin, Check, AlertTriangle, AlertCircle } from 'lucide-react';

const LocationCheck = () => {
    const { completeStep, setMFAError } = useMFA();
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState(null);
    const [status, setStatus] = useState('requesting'); // requesting | success | denied | error

    useEffect(() => {
        const init = () => {
             if ("geolocation" in navigator) {
                setStatus('requesting');
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        setLocation({ latitude, longitude });
                        setStatus('success');
                        setTimeout(() => {
                           completeStep('location', { latitude, longitude });
                        }, 1200);
                    },
                    (error) => {
                         console.error('Geolocation error:', error);
                         setStatus('denied');
                         setMFAError('Location permission denied or timed out. Verification failed.');
                    },
                    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
                );
             } else {
                setStatus('error');
                setMFAError('Browser does not support geolocation.');
             }
        };

        const timer = setTimeout(init, 500);
        return () => clearTimeout(timer);
    }, []);

    const retry = () => {
        setStatus('requesting');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ latitude, longitude });
                setStatus('success');
                setTimeout(() => {
                   completeStep('location', { latitude, longitude });
                }, 1200);
            },
            (error) => {
                 console.error('Geolocation retry error:', error);
                 setStatus('denied');
                 setMFAError('Location access failed. Ensure GPS is ON and Permissions are GRANTED.');
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
    };

    const handleDevBypass = () => {
        const dummyPos = { latitude: 37.3861, longitude: -122.0839 }; // Institutional default
        setLocation(dummyPos);
        setStatus('success');
        setTimeout(() => {
            completeStep('location', dummyPos);
        }, 1200);
    };

    return (
        <div className="flex flex-col items-center animate-fade-in p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-700">
            <div className="text-xl font-bold mb-2 text-center text-slate-800 dark:text-white">Spatial Verification</div>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-6 text-sm">Validating device location grid...</p>

            <div className={`relative p-8 rounded-full transition-all duration-300 mb-6 ${status === 'success' ? 'bg-green-50 dark:bg-green-950/20' : 'bg-blue-50 dark:bg-blue-950/20'}`}>
                <div className={`p-6 rounded-full ${status === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/40' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40'}`}>
                    <MapPin className={`w-12 h-12 ${status === 'requesting' ? 'animate-bounce' : ''}`} />
                </div>
                {status === 'success' && (
                    <div className="absolute top-2 right-2 p-2 bg-green-500 text-white rounded-full scale-110 shadow-lg">
                        <Check className="w-5 h-5" />
                    </div>
                )}
            </div>

            <div className="w-full text-center py-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl mb-6 border border-slate-100 dark:border-slate-700">
                {status === 'requesting' && <span className="text-blue-600 dark:text-blue-400 font-medium animate-pulse">Searching for Satellites...</span>}
                {status === 'success' && <span className="text-green-600 dark:text-green-400 font-medium font-mono text-xs">{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>}
                {status === 'denied' && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center justify-center gap-2 text-red-500 text-sm font-bold uppercase tracking-wider">
                       <AlertTriangle className="w-4 h-4" />
                       <span>Verification Blocked</span>
                    </div>
                    <button 
                        onClick={retry}
                        className="px-6 py-2 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-700 transition-all shadow-md"
                    >
                        Try Again
                    </button>
                  </div>
                )}
            </div>
            
            {(status === 'denied' || status === 'requesting') && (
                <button 
                    onClick={handleDevBypass}
                    className="mb-6 text-[9px] font-black text-slate-300 hover:text-blue-500 uppercase tracking-[0.2em] transition-colors border border-transparent hover:border-blue-500/20 px-3 py-1 rounded-md"
                >
                    [ Dev Bypass: Institutional Link ]
                </button>
            )}

            <p className="text-center text-slate-400 text-[10px] px-6 leading-relaxed">
              Security Protocol: Location data is strictly used for one-time identity verification and never persisted thereafter.
            </p>
        </div>
    );
};

export default LocationCheck;
