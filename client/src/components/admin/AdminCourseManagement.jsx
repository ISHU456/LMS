import { useState, useEffect } from 'react';
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
  const [filterDept, setFilterDept] = useState('all');
  const [filterSem, setFilterSem] = useState('all');
  
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
    description: ''
  });

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, deptsRes] = await Promise.all([
        axios.get('http://localhost:5001/api/admin/courses', {
          headers: { Authorization: `Bearer ${user.token}` }
        }),
        axios.get('http://localhost:5001/api/departments')
      ]);
      setCourses(coursesRes.data);
      setDepartments(deptsRes.data);
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
        description: course.description || ''
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
        description: ''
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
    return matchesSearch && matchesDept && matchesSem;
  });

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
        <div className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800 flex items-center gap-6">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-600 dark:text-red-400 font-bold shrink-0">
            <BookOpen size={28} className="lg:hidden"/><BookOpen size={32} className="hidden lg:block" />
          </div>
          <div>
            <p className="text-[10px] lg:text-xs uppercase tracking-widest text-gray-500 font-black mb-1">Total Subjects</p>
            <h3 className="text-2xl lg:text-3xl font-black dark:text-white">{courses.length}</h3>
          </div>
        </div>
        
        <div className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800 flex items-center gap-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400 font-bold shrink-0">
            <Layers size={28} className="lg:hidden"/><Layers size={32} className="hidden lg:block" />
          </div>
          <div>
            <p className="text-[10px] lg:text-xs uppercase tracking-widest text-gray-500 font-black mb-1">Active Sectors</p>
            <h3 className="text-2xl lg:text-3xl font-black dark:text-white">{departments.length}</h3>
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-1 flex items-center justify-end">
          <button 
            onClick={() => handleOpenModal()}
            className="w-full lg:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-red-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-red-500 hover:shadow-[0_20px_40px_-10px_rgba(220,38,38,0.3)] transition-all transform hover:-translate-y-1"
          >
            <Plus size={24} strokeWidth={3} /> Establish Course
          </button>
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
                        className="flex lg:hidden items-center justify-center gap-3 px-8 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-500 shadow-lg active:scale-95 transition-all"
                    >
                        <Plus size={18} strokeWidth={3} /> New Module
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
                            <option value="all">Full Cycle</option>
                            {[1,2,3,4,5,6,7,8].map(s => (
                                <option key={s} value={s.toString()}>Cycle {s}</option>
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
                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 border-b border-gray-100 dark:border-gray-800">Academic Lattice</th>
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
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] italic">Cycle {course.semester}</span>
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
                                        <div className="flex -space-x-3 overflow-hidden group/staff">
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
                                        </div>
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

      {/* Establishment/Override Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 backdrop-blur-xl bg-black/60 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="relative p-10 md:p-12">
               <button 
                 onClick={() => setShowModal(false)}
                 className="absolute top-8 right-8 p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
               >
                 <X size={24} />
               </button>

               <div className="mb-10">
                 <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter">
                   {editingCourse ? 'Alter Course Data' : 'Establish New Module'}
                 </h2>
                 <p className="text-gray-500 font-medium uppercase text-xs tracking-[0.2em] mt-2">
                   {editingCourse ? 'Modifying existing academic structure' : 'Defining new curriculum parameters'}
                 </p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Unit Title</label>
                       <div className="relative">
                         <Book className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                         <input 
                           required 
                           type="text" 
                           placeholder="Data Science..."
                           value={formData.name}
                           onChange={(e) => setFormData({...formData, name: e.target.value})}
                           className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-gray-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none transition-all dark:text-white"
                         />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Unit Code</label>
                       <div className="relative">
                         <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                         <input 
                           required 
                           type="text" 
                           placeholder="CS301"
                           value={formData.code}
                           style={{ textTransform: 'uppercase' }}
                           onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                           className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-gray-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none transition-all dark:text-white"
                         />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Academic Sector</label>
                       <div className="relative">
                         <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                         <select 
                           required
                           value={formData.department}
                           onChange={(e) => setFormData({...formData, department: e.target.value})}
                           className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-gray-800 rounded-2xl pl-12 pr-12 py-4 text-sm font-bold outline-none transition-all dark:text-white appearance-none"
                         >
                           <option value="" disabled>Select Department</option>
                           {departments.map(d => (
                             <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                           ))}
                         </select>
                         <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={18} />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Semester Cycle</label>
                       <div className="relative">
                         <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                         <select 
                           required
                           value={formData.semester}
                           onChange={(e) => setFormData({...formData, semester: parseInt(e.target.value)})}
                           className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-gray-800 rounded-2xl pl-12 pr-12 py-4 text-sm font-bold outline-none transition-all dark:text-white appearance-none"
                         >
                           {[1,2,3,4,5,6,7,8].map(s => (
                             <option key={s} value={s}>Semester {s}</option>
                           ))}
                         </select>
                         <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={18} />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Credit Weight</label>
                       <div className="relative">
                         <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                         <input 
                           required 
                           type="number" 
                           min="1" max="6"
                           value={formData.credits}
                           onChange={(e) => setFormData({...formData, credits: parseInt(e.target.value)})}
                           className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-gray-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none transition-all dark:text-white"
                         />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Delivery Type</label>
                       <div className="relative">
                         <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                         <select 
                           required
                           value={formData.type}
                           onChange={(e) => setFormData({...formData, type: e.target.value})}
                           className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-gray-800 rounded-2xl pl-12 pr-12 py-4 text-sm font-bold outline-none transition-all dark:text-white appearance-none"
                         >
                           <option value="THEORY">Theory Unit</option>
                           <option value="PRACTICAL">Laboratory Unit (Practical)</option>
                           <option value="VIVA">Viva / Studio Unit</option>
                         </select>
                         <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={18} />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Unit Description</label>
                   <textarea 
                     rows="3"
                     placeholder="Outline the core objectives and scope of this module..."
                     value={formData.description}
                     onChange={(e) => setFormData({...formData, description: e.target.value})}
                     className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-gray-800 rounded-3xl p-6 text-sm font-bold outline-none transition-all dark:text-white resize-none"
                   ></textarea>
                 </div>

                 <div className="flex gap-4 pt-6">
                    <button 
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-3xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-5 bg-red-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-red-500 hover:shadow-2xl transition-all flex items-center justify-center gap-3"
                    >
                      <Save size={20} /> {editingCourse ? 'Update Module' : 'Establish Module'}
                    </button>
                 </div>
               </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourseManagement;
