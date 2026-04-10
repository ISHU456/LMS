import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, UserCheck, AlertCircle, Phone, Mail, Building, Key } from 'lucide-react';

const AdminPendingTeachers = ({ user }) => {
    const [pendingTeachers, setPendingTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authorizing, setAuthorizing] = useState(null);

    const fetchPendingTeachers = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:5001/api/admin/teachers/pending', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setPendingTeachers(res.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch pending authorizations.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingTeachers();
    }, [user.token]);

    const handleAuthorize = async (id) => {
        try {
            setAuthorizing(id);
            await axios.post(`http://localhost:5001/api/admin/teachers/pending/${id}/authorize`, {}, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            // Remove from list
            setPendingTeachers(prev => prev.filter(t => t._id !== id));
            // Trigger a success notification here if you have a global notification context
        } catch (err) {
            setError(err.response?.data?.message || 'Authorization failed.');
        } finally {
            setAuthorizing(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-slate-400 font-medium text-sm animate-pulse uppercase tracking-widest">Scanning Registration Pipeline...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-[#080c14] rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-xl border border-slate-200 dark:border-slate-800">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Faculty Authorization Queue</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Review and verify new faculty registration requests before granting system access.</p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30 shadow-inner">
                    <span className="text-xl font-black">{pendingTeachers.length}</span>
                    <span className="text-[9px] uppercase tracking-widest font-black">Pending</span>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3">
                    <AlertCircle className="text-red-500" size={20} />
                    <p className="text-sm text-red-700 dark:text-red-400 font-semibold">{error}</p>
                </div>
            )}

            {pendingTeachers.length === 0 ? (
                <div className="bg-white dark:bg-[#080c14] border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center shadow-sm">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck size={48} className="text-slate-300 dark:text-slate-700" />
                    </div>
                    <h3 className="text-xl font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter mb-2">No Pending Requests</h3>
                    <p className="text-slate-500 dark:text-slate-500 max-w-md mx-auto">The authorization queue is completely clear. All faculty members are currently verified and operational.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {pendingTeachers.map(teacher => (
                            <motion.div 
                                key={teacher._id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white dark:bg-[#080c14] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-amber-400" />
                                
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="font-black text-lg text-slate-800 dark:text-white capitalize">{teacher.name}</h3>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block mt-1">Pending Approval</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center border border-amber-100 dark:border-amber-800/30">
                                        <UserCheck size={24} />
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                        <Building size={16} className="text-indigo-400 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">College/Employee ID</p>
                                            <p className="font-semibold text-sm truncate dark:text-slate-200">{teacher.employeeId || 'Not Provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                        <Mail size={16} className="text-indigo-400 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Personal Email</p>
                                            <p className="font-semibold text-sm truncate dark:text-slate-200">{teacher.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                        <Phone size={16} className="text-indigo-400 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone Number</p>
                                            <p className="font-semibold text-sm truncate dark:text-slate-200">{teacher.contact || 'Not Provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 border-dashed">
                                        <Key size={16} className="text-amber-500 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Registration Token</p>
                                            <p className="font-black text-sm tracking-widest font-mono text-slate-800 dark:text-amber-400">{teacher.registrationToken || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleAuthorize(teacher._id)}
                                    disabled={authorizing === teacher._id}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold uppercase tracking-wide shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50"
                                >
                                    {authorizing === teacher._id ? (
                                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Authorizing...</>
                                    ) : (
                                        <><ShieldCheck size={18} /> Authorize Faculty Access</>
                                    )}
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default AdminPendingTeachers;
