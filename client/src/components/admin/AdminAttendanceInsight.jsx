import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AdminAttendanceInsight = ({ userId, type, user }) => {
    const [history, setHistory] = useState([]);
    const [report, setReport] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const base = (user.role === 'admin' || user.role === 'hod') ? 'admin' : 'auth';
                const [hRes, rRes] = await Promise.all([
                    axios.get(`http://localhost:5001/api/${base}/attendance/history?userId=${userId}&type=${type}`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    }),
                    axios.get(`http://localhost:5001/api/${base}/attendance/annual-report?userId=${userId}&type=${type}`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    })
                ]);
                setHistory(hRes.data);
                setReport(rRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [userId, type]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return 'bg-emerald-500';
            case 'absent': return 'bg-rose-500';
            case 'late': return 'bg-amber-500';
            default: return 'bg-gray-200';
        }
    };

    if (isLoading) return <div className="h-64 flex items-center justify-center animate-pulse bg-gray-50 dark:bg-gray-800 rounded-3xl text-[10px] font-black uppercase tracking-widest text-gray-400">Synchronizing Attendance Node...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* MONTHLY CALENDAR GRID (31 DAYS) */}
            <section className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[32px] border border-gray-100 dark:border-gray-700">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                    <Calendar size={14} /> Current Month Pulse
                </h4>
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 30 }, (_, i) => {
                        const day = i + 1;
                        const record = history.find(h => new Date(h.date).getDate() === day);
                        return (
                            <div key={i} className="group relative">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[9px] font-black transition-all ${record ? getStatusColor(record.status) + ' text-white shadow-lg scale-110' : 'bg-white dark:bg-gray-700 text-gray-300'}`}>
                                    {day}
                                </div>
                                {record && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 bg-gray-900 text-white text-[8px] font-black px-2 py-1 rounded-md whitespace-nowrap uppercase tracking-widest shadow-xl">
                                        {record.status} {record.course ? `| ${record.course.code}` : ''}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="mt-6 flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Absent</span>
                    </div>
                </div>
            </section>

            {/* ANNUAL PERFORMANCE CHART */}
            <section className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[32px] border border-gray-100 dark:border-gray-700">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                    <TrendingUp size={14} /> Annual Continuity Index
                </h4>
                <div className="h-48 w-full min-w-0">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={report}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 900, fill: '#94a3b8'}} />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ borderRadius: '12px', border: 'none', background: '#111827', color: 'white', fontSize: '10px', fontWeight: '900' }}
                            />
                            <Bar dataKey="presentDays" radius={[4, 4, 0, 0]} barSize={12}>
                                {report.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.presentDays > 20 ? '#10b981' : entry.presentDays > 10 ? '#3b82f6' : '#ef4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                </div>
                <p className="mt-4 text-[9px] font-bold text-gray-500 italic uppercase tracking-widest">Aggregate presence points per lunar cycle of the current fiscal year.</p>
            </section>
        </div>
    );
};

export default AdminAttendanceInsight;
