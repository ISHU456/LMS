import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, Plus, Search, Edit2, Trash2, Filter, 
  ChevronRight, Book, Layers, GraduationCap, Building,
  Hash, Clock, CheckCircle2, AlertCircle, X, Save, RefreshCw
} from 'lucide-react';
import axios from 'axios';

const AdminCourseManagement = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [filterDept, setFilterDept] = useState('all');
  const [filterSem, setFilterSem] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    credits: 3,
    department: '',
    semester: 1,
    type: 'THEORY',
    description: '',
    facultyAssigned: []
  });

  const [notification, setNotification] = useState(null);
  const [viewingStaffFor, setViewingStaffFor] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, deptsRes, teachersRes] = await Promise.all([
        axios.get('http://localhost:5001/api/admin/courses', {
          headers: { Authorization: `Bearer ${user.token}` }
        }),
        axios.get('http://localhost:5001/api/departments'),
        axios.get('http://localhost:5001/api/admin/users?role=teacher', {
          headers: { Authorization: `Bearer ${user.token}` }
        })
      ]);
      setCourses(coursesRes.data);
      setDepartments(deptsRes.data);
      setTeachers(teachersRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
      showNotification('error', 'Protocol failure: Could not reach central data core.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleOpenModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        name: course.name,
        code: course.code,
        credits: course.credits,
        department: course.department._id || course.department,
        semester: course.semester,
        type: course.type,
        description: course.description || '',
        facultyAssigned: (course.facultyAssigned || []).map(f => f._id || f)
      });
    } else {
      setEditingCourse(null);
      setFormData({
        name: '',
        code: '',
        credits: 3,
        department: departments[0]?._id || '',
        semester: 1,
        type: 'THEORY',
        description: '',
        facultyAssigned: []
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await axios.put(`http://localhost:5001/api/admin/courses/${editingCourse._id}`, formData, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        showNotification('success', 'Course architecture synchronized successfully.');
      } else {
        await axios.post('http://localhost:5001/api/admin/courses', formData, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        showNotification('success', 'New academic module established.');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to eliminate this course from the system?')) return;
    try {
      await axios.delete(`http://localhost:5001/api/admin/courses/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      showNotification('success', 'Course purged from central database.');
      fetchData();
    } catch (err) {
      showNotification('error', 'Decommissioning failed.');
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          course.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'all' || (course.department?._id === filterDept || course.department === filterDept);
    const matchesSem = filterSem === 'all' || course.semester.toString() === filterSem;
    const matchesCourse = filterCourse === 'all' || course._id === filterCourse;
    return matchesSearch && matchesDept && matchesSem && matchesCourse;
  }).sort((a, b) => a.semester - b.semester);

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-24 right-8 z-[60] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-300 ${
          notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <p className="font-bold text-sm uppercase tracking-wider">{notification.message}</p>
        </div>
      )}

      {/* Header & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="sm:col-span-2 lg:col-span-1 flex items-center justify-start order-first">
          <button 
            onClick={() => handleOpenModal()}
            className="w-full lg:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-indigo-500 hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] transition-all transform hover:-translate-y-1"
          >
            <Plus size={24} strokeWidth={3} /> Add New Course
          </button>
        </div>

        <div className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800 flex items-center gap-6">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
            <BookOpen size={28} className="lg:hidden"/><BookOpen size={32} className="hidden lg:block" />
          </div>
          <div>
            <p className="text-[10px] lg:text-xs uppercase tracking-widest text-gray-500 font-black mb-1">Total Subjects</p>
            <h3 className="text-2xl lg:text-3xl font-black dark:text-white">{courses.length}</h3>
          </div>
        </div>
        
        <div className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800 flex items-center gap-6">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
            <Layers size={28} className="lg:hidden"/><Layers size={32} className="hidden lg:block" />
          </div>
          <div>
            <p className="text-[10px] lg:text-xs uppercase tracking-widest text-gray-500 font-black mb-1">Academic Departments</p>
            <h3 className="text-2xl lg:text-3xl font-black dark:text-white">{departments.length}</h3>
          </div>
        </div>
      </div>

            <div className="bg-white dark:bg-gray-900 p-5 lg:p-8 rounded-[2rem] lg:rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
                    <div className="flex-1 min-w-0 lg:max-w-2xl relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Universal Curriculum Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl pl-12 pr-6 py-4 text-[9px] font-black uppercase tracking-widest focus:ring-2 focus:ring-red-500/20 outline-none transition-all dark:text-white shadow-inner"
                        />
                    </div>
                    
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex lg:hidden items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 shadow-lg active:scale-95 transition-all"
                    >
                        <Plus size={18} strokeWidth={3} /> Add Course
                    </button>
                </div>

                <div className="pt-6 border-t border-gray-50 dark:border-gray-800 flex flex-wrap lg:flex-nowrap gap-3 lg:gap-4 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 custom-scrollbar">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 focus-within:border-red-500/50 transition-all shrink-0">
                        <Building size={14} className="text-gray-400" />
                        <select 
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="bg-transparent text-[9px] font-black uppercase tracking-widest dark:text-gray-300 outline-none appearance-none cursor-pointer pr-2"
                        >
                            <option value="all">Global Sectors</option>
                            {departments.map(d => (
                                <option key={d._id} value={d._id}>{d.code} NODE</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 focus-within:border-red-500/50 transition-all">
                        <GraduationCap size={14} className="text-gray-400" />
                        <select 
                            value={filterSem}
                            onChange={(e) => setFilterSem(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest dark:text-gray-300 outline-none appearance-none cursor-pointer pr-2"
                        >
                            <option value="all">Full Curriculum</option>
                            {[1,2,3,4,5,6,7,8].map(s => (
                                <option key={s} value={s.toString()}>SEM {s}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 focus-within:border-red-500/50 transition-all shrink-0">
                        <Book size={14} className="text-gray-400" />
                        <select 
                            value={filterCourse}
                            onChange={(e) => setFilterCourse(e.target.value)}
                            className="bg-transparent text-[9px] font-black uppercase tracking-widest dark:text-gray-300 outline-none appearance-none cursor-pointer pr-2 max-w-[150px]"
                        >
                            <option value="all">Select Course</option>
                            {courses.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="ml-auto hidden xl:flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Live Registry Sync</span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#080c14] rounded-[2.5rem] lg:rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden relative">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/80 dark:bg-gray-900/50 backdrop-blur-md">
                            <tr>
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 border-b border-gray-100 dark:border-gray-800">Operational Unit</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 border-b border-gray-100 dark:border-gray-800">Course Management</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 border-b border-gray-100 dark:border-gray-800">Core Weight</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 border-b border-gray-100 dark:border-gray-800">Personnel</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 border-b border-gray-100 dark:border-gray-800 text-right">Protocol</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-24 text-center">
                                        <RefreshCw className="mx-auto text-red-500 animate-spin mb-4" size={32} />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Synchronizing with central matrix...</p>
                                    </td>
                                </tr>
                            ) : filteredCourses.length > 0 ? filteredCourses.map(course => (
                                <tr key={course._id} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-all">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 lg:w-12 lg:h-12 bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl flex items-center justify-center text-white font-black text-[10px] shadow-lg shadow-red-600/20 group-hover:scale-110 transition-all">
                                                {course.code.slice(0, 2)}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-black text-[13px] text-gray-900 dark:text-white group-hover:text-red-500 transition-colors uppercase tracking-tight truncate max-w-[200px]">{course.name}</h4>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{course.code}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <Building size={11} className="text-gray-400" />
                                                <span className="text-[9px] font-black dark:text-gray-300 uppercase tracking-widest">{course.department?.code || 'GLB'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <GraduationCap size={11} className="text-gray-400" />
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] italic">SEM {course.semester}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <span className="w-full px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                                                {course.credits} UNIT
                                            </span>
                                            <span className="w-full px-3 py-1 bg-slate-500/10 text-slate-500 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                                {course.type}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <button 
                                            onClick={() => setViewingStaffFor(course)}
                                            className="flex -space-x-3 overflow-hidden group/staff hover:scale-105 transition-transform active:scale-95"
                                        >
                                            {course.facultyAssigned?.length > 0 ? (
                                                course.facultyAssigned.map((f, i) => (
                                                    <div key={i} className="h-9 w-9 rounded-xl ring-2 ring-white dark:ring-[#080c14] bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[9px] font-black uppercase overflow-hidden border border-gray-100 dark:border-gray-700 group-hover/staff:translate-x-1 transition-all" title={f.name}>
                                                        {f.profilePic ? <img src={f.profilePic} className="w-full h-full object-cover" alt="User" /> : f.name[0]}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/5 rounded-xl border border-rose-500/20">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                    <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">UNSTAFFED</span>
                                                </div>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2 group-hover:bg-gray-50/80 dark:group-hover:bg-white/5 p-1 rounded-2xl transition-all">
                                            <button 
                                                onClick={() => handleOpenModal(course)}
                                                className="p-3 bg-white dark:bg-gray-800 text-indigo-500 rounded-xl hover:bg-indigo-600 hover:text-white hover:shadow-lg transition-all border border-indigo-100 dark:border-indigo-900/50"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(course._id)}
                                                className="p-3 bg-white dark:bg-gray-800 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white hover:shadow-lg transition-all border border-rose-100 dark:border-rose-900/50"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="py-24 text-center">
                                        <BookOpen size={48} className="mx-auto text-gray-200 dark:text-gray-800 mb-4 opacity-50" strokeWidth={1} />
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 italic">Curriculum repository is currently vacant.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

      {showModal && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 md:p-12 lg:p-20 backdrop-blur-2xl bg-slate-950/60 animate-in fade-in duration-500 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-[#0f172a] w-full max-w-2xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden border border-white/10 flex flex-col max-h-[85vh] relative mt-12 md:mt-16 ring-1 ring-black/5"
          >
            {/* Modal Header Accent */}
            <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
            
            <div className="relative p-10 md:p-12 flex-1 overflow-y-auto custom-scrollbar">
               <button 
                 onClick={() => setShowModal(false)}
                 className="absolute top-8 right-8 p-3 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group"
               >
                 <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
               </button>

               <div className="mb-12">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                        Academic Core Management
                    </div>
                 </div>
                 <h2 className="text-4xl font-black dark:text-white uppercase tracking-tighter leading-none">
                   {editingCourse ? 'Reform Module' : 'Forge Curriculum'}
                 </h2>
                 <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-3 italic opacity-70">
                   {editingCourse ? 'Synchronizing existing infrastructural nodes' : 'Initializing new academic protocols'}
                 </p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-8 pb-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Curricular Designation</label>
                       <div className="relative group">
                         <Book className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                         <input 
                           required 
                           type="text" 
                           placeholder="Ex: Advanced Neurocomputing..."
                           value={formData.name}
                           onChange={(e) => setFormData({...formData, name: e.target.value})}
                           className="w-full bg-gray-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-800 rounded-[20px] pl-14 pr-6 py-5 text-sm font-black outline-none transition-all dark:text-white shadow-inner"
                         />
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">System Identification Hash</label>
                       <div className="relative group">
                         <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                         <input 
                           required 
                           type="text" 
                           placeholder="CS-402..."
                           value={formData.code}
                           style={{ textTransform: 'uppercase' }}
                           onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                           className="w-full bg-gray-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-800 rounded-[20px] pl-14 pr-6 py-5 text-sm font-black outline-none transition-all dark:text-white shadow-inner"
                         />
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Departmental Sector</label>
                       <div className="relative group">
                         <Building className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                         <select 
                           required
                           value={formData.department}
                           onChange={(e) => setFormData({...formData, department: e.target.value})}
                           className="w-full bg-gray-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-800 rounded-[20px] pl-14 pr-12 py-5 text-sm font-black outline-none transition-all dark:text-white appearance-none cursor-pointer shadow-inner"
                         >
                           <option value="" disabled>Select Sector</option>
                           {departments.map(d => (
                             <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                           ))}
                         </select>
                         <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 rotate-90" size={18} />
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Progression Stage</label>
                       <div className="relative group">
                         <GraduationCap className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                         <select 
                           required
                           value={formData.semester}
                           onChange={(e) => setFormData({...formData, semester: parseInt(e.target.value)})}
                           className="w-full bg-gray-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-800 rounded-[20px] pl-14 pr-12 py-5 text-sm font-black outline-none transition-all dark:text-white appearance-none cursor-pointer shadow-inner"
                         >
                           {[1,2,3,4,5,6,7,8].map(s => (
                             <option key={s} value={s}>SEM {s}</option>
                           ))}
                         </select>
                         <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 rotate-90" size={18} />
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Curricular Weight</label>
                       <div className="relative group">
                         <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                         <input 
                           required 
                           type="number" 
                           min="1" max="6"
                           value={formData.credits}
                           onChange={(e) => setFormData({...formData, credits: parseInt(e.target.value)})}
                           className="w-full bg-gray-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-800 rounded-[20px] pl-14 pr-6 py-5 text-sm font-black outline-none transition-all dark:text-white shadow-inner"
                         />
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Modal Class</label>
                       <div className="relative group">
                         <Layers className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                         <select 
                           required
                           value={formData.type}
                           onChange={(e) => setFormData({...formData, type: e.target.value})}
                           className="w-full bg-gray-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-800 rounded-[20px] pl-14 pr-12 py-5 text-sm font-black outline-none transition-all dark:text-white appearance-none cursor-pointer shadow-inner"
                         >
                           <option value="THEORY">Theoretical Domain</option>
                           <option value="PRACTICAL">Experimental Laboratory</option>
                           <option value="VIVA">Examination Studio (Viva)</option>
                         </select>
                         <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 rotate-90" size={18} />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4 pt-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-4 flex items-center gap-2 italic">
                        <Plus size={14} /> Personnel Allocation Matrix
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-800/30 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 max-h-[220px] overflow-y-auto custom-scrollbar shadow-inner">
                       {teachers.length > 0 ? teachers.map(teacher => {
                         const isAssigned = formData.facultyAssigned.includes(teacher._id);
                         return (
                           <button 
                             key={teacher._id}
                             type="button"
                             onClick={() => {
                               if (isAssigned) setFormData({...formData, facultyAssigned: formData.facultyAssigned.filter(id => id !== teacher._id)});
                               else setFormData({...formData, facultyAssigned: [...formData.facultyAssigned, teacher._id]});
                             }}
                             className={`flex items-center gap-4 p-4 rounded-[20px] border-2 transition-all text-left group ${isAssigned ? 'bg-white dark:bg-slate-700 border-indigo-500 shadow-lg shadow-indigo-500/10' : 'bg-transparent border-transparent hover:bg-white/50 dark:hover:bg-slate-800/50'}`}
                           >
                              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-600 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-110 transition-transform">
                                 {teacher.profilePic ? <img src={teacher.profilePic} className="w-full h-full object-cover" /> : <span className="text-xs font-black">{teacher.name[0]}</span>}
                              </div>
                              <div className="min-w-0">
                                 <p className={`text-xs font-black uppercase truncate tracking-tight ${isAssigned ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{teacher.name}</p>
                                 <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{teacher.department}</p>
                              </div>
                              {isAssigned && <CheckCircle2 className="ml-auto text-emerald-500" size={18} />}
                           </button>
                         );
                       }) : (
                         <div className="col-span-2 text-center py-8">
                            <AlertCircle className="mx-auto text-gray-300 mb-3" size={32} />
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 italic">Personnel core is currently detached.</p>
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="space-y-4 pt-4">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2 flex items-center gap-2 italic">
                       Curricular Synopsis
                   </h3>
                   <textarea 
                     rows="4"
                     placeholder="Detailed administrative outline for this academic node..."
                     value={formData.description}
                     onChange={(e) => setFormData({...formData, description: e.target.value})}
                     className="w-full bg-gray-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-800 rounded-[24px] p-6 text-xs font-bold outline-none transition-all dark:text-white resize-none shadow-inner italic"
                   ></textarea>
                 </div>

                 <div className="flex gap-4 pt-10">
                    <button 
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-5 px-8 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                    >
                      Abort Mission
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-5 px-8 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-500 shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      <Save size={18} /> {editingCourse ? 'Reform Parameters' : 'Authorize Protocol'}
                    </button>
                 </div>
               </form>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Staff Roster View Modal */}
      {viewingStaffFor && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-2xl bg-slate-950/70 animate-in fade-in duration-300">
           <motion.div 
             initial={{ opacity: 0, scale: 0.95, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden relative mt-12 md:mt-16 overflow-hidden"
           >
              {/* Header Accent */}
              <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-indigo-500" />

              <div className="p-10 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                  <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <h3 className="text-xs font-black dark:text-white uppercase tracking-[0.3em] opacity-50">Personnel Node</h3>
                      </div>
                      <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter leading-none">{viewingStaffFor.name}</h2>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">{viewingStaffFor.code}</p>
                  </div>
                  <button onClick={() => setViewingStaffFor(null)} className="p-4 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all group">
                    <X size={20} className="group-hover:rotate-90 transition-transform" />
                  </button>
              </div>

              <div className="p-8 space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar">
                  {viewingStaffFor.facultyAssigned?.length > 0 ? viewingStaffFor.facultyAssigned.map((staff, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="flex items-center gap-5 p-5 rounded-[24px] bg-gray-50 dark:bg-slate-800/50 border border-transparent hover:border-indigo-500/20 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-default group"
                      >
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 p-0.5 shadow-lg group-hover:rotate-3 transition-transform">
                              <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                                  {staff.profilePic ? <img src={staff.profilePic} className="w-full h-full object-cover" /> : <span className="text-xl font-black text-indigo-500">{staff.name[0]}</span>}
                              </div>
                          </div>
                          <div className="min-w-0 flex-1">
                              <p className="font-black text-[15px] dark:text-white uppercase tracking-tight truncate leading-none">{staff.name}</p>
                              <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
                                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest truncate">{staff.email}</p>
                              </div>
                              {staff.department && (
                                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md">
                                    <Building size={10} className="text-gray-400" />
                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{staff.department} UNIT</span>
                                </div>
                              )}
                          </div>
                      </motion.div>
                  )) : (
                      <div className="text-center py-20 px-10">
                          <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mx-auto mb-6 shrink-0">
                            <AlertCircle className="text-gray-200 dark:text-gray-800" size={48} />
                          </div>
                          <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] italic mb-2">Node Detached</p>
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">No administrative personnel have been assigned to this curricular module.</p>
                      </div>
                  )}
              </div>
              
              <div className="p-8 bg-gray-50 dark:bg-gray-800/30">
                  <button onClick={() => setViewingStaffFor(null)} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[20px] font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] transition-all active:scale-95 shadow-lg">Dismiss Data Node</button>
              </div>
           </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminCourseManagement;
