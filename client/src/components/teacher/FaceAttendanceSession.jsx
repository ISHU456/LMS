import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import { loadModels } from '../../modules/mfa/utils/faceUtils';
import { X, UserCheck, Shield, Users, Save, RefreshCw, Camera, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { AnimatePresence } from 'framer-motion';

const FaceAttendanceSession = ({ user, course, semester, onApply, onClose }) => {
    const webcamRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [studentFaceData, setStudentFaceData] = useState([]);
    const [scannedStudents, setScannedStudents] = useState(new Set());
    const [lastMatch, setLastMatch] = useState(null);
    const [error, setError] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        const fetchAndInit = async () => {
            try {
                // 1. Load Models
                const modelsLoaded = await loadModels();
                if (!modelsLoaded) throw new Error('Face models failed to load');

                // 2. Fetch Student Face Descriptors
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const res = await axios.get(`http://localhost:5001/api/attendance/course/${course._id}/face-data?semester=${semester}`, config);
                
                // Convert arrays back to Float32Array
                const processedData = res.data.map(item => ({
                    ...item,
                    descriptors: item.descriptors.map(d => new Float32Array(d))
                }));
                
                setStudentFaceData(processedData);
                setLoading(false);
                setIsScanning(true);
            } catch (err) {
                console.error(err);
                setError(err.message || 'Initialization failed');
                setLoading(false);
            }
        };

        fetchAndInit();
    }, [course._id, semester, user.token]);

    useEffect(() => {
        let interval = null;
        if (isScanning && !loading && !error) {
            interval = setInterval(async () => {
                if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
                    const video = webcamRef.current.video;
                    try {
                        const detections = await faceapi.detectAllFaces(
                            video, 
                            new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
                        )
                            .withFaceLandmarks()
                            .withFaceDescriptors();

                        if (detections.length > 0) {
                            detections.forEach(detection => {
                                const descriptor = detection.descriptor;
                                findMatch(descriptor);
                            });
                        }
                    } catch (err) {
                        console.error('Detection error:', err);
                    }
                }
            }, 600);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isScanning, loading, error, studentFaceData, scannedStudents]);

    const findMatch = (descriptor) => {
        let bestMatch = null;
        let minDistance = 0.5; // Threshold

        studentFaceData.forEach(student => {
            if (scannedStudents.has(student.studentId)) return; // Already scanned

            student.descriptors.forEach(stored => {
                const distance = faceapi.euclideanDistance(descriptor, stored);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestMatch = student;
                }
            });
        });

        if (bestMatch) {
            setScannedStudents(prev => new Set([...prev, bestMatch.studentId]));
            setLastMatch(bestMatch);
            // Vibrate or beep could go here
            setTimeout(() => setLastMatch(null), 2000);
        }
    };

    const handleApply = () => {
        onApply(Array.from(scannedStudents));
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row h-[85vh]">
                
                {/* Left Side: Scanner View */}
                <div className="flex-1 bg-black relative flex items-center justify-center group">
                    {loading ? (
                        <div className="flex flex-col items-center gap-4 text-white">
                            <RefreshCw className="w-12 h-12 animate-spin text-primary-500" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Hydrating Biometric Neural Grid...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center gap-4 text-red-500 p-8 text-center">
                            <AlertCircle className="w-16 h-16" />
                            <h3 className="text-xl font-black uppercase">Initialization Fault</h3>
                            <p className="text-sm font-bold opacity-70">{error}</p>
                            <button onClick={onClose} className="mt-4 px-8 py-3 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest">Abort Mission</button>
                        </div>
                    ) : (
                        <>
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                className="w-full h-full object-cover"
                                mirrored={true}
                            />
                            
                            {/* Scanning HUD */}
                            <div className="absolute inset-0 pointer-events-none border-[20px] border-black/20">
                                <div className="absolute inset-0 border border-primary-500/30 animate-pulse" />
                                <div className="absolute top-12 left-12 w-24 h-24 border-t-8 border-l-8 border-primary-500 rounded-tl-3xl shadow-[0_0_50px_rgba(var(--primary-500),0.3)]" />
                                <div className="absolute top-12 right-12 w-24 h-24 border-t-8 border-r-8 border-primary-500 rounded-tr-3xl shadow-[0_0_50px_rgba(var(--primary-500),0.3)]" />
                                <div className="absolute bottom-12 left-12 w-24 h-24 border-b-8 border-l-8 border-primary-500 rounded-bl-3xl shadow-[0_0_50px_rgba(var(--primary-500),0.3)]" />
                                <div className="absolute bottom-12 right-12 w-24 h-24 border-b-8 border-r-8 border-primary-500 rounded-br-3xl shadow-[0_0_50px_rgba(var(--primary-500),0.3)]" />
                                
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-20 flex flex-col items-center">
                                    <div className="h-10 w-[1px] bg-primary-500 animate-bounce mb-2" />
                                    <div className="px-6 py-2 bg-primary-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl">
                                        Live Attendance Stream
                                    </div>
                                </div>
                            </div>

                            {/* Flash Match Notification */}
                            <AnimatePresence>
                                {lastMatch && (
                                    <div className="absolute inset-x-0 top-20 flex justify-center z-20">
                                        <div className="bg-emerald-500 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-5 border-4 border-white/20 animate-in slide-in-from-top-12">
                                            <div className="p-3 bg-white/20 rounded-2xl">
                                                <UserCheck className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h4 className="text-2xl font-black uppercase tracking-tighter leading-none">{lastMatch.name}</h4>
                                                <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">Identity Confirmed · ROLL: {lastMatch.rollNumber}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </div>

                {/* Right Side: Session Stats & Control */}
                <div className="w-full md:w-96 flex flex-col p-8 bg-gray-50 dark:bg-slate-900 border-l border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-xl">
                                <Shield size={18} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Security Node</span>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    <div className="space-y-8 flex-1">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-2">Session Control</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">System is cross-referencing live frames with <span className="text-indigo-500">{studentFaceData.length}</span> registered identities.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users size={14} className="text-indigo-500" />
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Students</span>
                                </div>
                                <p className="text-4xl font-black text-gray-900 dark:text-white tabular-nums">{scannedStudents.size}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Camera size={14} className="text-indigo-500" />
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Source</span>
                                </div>
                                <p className="text-[10px] font-black text-emerald-500 uppercase">HD Stream</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                                Recently Verified
                                <span>{scannedStudents.size > 0 ? 'LIVE FEED' : 'IDLE'}</span>
                            </h4>
                            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-gray-700 h-64 overflow-y-auto p-4 custom-scrollbar">
                                {Array.from(scannedStudents).reverse().map(id => {
                                    const student = studentFaceData.find(s => s.studentId === id);
                                    if (!student) return null;
                                    return (
                                        <div key={id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-gray-100 animate-in slide-in-from-left-4">
                                            <div className="w-8 h-8 bg-indigo-500 text-white rounded-lg flex items-center justify-center text-[10px] font-bold">
                                                {student.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase leading-none">{student.name}</p>
                                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Roll: {student.rollNumber}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {scannedStudents.size === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                                        <Users size={32} className="mb-2" />
                                        <p className="text-[9px] font-black uppercase tracking-widest">No Identities Locked</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-8">
                        <button 
                            disabled={scannedStudents.size === 0}
                            onClick={handleApply}
                            className="w-full flex items-center justify-center gap-4 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Save size={18} /> Apply {scannedStudents.size} Records
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FaceAttendanceSession;
