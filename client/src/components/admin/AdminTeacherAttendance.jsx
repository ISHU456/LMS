import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Calendar, CheckCircle2, XCircle, Clock, 
    ChevronLeft, ChevronRight, UserMinus, UserCheck, 
    MoreVertical, Info, BadgeCheck, ShieldAlert 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminTeacherAttendance = ({ user }) => {
    const [teachers, setTeachers] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        fetchAttendance();
    }, [date]);

    const fetchAttendance = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/admin/teachers/attendance?date=${date}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setTeachers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMark = async (teacherId, status, checkIn = '09:00 AM', checkOut = '05:00 PM') => {
        setUpdatingId(teacherId);
        try {
            await axios.post('http://localhost:5000/api/admin/teachers/attendance', {
                teacherId, date, status, checkIn, checkOut, remarks: 'Marked by System Administrator'
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            // Update local state for immediate feedback
            setTeachers(teachers.map(t => t._id === teacherId ? { ...t, status } : t));
        } catch (err) {
            alert('Failure in marking attendance protocol.');
        } finally {
            setUpdatingId(null);
        }
    };

    const StatusBadge = ({ status }) => {
        switch (status) {
            case 'present': return <span className="bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center gap-1 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest"><UserCheck size={12}/> PRESENT</span>;
            case 'absent': return <span className="bg-rose-50 text-rose-600 border-rose-100 flex items-center gap-1 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest"><UserMinus size={12}/> ABSENT</span>;
            case 'late': return <span className="bg-amber-50 text-amber-600 border-amber-100 flex items-center gap-1 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest"><Clock size={12}/> LATE</span>;
            case 'on_leave': return <span className="bg-indigo-50 text-indigo-600 border-indigo-100 flex items-center gap-1 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest"><Info size={12}/> ON LEAVE</span>;
            default: return <span className="bg-gray-50 text-gray-400 border-gray-100 flex items-center gap-1 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest italic">NOT MARKED</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[36px] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-wrap items-center justify-between gap-6">
                <div>
                   <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-1">Faculty Attendance Register</h2>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Master logs for all teaching personnel.</p>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-2xl shadow-inner">
                    <button onClick={() => { 
                        const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().split('T')[0]); 
                    }} className="p-3 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm"><ChevronLeft size={16}/></button>
                    <div className="flex items-center gap-3 px-6 py-2 bg-white dark:bg-gray-700 rounded-xl shadow-md border border-gray-100 dark:border-gray-600">
                        <Calendar className="text-red-600" size={16}/>
                        <span className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">{new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <button onClick={() => { 
                        const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().split('T')[0]); 
                    }} className="p-3 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm"><ChevronRight size={16}/></button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <AnimatePresence mode="popLayout">
                {isLoading ? (
                    [1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-gray-50 dark:bg-gray-800/20 rounded-[32px] animate-pulse"/>)
                ) : teachers.length > 0 ? teachers.map((t, idx) => (
                    <motion.div key={t._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                        className={`bg-white dark:bg-gray-900 p-6 rounded-[32px] border transition-all duration-300 relative overflow-hidden group shadow-sm hover:shadow-2xl ${t.status === 'present' ? 'border-emerald-100 hover:border-emerald-300' : t.status === 'absent' ? 'border-rose-100 hover:border-rose-300' : 'border-gray-100 hover:border-red-200'}`}>
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center font-black text-gray-300 border border-gray-100 dark:border-gray-800 uppercase shadow-inner group-hover:scale-110 transition-transform">
                                {t.name[0]}
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase truncate tracking-tight">{t.name}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">{t.department || 'GENERAL'}</p>
                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-0.5">{t.employeeId || 'NO-ID'}</p>
                            </div>
                        </div>

                        <div className="mb-8 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800">
                             <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Current Status</span>
                                <StatusBadge status={t.status} />
                             </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => handleMark(t._id, 'present')} disabled={updatingId === t._id}
                                className={`py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${t.status === 'present' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600'}`}>
                                PRESENT
                             </button>
                             <button onClick={() => handleMark(t._id, 'absent')} disabled={updatingId === t._id}
                                className={`py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${t.status === 'absent' ? 'bg-rose-500 text-white shadow-lg' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600'}`}>
                                ABSENT
                             </button>
                             <button onClick={() => handleMark(t._id, 'late')} disabled={updatingId === t._id}
                                className={`py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${t.status === 'late' ? 'bg-amber-500 text-white shadow-lg' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600'}`}>
                                LATE
                             </button>
                             <button onClick={() => handleMark(t._id, 'on_leave')} disabled={updatingId === t._id}
                                className={`py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${t.status === 'on_leave' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600'}`}>
                                LEAVE
                             </button>
                        </div>

                        {updatingId === t._id && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-10 transition-opacity">
                                <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </motion.div>
                )) : (
                    <div className="col-span-full py-32 text-center bg-white dark:bg-gray-900 rounded-[32px] border border-dashed border-gray-200 dark:border-gray-800">
                        <Info size={48} className="mx-auto mb-4 text-gray-200"/>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400 italic">No faculty accounts found in the master registry.</p>
                    </div>
                )}
               </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminTeacherAttendance;
