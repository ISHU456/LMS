import { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Plus, X, Save,
  Calculator, Cpu, Code as CodeIcon, 
  ArrowRight, GraduationCap, Eye,
  Activity, Zap, Layout, Building2, FlaskConical as Flask, Atom,
  Flag, Map, Compass, Target, Rocket, Star, Crown, Layers, Layers3, Lock, CheckCircle2 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Courses = ({ isEmbedded = false }) => {
  const { user } = useSelector(state => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024 && !isEmbedded);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeSem, setActiveSem] = useState(() => localStorage.getItem('courses_active_sem') || 'All');

  useEffect(() => {
    localStorage.setItem('courses_active_sem', activeSem);
  }, [activeSem]);

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
          axios.get(`http://localhost:5001/api/courses`, {
            params: { departmentId: deptId, semester: activeSem === 'All' ? undefined : activeSem.split('-')[1] },
            headers: { Authorization: `Bearer ${user.token}` }
          }),
          axios.get('http://localhost:5001/api/departments')
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
    const fetchAllCounts = async () => {
      const counts = {};
      for (const course of courses) {
        try {
          const res = await axios.get(`http://localhost:5001/api/auth/course-activity/${course.code}`);
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

  const isTeacher = user?.role === 'teacher';
  const isHOD = user?.role === 'hod' || user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const isSemLocked = (semId) => {
    if (!isStudent || semId === 'All') return false;
    const semNum = parseInt(semId.split('-')[1]);
    return semNum > (user.semester || 1);
  };

  const isSemCompleted = (semId) => {
    if (!isStudent || semId === 'All') return false;
    const semNum = parseInt(semId.split('-')[1]);
    return semNum < (user.semester || 1);
  };

  const filteredCourses = (courses || []).filter(c => {
     if (activeSem !== 'All' && `Sem-${c.semester}` !== activeSem) return false;
     // Students can see current and previous semesters, but not future ones
     if (isStudent && c.semester > (user?.semester || 1)) return false;
     if (courseType !== 'all' && c.type !== courseType) return false;
     if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
     return true;
  }).sort((a, b) => {
    if (isTeacher) {
      const aAssigned = a.facultyAssigned?.some(f => (f._id || f) === user?._id);
      const bAssigned = b.facultyAssigned?.some(f => (f._id || f) === user?._id);
      if (aAssigned && !bAssigned) return -1;
      if (!aAssigned && bAssigned) return 1;
    }
    return (a.name || '').localeCompare(b.name || '');
  });

  const totalCredits = filteredCourses.reduce((sum, c) => sum + c.credits, 0);

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
      await axios.post('http://localhost:5001/api/admin/courses', formData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('New academic module established.');
      setShowModal(false);
      const res = await axios.get(`http://localhost:5001/api/courses`, {
        params: { departmentId: selectedDept?._id, semester: activeSem === 'All' ? undefined : activeSem.split('-')[1] },
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCourses(res.data);
    } catch (err) { alert('Operation failed.'); }
    finally { setIsSaving(false); }
  };

  return (
    <>
    <div className={`flex ${isEmbedded ? 'h-full' : 'h-[calc(100vh-80px)]'} w-full bg-[#fafbfc] dark:bg-[#060811] overflow-hidden`}>
      
      {!isEmbedded && (
        <>
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
            />
          )}
        </AnimatePresence>

        <aside className={`fixed lg:relative inset-y-0 left-0 bg-white dark:bg-[#0b0f19] border-r border-gray-100 dark:border-gray-800 flex flex-col shrink-0 z-[101] overflow-hidden shadow-2xl transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-20'} ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className={`p-6 border-b border-gray-50 dark:border-gray-800/50 sticky top-0 bg-white dark:bg-[#0b0f19] z-20 ${sidebarOpen ? 'p-8 flex justify-between items-center' : 'p-4 flex justify-center'}`}>
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800/80 rounded-2xl text-gray-400 hover:text-primary-600 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700 shrink-0">
                <ArrowRight size={18} className="rotate-180" />
              </Link>
              <div className={`flex flex-col transition-opacity duration-200 ${sidebarOpen ? 'opacity-100 flex' : 'opacity-0 hidden'}`}>
                <span className="text-[8px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">Global Matrix</span>
                <span className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-tighter">Curriculum</span>
              </div>
            </div>
            <button onClick={() => { setSidebarOpen(false); setIsMobileSidebarOpen(false); }} className="lg:hidden p-2 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-xl">
              <X size={18} />
            </button>
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
               {semesters.map((sem) => (
                   <button 
                    key={sem.id} 
                    onClick={() => {
                      setActiveSem(sem.id);
                      if (window.innerWidth < 1024) setIsMobileSidebarOpen(false);
                    }} 
                    className={`w-full flex items-center gap-4 relative rounded-2xl transition-all duration-300 group ${activeSem === sem.id ? sem.active + ' shadow-lg' : 'bg-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'} ${sidebarOpen ? 'px-4 py-2' : 'h-12 justify-center'} ${isSemLocked(sem.id) ? 'opacity-60 grayscale' : ''}`}
                  >
                    <div className={`flex items-center relative z-10 ${sidebarOpen ? 'w-full justify-between' : 'justify-center w-full'}`}>
                      <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
                        <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center transition-colors ${activeSem === sem.id ? 'bg-white/20 text-white' : sem.color}`}>
                          {isSemLocked(sem.id) ? <Lock size={14} /> : isSemCompleted(sem.id) ? <CheckCircle2 size={16} /> : <sem.icon size={16} />}
                        </div>
                        {sidebarOpen && <span className="text-[9px] font-black uppercase tracking-widest">{sem.label}</span>}
                      </div>
                    </div>
                  </button>
               ))}
          </nav>
        </aside>
        </>
      )}

      <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-[#060811] flex flex-col transition-all">
         
      <header className={`sticky top-0 z-20 px-4 lg:px-8 py-5 bg-white/80 dark:bg-[#060811]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4 ${isEmbedded ? 'rounded-t-[3rem]' : ''}`}>
         <div className="flex items-center gap-3">
            {!isEmbedded && (
              <button onClick={() => setIsMobileSidebarOpen(true)} className="lg:hidden p-2.5 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/20">
                 <Layers size={18} />
              </button>
            )}
            <div className="flex flex-col">
               <span className="text-[8px] font-black text-primary-600 uppercase tracking-widest hidden lg:block">Architecture Flow</span>
               <h2 className="text-sm lg:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none truncate max-w-[150px] lg:max-w-none">
                  {selectedDept?.name || 'Curriculum Hub'}
               </h2>
            </div>
         </div>

         <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative group md:w-72">
               <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
               <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="SEARCH..." className="w-full bg-gray-50 dark:bg-gray-800/50 pl-12 pr-4 py-3 rounded-xl outline-none text-[10px] font-black uppercase tracking-widest transition-all" />
            </div>
            {isHOD && (
               <button onClick={handleOpenModal} className="px-5 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl shrink-0">
                  <Plus size={14} /> <span className="hidden sm:inline">SUBJECT</span>
               </button>
            )}
         </div>
      </header>
      
      <div className={`${isEmbedded ? 'flex' : 'lg:hidden'} sticky top-[72px] z-[35] flex overflow-x-auto py-4 px-4 bg-white/95 dark:bg-[#060811]/95 backdrop-blur-3xl border-b border-gray-100 dark:border-gray-800 custom-scrollbar gap-3 no-scrollbar shadow-lg shadow-black/5`}>
        {semesters.map((sem) => (
          <button 
            key={sem.id} 
            onClick={() => setActiveSem(sem.id)} 
            className={`flex items-center gap-2.5 whitespace-nowrap px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSem === sem.id ? sem.active : 'bg-gray-100/50 dark:bg-gray-800/50 text-gray-500 shadow-inner'}`}
          >
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${activeSem === sem.id ? 'bg-white/20' : sem.color}`}>
              {isSemLocked(sem.id) ? <Lock size={14} /> : <sem.icon size={14} />}
            </div>
            {sem.label.replace('Semester ', 'SEM ')}
          </button>
        ))}
      </div>

          <div className="p-4 lg:p-8 pb-32">
            {isSemCompleted(activeSem) && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-6 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-3xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-emerald-600 uppercase tracking-widest">Academic Success Milestone</h3>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">This semester has been archived as successfully completed.</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <div className="px-4 py-1.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 animate-pulse">Status: ALREADY COMPLETED</div>
                   <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-2">{activeSem.replace('-', ' ')} Archives</span>
                </div>
              </motion.div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
               <AnimatePresence mode="popLayout">
                 {loading ? (
                   <div className="col-span-full py-20 flex flex-col items-center gap-4">
                     <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                   </div>
                  ) : filteredCourses.map((course) => {
                      const Icon = getCourseIcon(course.name);
                      const activeNow = liveCounts[course.code] || 0;
                      const facultyName = course.facultyAssigned?.[0]?.name || 'Staff';
                      const isAssigned = isTeacher && course.facultyAssigned?.some(f => (f._id || f) === user?._id);
                      const shouldBeDull = isTeacher && !isAssigned;

                      return (
                        <motion.div 
                          key={course._id} 
                          layout 
                          initial={{ opacity: 0, scale: 0.95 }} 
                          animate={{ opacity: 1, scale: 1 }} 
                          className={`group ${shouldBeDull ? 'grayscale-[1] opacity-40 contrast-[0.8]' : ''}`}
                        >
                           <Link to={`/course-inner/${course.code}`} className="block h-full relative">
                              {shouldBeDull && (
                                <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-gray-600/20 backdrop-blur-md rounded-full border border-gray-600/30 text-[8px] font-black text-gray-500 uppercase tracking-widest">
                                  READ ONLY
                                </div>
                              )}
                               <div className={`h-full glass rounded-[2.5rem] lg:rounded-[3rem] border border-transparent dark:border-gray-800 ${shouldBeDull ? 'bg-gray-100/50 dark:bg-gray-900/50' : 'bg-white dark:bg-[#0d101a]'} p-6 lg:p-8 transition-all duration-300 hover:shadow-2xl hover:border-primary-500/30 hover:-translate-y-1.5 flex flex-col relative overflow-hidden`}>
                                 
                                 <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                                       <Activity size={10} className="animate-pulse"/>
                                       <span className="text-[8px] font-black uppercase tracking-widest">{activeNow} LIVE</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-800/50 shadow-sm">
                                       <Eye size={10}/>
                                       <span className="text-[8px] font-black uppercase tracking-widest">{course.views || 0} VIEWS</span>
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-4 mb-6 lg:mb-8">
                                    <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center shadow-lg ${course.type === 'lab' ? 'bg-amber-500 text-white' : 'bg-primary-600 text-white'}`}>
                                       <Icon size={24} className="lg:size-[28px]" />
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-[9px] lg:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{course.code}</span>
                                       <span className="text-[10px] lg:text-xs font-black dark:text-white uppercase tracking-tighter">LEVEL {course.credits} UNIT</span>
                                    </div>
                                 </div>

                                 <div className="flex-1">
                                    <h3 className="text-lg lg:text-xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tighter mb-4 group-hover:text-primary-600 transition-colors">
                                       {course.name}
                                    </h3>
                                 </div>

                                 <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-[1rem] bg-indigo-500 flex items-center justify-center text-white text-[9px] font-black">
                                          {facultyName.split(' ').map(n=>n[0]).join('')}
                                       </div>
                                       <div>
                                          <p className="text-[7px] lg:text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Lead Strategist</p>
                                          <p className="text-[10px] lg:text-xs font-black dark:text-white uppercase transition-colors">{facultyName}</p>
                                       </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:bg-primary-600 group-hover:text-white transition-all flex items-center justify-center shadow-inner">
                                       <ArrowRight size={18} />
                                    </div>
                                 </div>
                              </div>
                           </Link>
                        </motion.div>
                      );
                  })}
               </AnimatePresence>
            </div>
         </div>
      </main>
    </div>
    
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-8 backdrop-blur-xl bg-black/60">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#0b0f19] w-full max-w-2xl rounded-3xl lg:rounded-[3rem] p-6 lg:p-12 shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
               <h2 className="text-xl lg:text-3xl font-black dark:text-white uppercase tracking-tighter mb-6 lg:mb-10">Establish New Module</h2>
               <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                    <input required type="text" placeholder="Unit Title..." value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-2xl px-6 py-4 text-sm font-bold outline-none" />
                    <input required type="text" placeholder="CS301" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-2xl px-6 py-4 text-sm font-bold outline-none" />
                 </div>
                 <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 bg-gray-100 dark:bg-gray-800 rounded-3xl font-black uppercase tracking-widest">Cancel</button>
                    <button type="submit" className="flex-[2] py-5 bg-primary-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl">Confirm Module</button>
                 </div>
               </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
   );
};

export default Courses;
