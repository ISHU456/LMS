import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronRight } from 'lucide-react';

const GlobalAlertMarquee = () => {
    const [alert, setAlert] = useState('');
    const [isDismissed, setIsDismissed] = useState(false);
    const { user } = useSelector(state => state.auth);

    useEffect(() => {
        const fetchAlert = async () => {
            try {
                const { data } = await axios.get('http://localhost:5001/api/public/settings');
                if (data && data.globalAlert) {
                    setAlert(data.globalAlert);
                    // Check if this specific alert message has been dismissed in this session
                    const dismissedAlert = localStorage.getItem('global_alert_dismissed');
                    if (dismissedAlert === data.globalAlert) {
                         setIsDismissed(true);
                    } else {
                         setIsDismissed(false);
                    }
                }
            } catch (err) {
                console.error("Failed to load global alert.");
            }
        };
        fetchAlert();
        
        // Polling for updates
        const interval = setInterval(fetchAlert, 300000);
        return () => clearInterval(interval);
    }, []);

    const handleDismiss = () => {
       localStorage.setItem('global_alert_dismissed', alert);
       setIsDismissed(true);
    };

    // Only show to institutional personnel (teachers, admins, hods)
    if (!user || !['admin', 'hod', 'teacher'].includes(user.role)) return null;
    if (!alert || isDismissed) return null;

    return (
        <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="w-full bg-amber-500 dark:bg-amber-600/90 border-b border-amber-600/20 backdrop-blur-md z-[40]"
        >
            <div className="flex items-center h-10 overflow-hidden relative group">
                <div onClick={handleDismiss} className="flex items-center px-4 bg-amber-600 dark:bg-amber-700 h-full z-10 shadow-2xl relative cursor-pointer hover:bg-amber-700 dark:hover:bg-amber-800 transition-all border-r border-white/10" title="Dismiss Alert">
                    <AlertTriangle size={14} className="text-white mr-2 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap italic">Dismiss Alert</span>
                </div>
                
                <div className="flex-1 h-full flex items-center overflow-hidden">
                    <div className="animate-marquee whitespace-nowrap flex items-center">
                        <span className="text-xs font-black text-white uppercase tracking-tight mx-4">
                            {alert}
                        </span>
                        <Link 
                            to="/results/entry" 
                            className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-[9px] font-black uppercase text-white tracking-widest transition-all mr-12"
                        >
                            Execute Entry <ChevronRight size={12} />
                        </Link>
                        
                        {/* Repeat for seamless loop */}
                        <span className="text-xs font-black text-white uppercase tracking-tight mx-4">
                            {alert}
                        </span>
                        <Link 
                            to="/results/entry" 
                            className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-[9px] font-black uppercase text-white tracking-widest transition-all mr-12"
                        >
                            Execute Entry <ChevronRight size={12} />
                        </Link>
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 10s linear infinite;
                    display: inline-flex;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}} />
        </motion.div>
    );
};

export default GlobalAlertMarquee;
