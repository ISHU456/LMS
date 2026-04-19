import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    X, Shield, GraduationCap, Award, Building, 
    CheckCircle2, AlertCircle, Save, Calendar, TrendingUp, Book, Plus, Target,
    Zap, Brain, Database, History
} from 'lucide-react';
import { motion } from 'framer-motion';
import AdminAttendanceInsight from './AdminAttendanceInsight';

const AdminStudentProfileModal = ({ studentId, user, onClose }) => {
    const [details, setDetails] = useState(null);
    const [allCourses, setAllCourses] = useState([]);
    const [excludedCourses, setExcludedCourses] = useState([]);
    const [department, setDepartment] = useState('');
    const [semester, setSemester] = useState(1);
    const [section, setSection] = useState('A');
    const [rollNumber, setRollNumber] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Academic Stats
    const [cgpa, setCgpa] = useState(0);
    const [percentage, setPercentage] = useState(0);
    const [aboutMe, setAboutMe] = useState('');
    const [results, setResults] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const endpoint = (user.role === 'admin' || user.role === 'hod') 
                    ? `http://localhost:5001/api/admin/students/${studentId}`
                    : `http://localhost:5001/api/auth/student-profile/${studentId}`;

                const res = await axios.get(endpoint, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setDetails(res.data.student);
                setDepartment(res.data.student.department || '');
                setSemester(res.data.student.semester || 1);
                setSection(res.data.student.section || 'A');
                setRollNumber(res.data.student.rollNumber || '');
                setIsActive(res.data.student.isActive !== false);
                
                // Determine which courses this student is currently excluded from
                const excluded = res.data.allCourses.filter(c => 
                    c.excludedStudents?.some(id => id === studentId || id._id === studentId)
                ).map(c => c._id);
                
                setExcludedCourses(excluded);
                setAllCourses(res.data.allCourses);

                // Set Results & Stats
                setResults(res.data.results || []);
                setCgpa(res.data.student.cgpa || 0);
                setPercentage(res.data.student.percentage || 0);
                setAboutMe(res.data.student.aboutMe || '');
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [studentId, user.token]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axios.put(`http://localhost:5001/api/admin/students/${studentId}/enrollment`, {
                semester,
                department,
                section,
                rollNumber,
                isActive: true, // Force active on save/approval
                excludedCourseIds: excludedCourses,
                cgpa,
                percentage,
                aboutMe
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('Student enrollment and access status synchronized.');
            onClose();
        } catch (err) {
            alert('Failed to update student enrollment.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!details) return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0f172a] p-10 rounded-3xl text-center">
                <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
                <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Failed to retrieve identity record.</p>
                <button onClick={onClose} className="mt-6 px-8 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-black uppercase">Dismiss</button>
            </div>
        </div>
    );

    return createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-6 md:p-12 lg:p-20 overflow-hidden">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-[#0f172a] w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[85vh] relative shadow-blue-500/10 mt-12 md:mt-16">
                
                <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg uppercase">
                            {details.name[0]}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{details.name}</h2>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">{details.email} • {details.rollNumber || 'NO-ROLL'} • SEC {section}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all"><X/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-12 text-sm">
                    {(user.role === 'admin' || user.role === 'hod') ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <section>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-6 flex items-center gap-2 italic">
                                    <Building size={14} /> Sector Allocation
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                {['CSE', 'ECE', 'ME', 'CE', 'IT', 'AI'].map(dept => (
                                    <button key={dept} onClick={() => setDepartment(dept)}
                                        className={`p-4 rounded-2xl border-2 transition-all text-[10px] font-black uppercase tracking-widest ${department === dept ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20 text-blue-600' : 'bg-gray-50 border-transparent dark:bg-gray-800 text-gray-400 hover:border-gray-200'}`}>
                                        {dept}
                                    </button>
                                ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-6 flex items-center gap-2 italic">
                                    <Award size={14} /> Active Semester & Section
                                </h3>
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                {[1,2,3,4,5,6,7,8].map(sem => (
                                    <button key={sem} onClick={() => setSemester(sem)}
                                        className={`w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${semester === sem ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-gray-50 border-transparent dark:bg-gray-800 text-gray-400 hover:border-gray-200'}`}>
                                        <span className="text-[9px] font-black leading-none">{sem}</span>
                                        <span className="text-[7px] font-bold">SEM</span>
                                    </button>
                                ))}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    {['A', 'B'].map(sec => (
                                        <button key={sec} onClick={() => setSection(sec)}
                                            className={`p-4 rounded-xl border-2 flex items-center justify-center transition-all text-[10px] font-black ${section === sec ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-gray-50 dark:bg-gray-800 border-transparent text-gray-400 hover:border-gray-200'}`}>
                                            SECTION {sec}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-6 flex items-center gap-2 italic">
                                    <GraduationCap size={14} /> Academic Trajectory
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Official Roll Number</label>
                                        <input 
                                            type="text" placeholder="Enter Roll Number (e.g. 24CSE001)" value={rollNumber} onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-3 text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-1">CGPA</label>
                                        <input 
                                            type="number" step="0.01" value={cgpa} onChange={(e) => setCgpa(parseFloat(e.target.value))}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-3 text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Percentage (%)</label>
                                        <input 
                                            type="number" step="0.1" value={percentage} onChange={(e) => setPercentage(parseFloat(e.target.value))}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-3 text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Department', value: department, icon: Building, color: 'blue' },
                                { label: 'Active Semester', value: `Sem ${semester} (${section})`, icon: Award, color: 'purple' },
                                { label: 'Overall CGPA', value: cgpa || 'N/A', icon: Target, color: 'amber' },
                                { label: 'Aggregate %', value: percentage ? `${percentage}%` : 'N/A', icon: TrendingUp, color: 'emerald' }
                            ].map((stat, i) => (
                                <div key={i} className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                        <stat.icon size={12} className={`text-${stat.color}-500`}/> {stat.label}
                                    </p>
                                    <p className="text-xl font-black text-gray-900 dark:text-white uppercase truncate">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <section>
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-6 flex items-center gap-2 italic">
                            <Plus size={14} /> Performance Matrix (Graded Results)
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-[32px] border border-gray-100 dark:border-gray-700 overflow-hidden">
                            {results.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-700/50">
                                            <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Resource / Exam</th>
                                            <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">Outcome</th>
                                            <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">Synchronization</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {results.map(res => (
                                            <tr key={res._id} className="hover:bg-white dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-black uppercase text-gray-900 dark:text-white">{res.assignment?.title}</p>
                                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest italic">{res.assignment?.course?.name}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-sm font-black text-blue-600">{res.marksObtained} / {res.assignment?.maxMarks}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">Validated</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-10 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 italic">No historical data records found for this identity.</div>
                            )}
                        </div>
                    </section>

                    <section className="space-y-6">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-6 flex items-center gap-2 italic">
                            <Zap size={14} /> Neural Balance & Metrics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-indigo-600/5 border border-indigo-500/10 p-8 rounded-[2rem] flex items-center justify-between group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Zap className="text-indigo-500" size={40} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">Active Neural Credits</p>
                                    <p className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">{details.credits || 0}</p>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all relative z-10">
                                    <button 
                                        onClick={async () => {
                                            try {
                                                const newCredits = (details.credits || 0) + 10;
                                                await axios.put(`http://localhost:5001/api/admin/users/${studentId}`, { credits: newCredits }, {
                                                    headers: { Authorization: `Bearer ${user.token}` }
                                                });
                                                setDetails({...details, credits: newCredits});
                                                alert('Neural link recalibrated: +10 Credits assigned.');
                                            } catch (err) { alert('Sync Failure.'); }
                                        }}
                                        className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-indigo-600/20"
                                    >
                                        <Plus size={24} />
                                    </button>
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-gray-800/50 p-8 rounded-[2rem] flex items-center justify-between group">
                                <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Scholar Coins Balance</p>
                                    <p className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">{details.coins || 0}</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center">
                                    <Database size={20} className="text-gray-400" />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-6 flex items-center gap-2 italic">
                            <Plus size={14} /> Personal Synopsis (Bio)
                        </h3>
                        <textarea 
                            rows="4" value={aboutMe} onChange={(e) => setAboutMe(e.target.value)}
                            placeholder="Student's background, aspirations, and summary..."
                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-[24px] p-6 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none italic"
                        />
                    </section>

                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-6 flex items-center gap-2 italic">
                            <Shield size={14} /> Access Restrictions
                        </h3>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Click to restrict student access to specific modules permanently.</p>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[32px] border border-gray-100 dark:border-gray-700">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {allCourses.filter(c => c.semester === semester).map(course => {
                                    const isExcluded = excludedCourses.includes(course._id);
                                    return (
                                        <button key={course._id} 
                                            onClick={() => {
                                                if (isExcluded) setExcludedCourses(excludedCourses.filter(id => id !== course._id));
                                                else setExcludedCourses([...excludedCourses, course._id]);
                                            }}
                                            className={`p-4 rounded-2xl border text-left flex items-center justify-between group transition-all ${isExcluded ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-900 shadow-inner' : 'bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600 shadow-sm'}`}>
                                            <div>
                                                <p className={`text-xs font-black uppercase tracking-tight ${isExcluded ? 'text-rose-600' : 'text-gray-900 dark:text-white'}`}>{course.name}</p>
                                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{course.code}</p>
                                            </div>
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isExcluded ? 'bg-rose-600 border-rose-600 shadow-lg' : 'border-gray-200 dark:border-gray-600 group-hover:border-blue-300'}`}>
                                                {isExcluded ? <X size={14} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                            </div>
                                        </button>
                                    );
                                })}
                           </div>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-6 flex items-center gap-2 italic">
                            <Calendar size={14} /> Attendance Pulse & Annual Metrics
                        </h3>
                        <AdminAttendanceInsight userId={studentId} type="student" user={user} />
                    </section>

                    {/* Institutional Certification Hub */}
                    <section className="mt-16 pt-12 border-t-2 border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col gap-1 mb-8">
                            <h3 className="text-[14px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 flex items-center gap-3">
                                <Award size={22} className="animate-pulse" /> Institutional Certification Hub
                            </h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-[34px]">
                                Global Governance Node Terminal: Departmental Sector
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <motion.button 
                                whileHover={{ scale: 1.02, translateY: -3 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex flex-col items-center justify-center p-6 rounded-[32px] bg-white dark:bg-gray-800/40 border-2 border-dashed border-blue-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all group overflow-hidden relative">
                                <div className="absolute -top-6 -right-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Target size={120} />
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                                    <Calendar className="text-blue-500" size={24} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white mb-0.5">Notify Instructor</span>
                                <span className="text-[7.5px] font-bold text-gray-400 uppercase tracking-widest text-center">Alert faculty of profile updates</span>
                            </motion.button>

                            <motion.button 
                                whileHover={{ scale: 1.02, translateY: -3 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex flex-col items-center justify-center p-6 rounded-[32px] bg-emerald-500/5 dark:bg-emerald-500/10 border-2 border-emerald-500/20 hover:border-emerald-500 hover:bg-emerald-500/20 transition-all group overflow-hidden relative">
                                <div className="absolute -top-6 -right-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <CheckCircle2 size={120} />
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-3 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                                    <Shield className="text-emerald-500" size={24} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-0.5">Approve Protocol</span>
                                <span className="text-[7.5px] font-bold text-emerald-500/60 uppercase tracking-widest text-center">Validate institutional compliance</span>
                            </motion.button>

                            <motion.button 
                                whileHover={{ scale: 1.02, translateY: -3 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex flex-col items-center justify-center p-6 rounded-[32px] bg-rose-500/5 dark:bg-rose-500/10 border-2 border-rose-500/20 hover:border-rose-500 hover:bg-rose-500/20 transition-all group overflow-hidden relative">
                                <div className="absolute -top-6 -right-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <AlertCircle size={120} />
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-3 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/40 transition-colors">
                                    <X className="text-rose-500" size={24} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-0.5">Reject Submission</span>
                                <span className="text-[7.5px] font-bold text-rose-500/60 uppercase tracking-widest text-center">Flag discrepancies & notify</span>
                            </motion.button>
                        </div>
                    </section>
                </div>

                <div className="p-8 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4 bg-gray-50/50 dark:bg-gray-800/30">
                    <button onClick={onClose} className="px-6 py-4 font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">Dismiss Profile</button>
                    {(user.role === 'admin' || user.role === 'hod') && (
                        <button onClick={handleSave} disabled={isSaving}
                            className={`px-10 py-4 ${details.isActive === false ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center gap-2 disabled:bg-gray-400`}>
                            {details.isActive === false ? <CheckCircle2 size={18}/> : <Save size={18}/>}
                            {isSaving ? 'Processing...' : (details.isActive === false ? 'Approve & Activate' : 'Save Enrollment')}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default AdminStudentProfileModal;
