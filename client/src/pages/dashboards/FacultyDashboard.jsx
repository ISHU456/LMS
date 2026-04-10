import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Users, Calendar, CheckSquare, Radio, BarChart2,
  Bell, ChevronRight, FileText, ArrowUpRight, PlusCircle,
  Activity, MessageSquare, Edit2, Trash2, X, Save,
  Clock, MapPin, Tag, BookMarked, FlaskConical, Presentation,
  Microscope, Layers, GraduationCap, AlertCircle, CheckCircle2,
  Plus, CalendarDays, LayoutList, LayoutGrid,
  ShieldCheck, FileCheck, Settings, Search, Megaphone, ClipboardCheck
} from 'lucide-react';
import DashboardOverview from '../../components/teacher/DashboardOverview';
import AttendanceManager from '../../components/teacher/AttendanceManager';
import CourseAccessManager from '../../components/teacher/CourseAccessManager';
import MonthlyRegister from '../../components/teacher/MonthlyRegister';
import QuizGenerator from '../../components/teacher/QuizGenerator';

const DAYS   = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const TYPES  = [
  { value:'Theory',    label:'Theory Lecture', icon: Presentation, color:'#4361ee' },
  { value:'Practical', label:'Practical Lab',  icon: FlaskConical, color:'#7209b7' },
  { value:'Tutorial',  label:'Tutorial',       icon: BookMarked,   color:'#f72585' },
  { value:'Lab',       label:'Lab Session',    icon: Microscope,   color:'#4cc9f0' },
  { value:'Seminar',   label:'Seminar',        icon: GraduationCap,color:'#f59e0b' },
];
const TYPE_META = (v) => TYPES.find(t => t.value === v) || TYPES[0];

const getCourseIcon = (id) => {
  const map = { 'CS301': '🧮', 'CS401': '⚙️', 'CS501': '🌐', 'CS899': '🚀', 'default': '📚' };
  return map[id] || map.default;
};
const getCourseColor = (id) => {
  const map = { 'CS301': '#4361ee', 'CS401': '#7209b7', 'CS501': '#f72585', 'CS899': '#4cc9f0', 'default': '#6366f1' };
  return map[id] || map.default;
};

const EMPTY_FORM = { id: null, course:'', day:'Monday', startTime:'09:00', endTime:'10:30', room:'', type:'lecture', notes:'' };

const ScheduleModal = ({ form, setForm, onSave, onClose, isEdit, courses }) => {
  const selectedCourse = courses.find(c => c.code === form.course) || courses[0] || { code: 'N/A', name: 'Select Course', color: '#6366f1' };
  const courseColor = getCourseColor(selectedCourse.code);
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale:0.92, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.92, y:20 }} className="bg-white dark:bg-[#111827] rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-gray-800 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800" style={{ background: `linear-gradient(135deg, ${courseColor}15, transparent)` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${courseColor}20` }}>{getCourseIcon(selectedCourse.code)}</div>
            <div>
              <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{isEdit ? 'Edit Session' : 'Add New Session'}</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Faculty Schedule Manager</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"><X size={18} className="text-gray-500"/></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><BookOpen size={11}/> Course</label>
            <select value={form.course} onChange={e => setForm(f=>({...f,course:e.target.value}))} className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
              <option value="">Select Course</option>
              {courses.map(c => <option key={c._id} value={c.code}>{getCourseIcon(c.code)} {c.code} — {c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><CalendarDays size={11}/> Day</label>
              <select value={form.day} onChange={e => setForm(f=>({...f,day:e.target.value}))} className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Tag size={11}/> Session Type</label>
              <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))} className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Clock size={11}/> Start Time</label>
              <input type="time" value={form.startTime} onChange={e => setForm(f=>({...f,startTime:e.target.value}))} className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"/>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Clock size={11}/> End Time</label>
              <input type="time" value={form.endTime} onChange={e => setForm(f=>({...f,endTime:e.target.value}))} className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"/>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MapPin size={11}/> Room / Venue</label>
            <input type="text" value={form.room} onChange={e => setForm(f=>({...f,room:e.target.value}))} placeholder="e.g. LHC-101, Lab-B, Online..." className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder:text-gray-300 dark:placeholder:text-gray-600"/>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FileText size={11}/> Topic / Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} placeholder="e.g. Chapter 5..." rows={2} className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder:text-gray-300 dark:placeholder:text-gray-600 resize-none"/>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-black text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">Cancel</button>
          <button onClick={onSave} className="flex-1 py-3 rounded-xl text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-90" style={{ background: `linear-gradient(135deg, #4361ee, #7209b7)` }}><Save size={14}/> {isEdit ? 'Save' : 'Add'}</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SessionCard = ({ s, onEdit, onDelete, onLive }) => {
  const courseColor = getCourseColor(s.course);
  const typeMeta = TYPE_META(s.type);
  const TypeIcon = typeMeta.icon;
  return (
    <motion.div layout initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, x:-20 }} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group overflow-hidden">
      <div className="h-1 w-full" style={{ background: courseColor }}/>
      <div className="p-4 flex items-center gap-4">
        <div className="shrink-0 text-center w-20 bg-gray-50 dark:bg-gray-800 rounded-xl py-2 px-1 border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-black text-gray-900 dark:text-white uppercase">{s.startTime}</p>
          <div className="w-4 h-[1px] bg-gray-300 dark:bg-gray-600 mx-auto my-1"/>
          <p className="text-[10px] font-bold text-gray-400 uppercase">{s.endTime}</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background:`${courseColor}15` }}>{getCourseIcon(s.course)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{s.course}</span>
            <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase" style={{ color: typeMeta.color, background:`${typeMeta.color}15` }}><TypeIcon size={9}/> {s.type}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {s.room && <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400"><MapPin size={10}/>{s.room}</span>}
            {s.notes && <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 truncate max-w-[160px]"><FileText size={10}/>{s.notes}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={() => onLive(s.course)} className="px-3 py-2 rounded-xl text-white text-[10px] font-black uppercase shadow-md transition-all hover:opacity-80" style={{ background:'linear-gradient(135deg,#ef4444,#dc2626)' }}><Radio size={11}/> Live</button>
          <button onClick={() => onEdit(s)} className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all"><Edit2 size={15}/></button>
          <button onClick={() => onDelete(s.id)} className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"><Trash2 size={15}/></button>
        </div>
      </div>
    </motion.div>
  );
};

const FacultyDashboard = () => {
  const { user }  = useSelector(s => s.auth);
  const navigate  = useNavigate();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('faculty_active_tab') || 'register');
  useEffect(() => { localStorage.setItem('faculty_active_tab', activeTab); }, [activeTab]);
  const [schedule, setSchedule]   = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [assignments, setAssignments]   = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [time, setTime] = useState(new Date());
  const [modalOpen, setModalOpen]   = useState(false);
  const [modalForm, setModalForm]   = useState(EMPTY_FORM);
  const [isEdit, setIsEdit]         = useState(false);
  const [filterDay, setFilterDay]   = useState(() => localStorage.getItem('faculty_schedule_filter_day') || 'All');
  const [viewMode, setViewMode]     = useState(() => localStorage.getItem('faculty_schedule_view_mode') || 'list');
  useEffect(() => { localStorage.setItem('faculty_schedule_filter_day', filterDay); }, [filterDay]);
  useEffect(() => { localStorage.setItem('faculty_schedule_view_mode', viewMode); }, [viewMode]);
  const [toast, setToast]           = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [globalSelectedSemester, setGlobalSelectedSemester] = useState(parseInt(localStorage.getItem('faculty_sem')) || 1);
  const [globalSelectedCourse, setGlobalSelectedCourse] = useState(null); 
  const [lastCourseId, setLastCourseId] = useState(localStorage.getItem('faculty_last_course_id') || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!user?.token) return;
    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    axios.get('http://localhost:5001/api/assignments', config).then(r => setAssignments(r.data)).catch(() => {});
    axios.get('http://localhost:5001/api/announcements', config).then(r => setAnnouncements(r.data.announcements || r.data)).catch(() => {});
    axios.get('http://localhost:5001/api/courses', config).then(r => {
      setMyCourses(r.data);
      if (lastCourseId) {
        const last = r.data.find(c => c._id === lastCourseId);
        if (last) { setGlobalSelectedCourse(last); setGlobalSelectedSemester(last.semester); }
      }
      const flat = [];
      r.data.forEach(c => {
        if (c.schedule) c.schedule.forEach((s, idx) => {
          const [st, en] = s.time.includes('-') ? s.time.split('-') : [s.time, '10:00'];
          flat.push({ id:`${c.code}-${idx}`, course:c.code, day:s.day, startTime:st.trim(), endTime:en.trim(), room:s.room, type:s.type==='lecture'?'Theory':'Practical', notes:s.activity, dbIndex:idx });
        });
      });
      setSchedule(flat);
    }).catch(() => {});
  }, [user]);

  const openAdd = () => { setModalForm({...EMPTY_FORM}); setIsEdit(false); setModalOpen(true); };
  const openEdit = (s) => { setModalForm({...s}); setIsEdit(true); setModalOpen(true); };
  const handleSave = async () => { setModalOpen(false); };
  const handleDelete = async (id) => { setDeleteConfirm(null); };

  const todayName = time.toLocaleDateString('en-IN', { weekday: 'long' });
  const todayClasses = schedule.filter(s => s.day === todayName);
  const filteredSchedule = (filterDay === 'All' ? schedule : schedule.filter(s => s.day === filterDay)).sort((a,b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day));

  const navItems = [
    { id:'overview', label:'Dashboard', icon: Activity },
    { id:'attendance', label:'Attendance', icon: FileCheck },
    { id:'register', label:'Monthly Register', icon: Layers },
    { id:'access', label:'Access Control', icon: ShieldCheck },
    { id:'schedule', label:'Schedule', icon: CalendarDays },
    { id:'courses', label:'My Course Hub', icon: BookOpen },
    { id:'grading', label:'Grading', icon: ClipboardCheck },
    { id:'results', label:'Exam Grades', icon: BarChart2 },
    { id:'quizzes', label:'Quiz Hub', icon: Radio },
    { id:'announcements', label:'Notices', icon: Megaphone },
  ];

  const handleLinkNavigation = (id) => {
    if (id === 'results') return navigate('/results/entry');
    if (id === 'courses') return navigate('/courses');
    if (id === 'grading') return navigate('/assignments');
    if (id === 'announcements') return navigate('/community');
    setActiveTab(id);
  };

  const [quizzes, setQuizzes] = useState([]);
  const [quizGenOpen, setQuizGenOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'quizzes') {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      axios.get('http://localhost:5001/api/gamification/quizzes', config).then(r => setQuizzes(r.data)).catch(e => console.error(e));
    }
  }, [activeTab, user]);

  return (
    <div className="flex h-screen flex-col bg-[#f8faff] dark:bg-[#0b0f1a] overflow-hidden relative">
      <div className="flex flex-1 overflow-hidden relative">
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
            />
          )}
        </AnimatePresence>

        <aside className={`fixed lg:relative inset-y-0 left-0 w-64 bg-white dark:bg-[#111827] border-r border-gray-100 dark:border-gray-800 flex flex-col pt-4 z-[101] transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="px-6 mb-8 flex items-center justify-between lg:justify-start gap-3">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black">FA</div>
                <div><p className="text-sm font-black text-gray-900 dark:text-white uppercase leading-none">{user.name}</p><p className="text-[9px] font-black text-indigo-500 uppercase mt-1">Faculty Portal</p></div>
             </div>
             <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500">
                <X size={20} />
             </button>
          </div>
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <button key={item.id} onClick={() => { handleLinkNavigation(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab===item.id?'bg-indigo-600 text-white shadow-lg':'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <item.icon size={18}/><span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto custom-scrollbar">
          <div className="flex lg:hidden items-center justify-between mb-6">
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20"
             >
               <Activity size={14} />
               Menu
             </button>
             <div className="text-[10px] font-black uppercase text-indigo-500">Pulse Node 001</div>
          </div>
          <motion.div 
            initial={{ opacity:0, y:-20 }} 
            animate={{ opacity:1, y:0 }} 
            className="relative overflow-hidden rounded-[2.5rem] lg:rounded-[3rem] p-6 lg:p-12 mb-8 lg:mb-12 shadow-2xl group cursor-default min-h-[280px] lg:min-h-[340px] flex flex-col justify-end border border-white/10 dark:border-white/5"
          >
            {/* Background Image Layer with Darkening Filter */}
            <div 
              className="absolute inset-0 z-0 scale-105 group-hover:scale-100 transition-transform duration-[2s] ease-out brightness-[0.45] dark:brightness-[0.35]"
              style={{ 
                backgroundImage: `url('/images/dashboard/teacher_banner.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 40%'
              }}
            />
            
            {/* Multi-layered High-Contrast Gradient Overlay */}
            <div className="absolute inset-0 z-[1] bg-gradient-to-t from-gray-900/95 via-gray-900/60 to-transparent dark:from-[#0b0f1a]/95 dark:via-[#0b0f1a]/70 dark:to-transparent" />
            <div className="absolute inset-0 z-[2] bg-gradient-to-r from-indigo-600/30 to-transparent opacity-50 mix-blend-multiply" />
            
            {/* Content Axis with Drop Shadows for Depth */}
            <div className="relative z-10 drop-shadow-2xl">
              <div className="flex items-center gap-4 mb-5">
                 <div className="w-16 h-[2px] bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                 <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.6em] italic drop-shadow-md">Faculty Governance Matrix</span>
              </div>
              <h1 className="text-4xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-4 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                Welcome, <span className="text-indigo-400">Professor</span>
              </h1>
              <p className="text-gray-300/80 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] mb-6 max-w-xl leading-relaxed italic border-l-2 border-indigo-500/30 pl-4">
                Orchestrating institutional excellence through high-performance academic governance and identity node management.
              </p>
              
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-3 px-5 py-2.5 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-xl">
                  <CalendarDays size={16} className="text-indigo-400" />
                  <p className="text-white text-[11px] font-black uppercase tracking-[0.2em]">{time.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-3 px-5 py-2.5 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-xl">
                  <Clock size={16} className="text-indigo-400" />
                  <p className="text-white text-[11px] font-black uppercase tracking-[0.2em]">{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                </div>
              </div>
            </div>
            
            {/* Procedural Visual Element */}
            <div className="absolute top-6 lg:top-12 right-6 lg:right-12 z-20 p-4 lg:p-8 bg-black/40 backdrop-blur-3xl rounded-3xl lg:rounded-[3rem] border border-white/10 shadow-2xl group-hover:bg-indigo-600/20 transition-all duration-500">
               <Layers size={32} className="lg:w-[54px] lg:h-[54px] text-indigo-400 animate-pulse drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
             {activeTab === 'overview' && <DashboardOverview user={user} />}
             {activeTab === 'attendance' && <AttendanceManager user={user} initialSemester={globalSelectedSemester} initialCourse={globalSelectedCourse} onPersistChange={(s,c)=>{setGlobalSelectedSemester(s);setGlobalSelectedCourse(c);}} />}
             {activeTab === 'register' && <MonthlyRegister user={user} initialSemester={globalSelectedSemester} initialCourse={globalSelectedCourse} onPersistChange={(s,c)=>{setGlobalSelectedSemester(s);setGlobalSelectedCourse(c);}} />}
             {activeTab === 'access' && <CourseAccessManager user={user} initialSemester={globalSelectedSemester} initialCourse={globalSelectedCourse} onPersistChange={(s,c)=>{setGlobalSelectedSemester(s);setGlobalSelectedCourse(c);}} />}
             {activeTab === 'schedule' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white italic">Academic Schedule Matrix</h2>
                    <button onClick={openAdd} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:opacity-90 transition-all flex items-center gap-2">Induct Session <Plus size={14}/></button>
                  </div>
                  <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
                    {['All', ...DAYS].map(d => (
                      <button key={d} onClick={() => setFilterDay(d)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterDay === d ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-100 dark:border-gray-800 hover:bg-gray-50'}`}>{d}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredSchedule.map(s => <SessionCard key={s.id} s={s} onEdit={openEdit} onDelete={setDeleteConfirm} onLive={c => navigate(`/live-class/${c}`)} />)}
                    {filteredSchedule.length === 0 && (
                      <div className="col-span-full py-20 bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl flex flex-col items-center justify-center opacity-40">
                         <Calendar size={40} className="mb-4 text-gray-300"/>
                         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No Active Sessions for this node</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              {activeTab === 'quizzes' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase italic">Active Neural Quiz Nodes</h2>
                      <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1">Gamification & Achievement Interface</p>
                    </div>
                    <button onClick={() => setQuizGenOpen(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-all flex items-center gap-2">Deploy New Quiz <Plus size={14}/></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map(q => (
                      <div key={q._id} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-4 mb-4">
                           <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center"><Brain size={18}/></div>
                           <div>
                              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{q.title}</h3>
                              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{q.category}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-6 mt-6">
                           <div className="flex items-center gap-2">
                              <Target size={14} className="text-gray-400" />
                              <span className="text-[10px] font-black text-gray-500 uppercase">{q.totalPoints} Pts</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-400" />
                              <span className="text-[10px] font-black text-gray-500 uppercase">{q.timeLimit} Min</span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
          </AnimatePresence>
        </main>
      </div>
      <AnimatePresence>
        {modalOpen && <ScheduleModal form={modalForm} setForm={setModalForm} onSave={handleSave} onClose={() => setModalOpen(false)} isEdit={isEdit} courses={myCourses} />}
        {quizGenOpen && <QuizGenerator onClose={() => setQuizGenOpen(false)} onSave={() => {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          axios.get('http://localhost:5001/api/gamification/quizzes', config).then(r => setQuizzes(r.data));
        }} />}
      </AnimatePresence>
    </div>
  );
};

export default FacultyDashboard;
