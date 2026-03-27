import { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Plus, X, Save,
  Calculator, Cpu, Code as CodeIcon, 
  ArrowRight, GraduationCap, 
  Activity, Zap, Layout, Building2, FlaskConical as Flask, Atom,
  Flag, Map, Compass, Target, Rocket, Star, Crown, Layers, Layers3 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Courses = () => {
  const { user } = useSelector(state => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSem, setActiveSem] = useState('All');

  const semesters = [
    { id: 'Sem-1', label: 'Semester 1', icon: Flag, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 group-hover:bg-emerald-100', active: 'bg-emerald-500 text-white shadow-emerald-500/30' },
    { id: 'Sem-2', label: 'Semester 2', icon: Map, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100', active: 'bg-blue-500 text-white shadow-blue-500/30' },
    { id: 'Sem-3', label: 'Semester 3', icon: Compass, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 group-hover:bg-cyan-100', active: 'bg-cyan-500 text-white shadow-cyan-500/30' },
    { id: 'Sem-4', label: 'Semester 4', icon: Target, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 group-hover:bg-indigo-100', active: 'bg-indigo-500 text-white shadow-indigo-500/30' },
    { id: 'Sem-5', label: 'Semester 5', icon: Rocket, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20 group-hover:bg-purple-100', active: 'bg-purple-500 text-white shadow-purple-500/30' },
    { id: 'Sem-6', label: 'Semester 6', icon: Zap, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 group-hover:bg-amber-100', active: 'bg-amber-500 text-white shadow-amber-500/30' },
    { id: 'Sem-7', label: 'Semester 7', icon: Star, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 group-hover:bg-orange-100', active: 'bg-orange-500 text-white shadow-orange-500/30' },
    { id: 'Sem-8', label: 'Semester 8', icon: Crown, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 group-hover:bg-rose-100', active: 'bg-rose-500 text-white shadow-rose-500/30' },
    { id: 'All', label: 'Master Sheet', icon: Layers3, color: 'text-gray-500 bg-gray-50 dark:bg-gray-800/50 group-hover:bg-gray-100', active: 'bg-gray-800 text-white shadow-gray-500/30' }
  ];
  const [courseType, setCourseType] = useState('all'); 
  const [search, setSearch] = useState('');
  const [liveCounts, setLiveCounts] = useState({});
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState(null);
  const [departments, setDepartments] = useState([]);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    credits: 3,
    department: '',
    semester: 1,
    type: 'theory',
    description: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const dept = localStorage.getItem('selectedDepartment');
    if (dept) setSelectedDept(JSON.parse(dept));

    const handleDeptUpdate = (e) => {
      setSelectedDept(e.detail);
    };

    window.addEventListener('smartlms:department_selected', handleDeptUpdate);
    return () => window.removeEventListener('smartlms:department_selected', handleDeptUpdate);
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const deptId = selectedDept?._id;
        const [coursesRes, deptsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/courses`, {
            params: { departmentId: deptId, semester: activeSem === 'All' ? undefined : activeSem.split('-')[1] },
            headers: { Authorization: `Bearer ${user.token}` }
          }),
          axios.get('http://localhost:5000/api/departments')
        ]);
        setCourses(coursesRes.data);
        setDepartments(deptsRes.data);
        if (!formData.department && deptsRes.data.length > 0) {
            setFormData(prev => ({ ...prev, department: deptsRes.data[0]._id }));
        }
      } catch (err) {
        console.error('Failed to fetch courses', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [user, selectedDept, activeSem]);

  useEffect(() => {
    // Polling actual online counts for all visible courses
    const fetchAllCounts = async () => {
      const counts = {};
      for (const course of courses) {
        try {
          const res = await axios.get(`http://localhost:5000/api/auth/course-activity/${course.code}`);
          counts[course.code] = res.data.onlineCount;
        } catch (err) { counts[course.code] = 0; }
      }
      setLiveCounts(counts);
    };

    fetchAllCounts();
    const interval = setInterval(fetchAllCounts, 15000);
    return () => clearInterval(interval);
  }, [courses]);

  const getCourseIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('chemistry')) return Flask;
    if (n.includes('math')) return Calculator;
    if (n.includes('electronic') || n.includes('electric')) return Cpu;
    if (n.includes('programming') || n.includes('computer')) return CodeIcon;
    if (n.includes('physics')) return Atom;
    if (n.includes('data structure') || n.includes('algorithm')) return Zap;
    return BookOpen;
  };

  const filteredCourses = (courses || []).filter(c => {
     if (activeSem !== 'All' && `Sem-${c.semester}` !== activeSem) return false;
     if (courseType !== 'all' && c.type !== courseType) return false;
     if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
     return true;
  }).sort((a, b) => (a.facultyAssigned?.[0]?.name || '').localeCompare(b.facultyAssigned?.[0]?.name || ''));

  const totalCredits = filteredCourses.reduce((sum, c) => sum + c.credits, 0);

  // Role Checks
  const isHOD = user?.role === 'hod' || user?.role === 'admin';

  const handleOpenModal = () => {
    setFormData({
      name: '',
      code: '',
      credits: 3,
      department: selectedDept?._id || departments[0]?._id || '',
      semester: activeSem === 'All' ? 1 : parseInt(activeSem.split('-')[1]),
      type: 'theory',
      description: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axios.post('http://localhost:5000/api/admin/courses', formData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('New academic module established.');
      setShowModal(false);
      // Re-fetch courses
      const deptId = selectedDept?._id;
      const res = await axios.get(`http://localhost:5000/api/courses`, {
        params: { departmentId: deptId, semester: activeSem === 'All' ? undefined : activeSem.split('-')[1] },
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCourses(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
    <div className="flex h-[calc(100vh-80px)] w-full bg-[#fafbfc] dark:bg-[#060811] overflow-hidden">
      
      {/* 1. ARCHITECTURAL SIDEBAR NAVIGATION */}
      <aside className={`h-full bg-white dark:bg-[#0b0f19] border-r border-gray-100 dark:border-gray-800 flex flex-col shrink-0 z-50 overflow-hidden shadow-2xl transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-20'}`}>
        <div className={`p-6 border-b border-gray-50 dark:border-gray-800/50 sticky top-0 bg-white dark:bg-[#0b0f19] z-20 ${sidebarOpen ? 'p-8 flex justify-between items-center' : 'p-4 flex justify-center'}`}>
          <div className="flex items-center gap-4 mb-2">
            <Link to="/dashboard" className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800/80 rounded-2xl text-gray-400 hover:text-primary-600 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700 shrink-0">
              <ArrowRight size={18} className="rotate-180" />
            </Link>
            <div className={`flex flex-col transition-opacity duration-200 ${sidebarOpen ? 'opacity-100 hidden sm:flex' : 'opacity-0 hidden'}`}>
              <span className="text-[8px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">Global Matrix</span>
              <span className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-tighter">Directory</span>
            </div>
          </div>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hidden lg:flex bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-primary-600 rounded-xl transition-all h-10 w-10 items-center justify-center"
            >
              <Layout size={18} />
            </button>
          )}
        </div>

        {!sidebarOpen && (
          <div className="px-4 pb-4 border-b border-gray-50 dark:border-gray-800/50 flex justify-center hidden lg:flex">
             <button
               onClick={() => setSidebarOpen(true)}
               className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-xl transition-all h-10 w-10 flex items-center justify-center"
             >
               <Layout size={18} />
             </button>
          </div>
        )}

        <nav className={`flex-1 py-8 space-y-2 overflow-y-auto min-h-0 custom-scrollbar pr-2 ${sidebarOpen ? 'px-6' : 'px-3'}`}>
             <p className={`text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap transition-opacity ${sidebarOpen ? 'opacity-100 mb-4 pl-4' : 'opacity-0 h-0 hidden'}`}>Semester Filter</p>
             {semesters.map((sem) => (
                <button 
                  key={sem.id} 
                  onClick={() => setActiveSem(sem.id)} 
                  className={`w-full flex items-center gap-4 relative rounded-2xl transition-all duration-300 group ${activeSem === sem.id ? sem.active + ' shadow-lg' : 'bg-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'} ${sidebarOpen ? 'px-4 py-2' : 'h-12 justify-center'}`}
                >
                  <div className={`flex items-center relative z-10 ${sidebarOpen ? 'w-full justify-between' : 'justify-center w-full'}`}>
                    <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
                      <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center transition-colors ${activeSem === sem.id ? 'bg-white/20 text-white' : sem.color}`}>
                        <sem.icon size={16} />
                      </div>
                      {sidebarOpen && (
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none whitespace-nowrap">{sem.label}</span>
                      )}
                    </div>
                    {activeSem === sem.id && sidebarOpen && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full relative z-10 animate-pulse" />
                    )}
                  </div>
                </button>
             ))}
             
             <div className={`pt-8 mt-8 border-t border-gray-100 dark:border-gray-800/10 space-y-2`}>
               <p className={`text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap transition-opacity ${sidebarOpen ? 'opacity-100 mb-4 pl-4' : 'opacity-0 h-0 hidden'}`}>Subject Protocol</p>
                {[
                  { id: 'all', label: 'All Protocols', icon: Layout },
                  { id: 'theory', label: 'Theory Matrix', icon: BookOpen },
                  { id: 'lab', label: 'Applied Lab', icon: Flask }
                ].map((type) => (
                  <button 
                    key={type.id} 
                    onClick={() => setCourseType(type.id)}
                    className={`w-full flex items-center gap-4 relative rounded-2xl transition-all duration-300 group ${courseType === type.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'} ${sidebarOpen ? 'px-4 py-2' : 'h-12 justify-center'}`}
                  >
                  <div className={`flex items-center relative z-10 ${sidebarOpen ? 'w-full justify-between' : 'justify-center w-full'}`}>
                    <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
                      <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center transition-colors ${courseType === type.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700'}`}>
                        <type.icon size={16} className={courseType === type.id ? 'text-white' : 'text-gray-400 dark:text-gray-500'} />
                      </div>
                      {sidebarOpen && (
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none whitespace-nowrap">{type.label}</span>
                      )}
                    </div>
                  </div>
                  </button>
                ))}
             </div>
        </nav>

        <div className={`border-t border-gray-100 dark:border-gray-800/50 ${sidebarOpen ? 'p-6' : 'p-3'}`}>
          <div className={`p-4 bg-primary-600 rounded-[2rem] text-white shadow-2xl shadow-primary-600/20 relative overflow-hidden group flex flex-col items-center justify-center ${sidebarOpen ? '' : 'h-14 w-full rounded-2xl'}`}>
             <div className={`relative z-10 w-full flex flex-col ${sidebarOpen ? 'items-start' : 'items-center'}`}>
                <p className={`text-[8px] font-black text-primary-200 uppercase tracking-widest ${sidebarOpen ? 'opacity-100 mb-1' : 'opacity-0 h-0 hidden'}`}>Selected Load</p>
                <div className="flex items-baseline gap-2 mt-1">
                   <span className={`font-black tracking-tighter ${sidebarOpen ? 'text-2xl' : 'text-sm'}`}>{totalCredits}</span>
                   <span className={`text-[8px] font-black uppercase opacity-60 ${sidebarOpen ? 'opacity-100' : 'opacity-0 h-0 hidden'}`}>Cr</span>
                </div>
             </div>
             {sidebarOpen && <GraduationCap size={40} className="absolute -bottom-2 -right-2 opacity-15 group-hover:scale-110 transition-transform" />}
          </div>
        </div>
      </aside>

      {/* SCROLLABLE CONTENT AREA */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-[#060811] flex flex-col transition-all">
         
      {/* COMPACT TOP NAVIGATION / SEARCH */}
      <header className="sticky top-0 z-20 px-8 py-5 bg-white/80 dark:bg-[#060811]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
               <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{selectedDept?.code || 'GEN'} / {activeSem}</p>
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
               {selectedDept?.name || 'All Departments'}
            </h2>
         </div>

         <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative group md:w-72">
               <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-primary-500 transition-colors" />
               <input 
                 type="text" 
                 value={search} 
                 onChange={e=>setSearch(e.target.value)} 
                 placeholder="Search curriculum..." 
                 className="w-full bg-gray-50 dark:bg-gray-800/50 pl-12 pr-4 py-3 rounded-xl outline-none text-[10px] font-black uppercase tracking-widest placeholder:text-gray-400 dark:placeholder:text-gray-600 border border-transparent focus:border-primary-500/30 transition-all" 
               />
            </div>
            {isHOD && (
               <button 
                 onClick={handleOpenModal}
                 className="hidden xl:flex items-center gap-2 px-5 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:bg-primary-600 hover:text-white transition-all whitespace-nowrap"
               >
                  <Plus size={14} /> Subject
               </button>
            )}
         </div>
      </header>

         {/* COURSE FLEET */}
         <div className="p-8 pb-32">
            <div className="flex items-center justify-between mb-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                     <BookOpen size={20} />
                  </div>
                  <div className="flex flex-col">
                     <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Fleet Inventory</h3>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Operational Manifest</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                   <Activity size={14} className="text-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{filteredCourses.length} Deployments Active</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
               <AnimatePresence mode="popLayout">
                 {loading ? (
                   <div className="col-span-full py-20 flex flex-col items-center gap-4">
                     <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                     <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Accessing Mainframe...</p>
                   </div>
                 ) : filteredCourses.length === 0 ? (
                   <div className="col-span-full py-20 text-center">
                     <p className="text-base font-black text-gray-400 uppercase tracking-widest">No subjects found in this matrix</p>
                   </div>
                 ) : (
                   filteredCourses.map((course) => {
                     const Icon = getCourseIcon(course.name);
                     const activeNow = liveCounts[course.code] || 0;
                     const facultyName = course.facultyAssigned?.[0]?.name || 'Staff';
                     
                     return (
                       <motion.div 
                         key={course._id} 
                         layout 
                         initial={{ opacity: 0, scale: 0.95 }} 
                         animate={{ opacity: 1, scale: 1 }} 
                         exit={{ opacity: 0, scale: 0.9 }} 
                         className="group"
                       >
                          <Link to={`/course-inner/${course.code}`} className="block h-full">
                             <div className="h-full glass rounded-[2.5rem] border border-transparent dark:border-gray-800 bg-white dark:bg-[#0d101a] p-8 transition-all duration-300 hover:shadow-2xl hover:border-primary-500/30 hover:-translate-y-1.5 flex flex-col relative overflow-hidden">
                                
                                <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-800/50">
                                   <Activity size={10} className="animate-pulse"/>
                                   <span className="text-[8px] font-black uppercase tracking-widest">{activeNow} LIVE</span>
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${course.type === 'lab' ? 'bg-amber-500 text-white' : 'bg-primary-600 text-white'}`}>
                                      <Icon size={28} />
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{course.code}</span>
                                      <div className="flex items-center gap-2.5">
                                         <span className="text-xs font-black dark:text-white uppercase tracking-tighter">CREDITS: {course.credits}</span>
                                         <div className={`w-1.5 h-1.5 rounded-full ${course.type === 'lab' ? 'bg-amber-500' : 'bg-primary-500'}`}></div>
                                         <span className={`text-[9px] font-black uppercase ${course.type === 'lab' ? 'text-amber-500' : 'text-primary-500'}`}>{course.type}</span>
                                      </div>
                                   </div>
                                </div>

                                <div className="flex-1">
                                   <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tighter mb-3 group-hover:text-primary-600 transition-colors">
                                      {course.name}
                                   </h3>
                                   <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-6 leading-relaxed line-clamp-2">
                                      {course.description || `Master the fundamentals of ${course.name} with our elite curriculum matrix.`}
                                   </p>
                                </div>

                                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white text-[10px] font-black shadow-inner">
                                         {facultyName.split(' ').map(n=>n[0]).join('')}
                                      </div>
                                      <p className="text-xs font-black dark:text-white uppercase truncate max-w-[120px] leading-none">{facultyName}</p>
                                   </div>
                                   <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:bg-primary-600 group-hover:text-white transition-all flex items-center justify-center">
                                      <ArrowRight size={18} />
                                   </div>
                                </div>
                             </div>
                          </Link>
                       </motion.div>
                     );
                   })
                 )}
               </AnimatePresence>
            </div>
         </div>
      </main>
    </div>
    
    {/* Course Establishment Modal */}
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 backdrop-blur-xl bg-black/60">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white dark:bg-[#0b0f19] w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
          >
            <div className="relative p-10 md:p-12">
               <button 
                 onClick={() => setShowModal(false)}
                 className="absolute top-8 right-8 p-3 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-2xl transition-all"
               >
                 <X size={24} />
               </button>

               <div className="mb-10">
                 <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter">
                   Establish New Module
                 </h2>
                 <p className="text-gray-500 font-medium uppercase text-xs tracking-[0.2em] mt-2">
                   Defining new curriculum parameters for {selectedDept?.code || 'Global'} Sector
                 </p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Unit Title</label>
                       <input 
                         required 
                         type="text" 
                         placeholder="Data Science..."
                         value={formData.name}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                         className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-gray-800 rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all dark:text-white"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Unit Code</label>
                       <input 
                         required 
                         type="text" 
                         placeholder="CS301"
                         value={formData.code}
                         style={{ textTransform: 'uppercase' }}
                         onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                         className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-gray-800 rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all dark:text-white"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Academic Sector</label>
                       <select 
                         required
                         value={formData.department}
                         onChange={(e) => setFormData({...formData, department: e.target.value})}
                         className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-primary-500 rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all dark:text-white"
                       >
                         {departments.map(d => (
                           <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                         ))}
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Semester Cycle</label>
                       <select 
                         required
                         value={formData.semester}
                         onChange={(e) => setFormData({...formData, semester: parseInt(e.target.value)})}
                         className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-primary-500 rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all dark:text-white"
                       >
                         {[1,2,3,4,5,6,7,8].map(s => (
                           <option key={s} value={s}>Semester {s}</option>
                         ))}
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Credit Weight</label>
                       <input 
                         required 
                         type="number" 
                         min="1" max="6"
                         value={formData.credits}
                         onChange={(e) => setFormData({...formData, credits: parseInt(e.target.value)})}
                         className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-gray-800 rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all dark:text-white"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Delivery Type</label>
                       <select 
                         required
                         value={formData.type}
                         onChange={(e) => setFormData({...formData, type: e.target.value})}
                         className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-primary-500 rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all dark:text-white"
                       >
                         <option value="theory">Theory Unit</option>
                         <option value="lab">Laboratory Unit</option>
                         <option value="project">Project / Studio Unit</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Unit Description</label>
                   <textarea 
                     rows="3"
                     placeholder="Outline objectives..."
                     value={formData.description}
                     onChange={(e) => setFormData({...formData, description: e.target.value})}
                     className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-primary-500 rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all dark:text-white resize-none"
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
                      disabled={isSaving}
                      className="flex-[2] py-5 bg-primary-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-primary-500 shadow-2xl shadow-primary-500/20 transition-all flex items-center justify-center gap-3 disabled:bg-gray-400"
                    >
                      <Save size={20} /> {isSaving ? 'Establishing...' : 'Confirm Module'}
                    </button>
                 </div>
               </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
   );
};

export default Courses;
