import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { io } from 'socket.io-client';

const GlobalAlertMarquee = () => {
    const [alert, setAlert] = useState('');
    const [isDismissed, setIsDismissed] = useState(false);
    const [activeLiveRoom, setActiveLiveRoom] = useState(null);
    const { user } = useSelector(state => state.auth);

    const playNotificationSound = () => {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, context.currentTime); // A5
            gain.gain.setValueAtTime(0.1, context.currentTime);
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.3);
            
            // Second higher beep
            setTimeout(() => {
                const secondOsc = context.createOscillator();
                secondOsc.type = 'sine';
                secondOsc.frequency.setValueAtTime(1108.73, context.currentTime); // C#6
                secondOsc.connect(gain);
                secondOsc.start();
                secondOsc.stop(context.currentTime + 0.1);
            }, 100);
        } catch (e) {
            console.error('Audio feedback failed', e);
        }
    };

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
        
        const socket = io('http://localhost:5001');

        socket.on('global-class-started', (data) => {
            if (data.roomId && user) {
                // Determine Eligibility
                const isTeacherRole = user.role === 'teacher' || user.role === 'admin' || user.role === 'hod';
                
                // Student Eligibility Logic:
                // 1. Department must match (Code or Full Name)
                // 2. Student's current semester must be equal to or greater than course semester (to allow repeating or advanced viewing, or strictly equal - user said 'those that are having access')
                // Usually access is based on enrollment.
                const isDeptMatch = user.department === data.department || user.department === data.deptCode;
                const isSemMatch = Number(user.semester) >= Number(data.semester);
                
                if (isTeacherRole || (isDeptMatch && isSemMatch)) {
                    setAlert(`🔴 LIVE CLASS: ${data.name || 'Professor'} has started class ${data.roomId}. Join now!`);
                    setActiveLiveRoom(data.roomId);
                    setIsDismissed(false);
                    playNotificationSound();

                    // Dispatch Popup Notification
                    const popupEvent = new CustomEvent('smartlms:achievement', {
                        detail: {
                            title: 'Protocol Initialized',
                            subtitle: `LIVE CLASS: ${data.courseName || 'New Session'} is now active.`,
                            icon: 'zap',
                            color: 'bg-emerald-600/90',
                            path: `/live-class/${data.roomId}`
                        }
                    });
                    window.dispatchEvent(popupEvent);
                }
            }
        });
        
        const handleCustomAlert = (e) => {
            if (e.detail?.message) {
                setAlert(e.detail.message);
                setIsDismissed(false);
                playNotificationSound();
            }
        };

        window.addEventListener('smartlms:marquee_alert', handleCustomAlert);
        
        // Polling for updates
        const interval = setInterval(fetchAlert, 300000);
        return () => {
            clearInterval(interval);
            socket.disconnect();
            window.removeEventListener('smartlms:marquee_alert', handleCustomAlert);
        };
    }, [user]);

    const handleDismiss = () => {
       localStorage.setItem('global_alert_dismissed', alert);
       setIsDismissed(true);
    };

    // Show to all users
    if (!user) return null;
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
                            to={activeLiveRoom ? `/live-class/${activeLiveRoom}` : "/results/entry"} 
                            className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-[9px] font-black uppercase text-white tracking-widest transition-all mr-12"
                        >
                            {activeLiveRoom ? "Execute Entry" : "Execute Entry"} <ChevronRight size={12} />
                        </Link>
                        
                        {/* Repeat for seamless loop */}
                        <span className="text-xs font-black text-white uppercase tracking-tight mx-4">
                            {alert}
                        </span>
                        <Link 
                            to={activeLiveRoom ? `/live-class/${activeLiveRoom}` : "/results/entry"} 
                            className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-[9px] font-black uppercase text-white tracking-widest transition-all mr-12"
                        >
                            {activeLiveRoom ? "Execute Entry" : "Execute Entry"} <ChevronRight size={12} />
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
