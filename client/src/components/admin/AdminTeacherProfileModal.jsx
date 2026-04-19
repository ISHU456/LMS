import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    X, Shield, Book, Award, Building, 
    CheckCircle2, Plus, Trash2, Save, Calendar, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminAttendanceInsight from './AdminAttendanceInsight';

const AdminTeacherProfileModal = ({ teacherId, user, onClose }) => {
    const [details, setDetails] = useState(null);
    const [allCourses, setAllCourses] = useState([]);
    const [selectedCourses, setSelectedCourses] = useState([]);
    const [department, setDepartment] = useState('');
    const [assignedSemesters, setAssignedSemesters] = useState([]);
    const [role, setRole] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Career Detail States
    const [qualification, setQualification] = useState('');
    const [experienceYears, setExperienceYears] = useState(0);
    const [designation, setDesignation] = useState('');
    const [expertise, setExpertise] = useState(''); // Comma separated for editing
    const [careerDetails, setCareerDetails] = useState('');
    const [aboutMe, setAboutMe] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dRes, cRes] = await Promise.all([
                    axios.get(`http://localhost:5001/api/admin/teachers/${teacherId}`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    }),
                    axios.get(`http://localhost:5001/api/admin/courses`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    })
                ]);
                setDetails(dRes.data.teacher);
                setDepartment(dRes.data.teacher.department || '');
                setRole(dRes.data.teacher.role || 'teacher');
                setAssignedSemesters(dRes.data.teacher.assignedSemesters || []);
                setSelectedCourses(dRes.data.assignedCourses.map(c => c._id));
                setAllCourses(cRes.data);

                // Set Career Info
                setQualification(dRes.data.teacher.qualification || '');
                setExperienceYears(dRes.data.teacher.experienceYears || 0);
                setDesignation(dRes.data.teacher.designation || '');
                setExpertise(dRes.data.teacher.expertise?.join(', ') || '');
                setCareerDetails(dRes.data.teacher.careerDetails || '');
                setAboutMe(dRes.data.teacher.aboutMe || '');
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [teacherId, user.token]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // First update assignments and department
            await axios.put(`http://localhost:5001/api/admin/teachers/${teacherId}/assignments`, {
                assignedCourseIds: selectedCourses,
                department: department,
                assignedSemesters: assignedSemesters,
                qualification,
                experienceYears,
                designation,
                expertise: expertise.split(',').map(e => e.trim()).filter(e => e !== ''),
                careerDetails,
                aboutMe
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            // Then update role if changed
            if (role !== details.role) {
                await axios.put(`http://localhost:5001/api/admin/users/${teacherId}/role`, { role }, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
            }

            alert('Teacher credentials and role synchronized.');
            onClose();
        } catch (err) {
            alert('Failed to update sector assignments.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-6 md:p-12 lg:p-20 overflow-hidden">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white dark:bg-[#0f172a] w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[85vh] relative shadow-indigo-500/10 mt-12 md:mt-16">
                
                <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-black text-2xl shadow-lg uppercase">
                            {details.name[0]}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{details.name}</h2>
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">{details.email}</p>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : role === 'hod' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                    {role}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all"><X/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-12">
                    {/* ROLE CONFIG (NEW) */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-6 flex items-center gap-2 italic">
                            <Shield size={14} /> Authority Level
                        </h3>
                        <div className="flex gap-4">
                            {[
                                { id: 'teacher', label: 'FACULTY', color: 'gray' },
                                { id: 'hod', label: 'HOD', color: 'amber' },
                                { id: 'admin', label: 'ADMIN', color: 'indigo' }
                            ].map(rl => (
                                <button key={rl.id} onClick={() => setRole(rl.id)}
                                    className={`flex-1 p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${role === rl.id ? (rl.id === 'admin' ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/20 text-indigo-600' : rl.id === 'hod' ? 'bg-amber-50 border-amber-500 dark:bg-amber-900/20 text-amber-600' : 'bg-red-50 border-red-500 dark:bg-red-900/20 text-red-600') : 'bg-gray-50 border-transparent dark:bg-gray-800 text-gray-400 hover:border-gray-200'}`}>
                                    <span className="text-xs font-black uppercase tracking-widest">{rl.label}</span>
                                    {role === rl.id && <CheckCircle2 size={16}/>}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* DEPARTMENT CONFIG */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-6 flex items-center gap-2 italic">
                            <Building size={14} /> Sector Allocation {role === 'hod' ? '(HOD Responsibilities)' : ''}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {['CSE', 'ECE', 'ME', 'CE', 'IT', 'AI'].map(dept => (
                               <button key={dept} onClick={() => setDepartment(dept)}
                                   className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between group ${department === dept ? 'bg-red-50 border-red-500 dark:bg-red-900/20' : 'bg-gray-50 border-transparent dark:bg-gray-800 hover:border-gray-200'}`}>
                                   <span className={`text-sm font-black uppercase tracking-widest ${department === dept ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-600'}`}>{dept} Department</span>
                                   {department === dept && <CheckCircle2 className="text-red-600" size={20}/>}
                               </button>
                           ))}
                        </div>
                    </section>

                    {/* SEMESTER ALLOCATION (NEW) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-6 flex items-center gap-2 italic">
                                <Award size={14} /> Semester Focus
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {[1,2,3,4,5,6,7,8].map(sem => {
                                    const active = assignedSemesters.includes(sem);
                                    return (
                                        <button key={sem} 
                                            onClick={() => {
                                                if (active) setAssignedSemesters(assignedSemesters.filter(s => s !== sem));
                                                else setAssignedSemesters([...assignedSemesters, sem]);
                                            }}
                                            className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${active ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-gray-50 border-transparent dark:bg-gray-800 text-gray-400 hover:border-gray-200'}`}>
                                            <span className="text-[10px] font-black">{sem}</span>
                                            <span className="text-[8px] font-bold">SEM</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-2 flex items-center gap-2 italic">
                                <Shield size={14} /> Professional Identity
                            </h3>
                            <div className="grid gap-3">
                                <div>
                                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Designation</label>
                                    <input 
                                        type="text" value={designation} onChange={(e) => setDesignation(e.target.value)}
                                        placeholder="Assistant Professor..."
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Qualification</label>
                                    <input 
                                        type="text" value={qualification} onChange={(e) => setQualification(e.target.value)}
                                        placeholder="Ph.D. in Computer Science..."
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none dark:text-white"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* CAREER DETAILS */}
                    <section className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-6 flex items-center gap-2 italic">
                            <Plus size={14} /> Career Matrix & Expertise
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="md:col-span-1">
                                <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Experience (Years)</label>
                                <input 
                                    type="number" value={experienceYears} onChange={(e) => setExperienceYears(parseInt(e.target.value))}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 text-sm font-black focus:ring-2 focus:ring-red-500 outline-none dark:text-white"
                                />
                             </div>
                             <div className="md:col-span-2">
                                <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Areas of Expertise (Comma separated)</label>
                                <input 
                                    type="text" value={expertise} onChange={(e) => setExpertise(e.target.value)}
                                    placeholder="Machine Learning, Distributed Systems, IoT"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none dark:text-white italic"
                                />
                             </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-1">About Me (Bio)</label>
                                <textarea 
                                    rows="4" value={aboutMe} onChange={(e) => setAboutMe(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-[20px] p-4 text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none dark:text-white resize-none"
                                />
                            </div>
                            <div>
                                <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Professional Career Details</label>
                                <textarea 
                                    rows="4" value={careerDetails} onChange={(e) => setCareerDetails(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-[20px] p-4 text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none dark:text-white resize-none italic"
                                />
                            </div>
                        </div>
                    </section>

                    {/* SUBJECTS MGMT */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-6 flex items-center gap-2 italic">
                            <Book size={14} /> Module Assignments
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[32px] border border-gray-100 dark:border-gray-700">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {allCourses.map(course => {
                                    const isAssigned = selectedCourses.includes(course._id);
                                    return (
                                        <button key={course._id} 
                                            onClick={() => {
                                                if (isAssigned) setSelectedCourses(selectedCourses.filter(id => id !== course._id));
                                                else setSelectedCourses([...selectedCourses, course._id]);
                                            }}
                                            className={`p-4 rounded-2xl border text-left flex items-center justify-between group transition-all ${isAssigned ? 'bg-white dark:bg-gray-700 border-red-200 dark:border-red-900 shadow-md' : 'bg-transparent border-transparent hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                                            <div>
                                                <p className={`text-xs font-black uppercase tracking-tight ${isAssigned ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{course.name}</p>
                                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{course.code} • SEM {course.semester}</p>
                                            </div>
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isAssigned ? 'bg-red-600 border-red-600 shadow-lg shadow-red-500/30' : 'border-gray-200 dark:border-gray-600 group-hover:border-red-300'}`}>
                                                {isAssigned && <Plus size={14} className="text-white rotate-45" />}
                                            </div>
                                        </button>
                                    );
                                })}
                           </div>
                        </div>
                    </section>

                    {/* ATTENDANCE CALENDAR & REPORT (NEW) */}
                    <section className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-6 flex items-center gap-2 italic">
                            <Calendar size={14} /> Attendance Pulse & Annual Metrics
                        </h3>
                        <AdminAttendanceInsight userId={teacherId} type="teacher" user={user} />
                    </section>
                </div>

                <div className="p-8 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4 bg-gray-50/50 dark:bg-gray-800/30 text-sm">
                    <span className="mr-auto self-center text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Shield size={14} className="text-red-500" /> Administrative Protocol Node Alpha-7
                    </span>
                    <button onClick={onClose} className="px-6 py-4 font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">Abort</button>
                    <button onClick={handleSave} disabled={isSaving}
                        className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-500 shadow-xl shadow-red-500/20 flex items-center gap-2 disabled:bg-gray-400 transition-all active:scale-95">
                        <Save size={18}/> {isSaving ? 'Synchronizing...' : 'Save Configuration'}
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default AdminTeacherProfileModal;
