import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

import {
  BookOpen, Users, Calendar, CheckSquare, Radio, BarChart2,
  Bell, ChevronRight, FileText, ArrowUpRight, PlusCircle,
  Activity, MessageSquare, Edit2, Trash2, X, Save,
  Clock, MapPin, Tag, BookMarked, FlaskConical, Presentation,
  Microscope, Layers, GraduationCap, AlertCircle, CheckCircle2,
  Plus, CalendarDays, LayoutList, LayoutGrid, Gift,
  ShieldCheck, FileCheck, Settings, Search, Megaphone, ClipboardCheck, Terminal, ClipboardList, Wind, Leaf, Droplets, Zap, Palette, RefreshCw, Building
} from 'lucide-react';

import DashboardOverview from '../../components/teacher/DashboardOverview';
import AttendanceManager from '../../components/teacher/AttendanceManager';
import CourseAccessManager from '../../components/teacher/CourseAccessManager';
import MonthlyRegister from '../../components/teacher/MonthlyRegister';
import QuizGenerator from '../../components/teacher/QuizGenerator';
import PrizeManager from '../../components/admin/PrizeManager';


// Integrated Page Components
import ResultEntry from '../results/ResultEntry';
import Courses from '../courses/Courses';
import Assignments from '../general/Assignments';
import Announcements from '../announcements/Announcements';

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

const EMPTY_FORM = { id: null, course:'', day:'Monday', startTime: '09:00', endTime: '10:30', room:'', type:'Theory', notes:'' };

const TIME_SLOTS = [
  { id: 1, start: '09:00', end: '10:30', label: 'Slot Alpha' },
  { id: 2, start: '10:45', end: '12:15', label: 'Slot Beta' },
  { id: 3, start: '12:30', end: '14:00', label: 'Slot Gamma' },
  { id: 4, start: '14:15', end: '15:45', label: 'Slot Delta' },
  { id: 5, start: '16:00', end: '17:30', label: 'Slot Epsilon' },
];

const ScheduleModal = ({ form, setForm, onSave, onClose, isEdit, courses, allSchedules }) => {
  const selectedCourse = courses.find(c => c.code === form.course) || { code: 'N/A', name: 'Select Course', color: '#14b8a6' };
  
  const checkConflict = (slot, room, day) => {
    if (!room || !day) return null;
    return allSchedules.find(s => 
      s.day === day && 
      s.startTime === slot.start && 
      s.room?.toLowerCase() === room.toLowerCase() &&
      s.id !== form.id
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md" onClick={onClose}>
      <div className="bg-white/90 dark:bg-[#080c14]/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        <div className="px-10 py-8 flex items-center justify-between border-b border-slate-100 dark:border-white/5 shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-teal-500/20">
               <CalendarDays size={28} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">{isEdit ? 'Re-calibrate Protocol' : 'Induct New Session'}</h2>
              <p className="text-[10px] text-teal-500 font-black uppercase tracking-widest mt-0.5 flex items-center gap-2">
                <ShieldCheck size={12}/> Neural Reservation Node
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all group">
             <X size={20} className="text-slate-400 group-hover:rotate-90 transition-transform"/>
          </button>
        </div>

        <div className="p-10 space-y-8 overflow-y-auto no-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <BookOpen size={12}/> Operational Node
              </label>
              <select 
                value={form.course} 
                onChange={e => setForm(f=>({...f,course:e.target.value}))} 
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/50 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Select Target Course</option>
                {courses.map(c => <option key={c._id} value={c.code}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <Tag size={12}/> Interaction Mode
              </label>
              <div className="flex gap-2 p-1 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                {['Theory', 'Practical'].map(type => (
                  <button 
                    key={type}
                    onClick={() => setForm(f=>({...f, type}))}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${form.type === type ? 'bg-white dark:bg-teal-500 text-teal-600 dark:text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <Clock size={12}/> Temporal Designation
             </label>
             <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {DAYS.map(d => (
                   <button 
                     key={d}
                     onClick={() => setForm(f=>({...f, day: d}))}
                     className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${form.day === d ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-transparent border-slate-200 dark:border-white/5 text-slate-400 hover:border-indigo-500/30'}`}
                   >
                     {d.slice(0, 3)}
                   </button>
                ))}
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
                {TIME_SLOTS.map(slot => {
                  const conflict = checkConflict(slot, form.room, form.day);
                  const isSelected = form.startTime === slot.start;
                  return (
                    <button 
                      key={slot.id}
                      disabled={!!conflict}
                      onClick={() => setForm(f=>({...f, startTime: slot.start, endTime: slot.end}))}
                      className={`relative p-4 rounded-2xl border transition-all text-left group/slot ${isSelected ? 'bg-teal-500 border-teal-500 text-white shadow-xl shadow-teal-500/20' : conflict ? 'opacity-30 cursor-not-allowed border-slate-200 dark:border-white/5 text-slate-300' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:border-teal-500/50'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                         <span className={`text-[8px] font-black uppercase tracking-widest ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>{slot.label}</span>
                         {conflict && <AlertCircle size={10} className="text-rose-500" />}
                      </div>
                      <p className="text-xs font-black tracking-tight">{slot.start} — {slot.end}</p>
                      {conflict && (
                        <div className="absolute inset-0 bg-white/10 dark:bg-black/20 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity rounded-2xl">
                           <p className="text-[7px] font-black uppercase bg-rose-500 text-white px-2 py-1 rounded-lg shadow-lg">Room Conflict: {conflict.course}</p>
                        </div>
                      )}
                    </button>
                  );
                })}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <MapPin size={12}/> Spatial Designation (Room)
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={form.room} 
                  onChange={e => setForm(f=>({...f,room:e.target.value}))} 
                  placeholder="e.g. LAB-ALPHA-01" 
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-xs font-black text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/50 outline-none transition-all"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                   <Building size={16}/>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <FileText size={12}/> Agenda Metadata
              </label>
              <textarea 
                value={form.notes} 
                onChange={e => setForm(f=>({...f,notes:e.target.value}))} 
                placeholder="Synchronize topic objectives..." 
                rows={1} 
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-xs font-black text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/50 outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>

        <div className="px-10 py-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 shrink-0 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white dark:hover:bg-white/10 transition-all">Abort</button>
          <button 
            disabled={!form.course || !form.startTime || !form.room}
            onClick={onSave} 
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:scale-100 disabled:grayscale"
          >
            <Save size={16}/> {isEdit ? 'Authorize Changes' : 'Confirm Reservation'}
          </button>
        </div>
      </div>
    </div>
  );
};

const SessionCard = ({ s, onEdit, onDelete, onLive }) => {
  const typeMeta = TYPE_META(s.type);
  const TypeIcon = typeMeta.icon;
  return (
    <motion.div layout initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, x:-20 }} className="bg-white/70 dark:bg-[#080c14]/70 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl hover:shadow-2xl hover:border-teal-500/30 transition-all group overflow-hidden">
      <div className="h-2 w-full bg-gradient-to-r from-teal-500 to-indigo-500 opacity-50" />
      <div className="p-8 flex items-center gap-6">
        <div className="shrink-0 text-center w-24 bg-slate-50 dark:bg-white/5 rounded-2xl py-4 border border-slate-100 dark:border-white/5 shadow-inner">
          <p className="text-sm font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{s.startTime}</p>
          <div className="w-6 h-[2px] bg-teal-500/30 mx-auto my-2 rounded-full"/>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest tabular-nums">{s.endTime}</p>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{s.course}</h4>
            <span className="flex items-center gap-1 text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border border-current opacity-70" style={{ color: typeMeta.color }}>
              <TypeIcon size={10}/> {s.type}
            </span>
          </div>
          <div className="flex items-center gap-5 flex-wrap">
            <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest italic animate-pulse">
               <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]" /> 
               {s.room}
            </span>
            {s.notes && (
               <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[200px]">
                 <FileText size={12} className="text-slate-300"/> {s.notes}
               </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-500">
          <button onClick={() => onLive(s.course)} className="w-10 h-10 rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-500/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"><Radio size={16}/></button>
          <button onClick={() => onEdit(s)} className="w-10 h-10 rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"><Edit2 size={16}/></button>
          <button onClick={() => onDelete(s.id)} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-rose-500 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"><Trash2 size={16}/></button>
        </div>
      </div>
    </motion.div>
  );
};

const FacultyDashboard = () => {
  const { user }  = useSelector(s => s.auth);
  const navigate  = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
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
  const [sidebarWidth, setSidebarWidth] = useState(() => parseInt(localStorage.getItem('facultySidebarWidth')) || 280);
  const [isResizing, setIsResizing] = useState(false);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(() => parseInt(localStorage.getItem('rightSidebarWidth')) || 280);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [settings, setSettings] = useState({ facultyNeuralCredit: 8 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(window.innerWidth >= 1440);

  useEffect(() => {
    axios.get('http://localhost:5001/api/public/settings')
      .then(r => setSettings(prev => ({ ...prev, ...r.data })))
      .catch(e => console.error("Neural settings fetch failure", e));
  }, []);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }

    const t = setInterval(() => setTime(new Date()), 1000);
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearInterval(t);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback((e) => {
    if (isResizing) {
      let newWidth = e.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 450) newWidth = 450;
      setSidebarWidth(newWidth);
      localStorage.setItem('facultySidebarWidth', newWidth);
    }
  }, [isResizing]);

  const startResizingRight = useCallback(() => setIsResizingRight(true), []);
  const stopResizingRight = useCallback(() => setIsResizingRight(false), []);
  const resizeRight = useCallback((e) => {
    if (isResizingRight) {
      let newWidth = window.innerWidth - e.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 450) newWidth = 450;
      setRightSidebarWidth(newWidth);
      localStorage.setItem('rightSidebarWidth', newWidth);
    }
  }, [isResizingRight]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    if (isResizingRight) {
       window.addEventListener('mousemove', resizeRight);
       window.addEventListener('mouseup', stopResizingRight);
    }
    if (isResizing || isResizingRight) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing, resize, stopResizing]);

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

  const handleSave = async () => {
    try {
      if (!modalForm.course || !modalForm.startTime || !modalForm.room) return;
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const targetCourse = myCourses.find(c => c.code === modalForm.course);
      if (!targetCourse) return;

      const sessionObj = {
        day: modalForm.day,
        time: `${modalForm.startTime}-${modalForm.endTime}`,
        room: modalForm.room,
        type: modalForm.type === 'Theory' ? 'lecture' : 'practical',
        activity: modalForm.notes
      };

      let updatedSchedule = [...(targetCourse.schedule || [])];
      
      if (isEdit) {
        updatedSchedule[modalForm.dbIndex] = sessionObj;
      } else {
        updatedSchedule.push(sessionObj);
      }

      await axios.put(`http://localhost:5001/api/courses/${targetCourse._id}`, {
        ...targetCourse,
        schedule: updatedSchedule
      }, config);

      setModalOpen(false);
      window.location.reload(); 
    } catch (err) {
      console.error("Authorization sync failed:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const [courseCode, idxStr] = id.split('-');
      const idx = parseInt(idxStr);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const targetCourse = myCourses.find(c => c.code === courseCode);
      if (!targetCourse) return;

      const updatedSchedule = targetCourse.schedule.filter((_, i) => i !== idx);

      await axios.put(`http://localhost:5001/api/courses/${targetCourse._id}`, {
        ...targetCourse,
        schedule: updatedSchedule
      }, config);

      setDeleteConfirm(null);
      window.location.reload();
    } catch (err) {
      console.error("Node de-authorization failed:", err);
    }
  };

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
    { id:'quizzes', label:'Assessment Lab', icon: Radio },
    { id:'rewards', label:'Student Rewards', icon: Gift },
    { id:'announcements', label:'Notices', icon: Megaphone },
    { id:'aesthetics', label:'Personal Aesthetics', icon: Palette },
  ];


  const handleLinkNavigation = (id) => {
    setActiveTab(id);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
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
    <div className="flex h-[calc(100vh-5rem)] flex-col bg-transparent font-sans selection:bg-teal-500 selection:text-white transition-colors duration-500 overflow-hidden relative">
        {modalOpen && (
          <ScheduleModal 
            key="schedule-modal"
            form={modalForm} 
            setForm={setModalForm} 
            onSave={handleSave} 
            onClose={() => setModalOpen(false)} 
            isEdit={isEdit} 
            courses={myCourses} 
            allSchedules={schedule} 
          />
        )}
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-5">
         <div className="absolute top-[15%] right-[25%] w-[550px] h-[550px] bg-teal-500/5 rounded-full" />
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {isSidebarOpen && (
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
            />
          )}

        <aside 
          className={`fixed lg:relative z-[60] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/60 shadow-lg lg:shadow-none transition-all duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
          style={{ width: window.innerWidth < 1024 ? '280px' : (isSidebarOpen ? sidebarWidth : 0) }}
        >
          <div className="p-6 flex flex-col h-full">
             <div className="flex items-center gap-3 mb-10 px-2 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 shrink-0">
                   <Terminal size={20} />
                </div>
                <div className="truncate">
                   <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Faculty Node</h2>
                   <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">Academic Grid</p>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><X size={20}/></button>
             </div>

             <nav className="flex-1 space-y-1 overflow-y-auto pr-2 no-scrollbar">
                {navItems.map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => handleLinkNavigation(item.id)} 
                    className={`group w-full flex items-center gap-4 px-5 py-4 rounded-[1.25rem] transition-all duration-300 relative overflow-hidden ${activeTab === item.id ? 'bg-slate-100/80 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                  >
                     {activeTab === item.id && <div className="absolute left-0 w-1.5 h-6 bg-indigo-600 dark:bg-indigo-500 rounded-r-full" />}
                     <item.icon size={20} className={`shrink-0 transition-transform duration-500 group-hover:scale-110 ${activeTab === item.id ? 'scale-110' : ''}`} />
                     <span className="text-[11px] font-black uppercase tracking-widest truncate">{item.label}</span>
                  </button>
                ))}
             </nav>

             <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/60 overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 group hover:border-indigo-500/30 transition-all duration-500 cursor-help">
                   <div className="flex items-center gap-3 mb-2">
                      <Activity size={14} className="text-indigo-500" />
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Node Health</p>
                   </div>
                   <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 w-[96%]" />
                   </div>
                   <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-2">Operational: 100%</p>
                </div>
             </div>
          </div>

          <div onMouseDown={startResizing} className="hidden lg:block absolute top-0 -right-1 w-2 h-full cursor-col-resize group z-50 transition-all active:w-4">
             <div className={`h-full w-0.5 mx-auto bg-slate-200 dark:border-slate-800/60 group-hover:bg-indigo-500 transition-colors ${isResizing ? 'bg-indigo-500 w-1' : ''}`} />
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto no-scrollbar min-w-0">
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
          
          {activeTab === 'overview' && (
            <motion.div 
               className="relative overflow-hidden rounded-[3rem] lg:rounded-[4rem] p-8 lg:p-16 mb-8 lg:mb-12 shadow-2xl group cursor-default min-h-[350px] lg:min-h-[550px] flex flex-col justify-end border border-slate-200/50 dark:border-white/5 backdrop-blur-md"
            >
              <div 
                className="absolute inset-0 z-0 scale-105 brightness-[0.9] dark:brightness-[0.45] saturate-[1.2]"
                style={{ 
                  backgroundImage: `url('/images/dashboard/teacher_banner.png')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 45%'
                }}
              />
              
              <div className="absolute inset-0 z-[1] bg-gradient-to-t from-white/95 via-white/40 to-transparent dark:from-[#030712] dark:via-[#030712]/60 dark:to-transparent" />
              <div className="absolute inset-0 z-[2] bg-gradient-to-br from-teal-500/10 via-transparent to-indigo-500/10 opacity-50 mix-blend-overlay" />
              
              <div className="relative z-10 drop-shadow-sm max-w-full overflow-visible">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-16 h-[3px] bg-gradient-to-r from-teal-500 to-indigo-600 rounded-full shadow-[0_0_20px_rgba(20,184,166,0.3)]" />
                   <span className="text-[11px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-[0.6em] italic drop-shadow-sm flex items-center gap-2">
                     <Wind size={14}/> Faculty Governance Matrix
                   </span>
                </div>
                
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-[0.85] mb-8 drop-shadow-2xl max-w-4xl">
                  Welcome, <br />
                  <span className="bg-gradient-to-r from-teal-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent italic pr-6 inline-block">Professor</span>
                </h1>
                
                <div className="max-w-3xl border-l-[3px] border-teal-500/40 pl-8 mb-10 transform group-hover:translate-x-1 transition-transform duration-700">
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] lg:text-[13px] font-black uppercase tracking-[0.3em] leading-relaxed italic opacity-85">
                    Orchestrating institutional excellence through high-performance <span className="text-indigo-500">academic governance</span> and synchronous identity node management.
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3 px-8 py-4 bg-white/80 dark:bg-white/5 backdrop-blur-2xl rounded-[1.75rem] border border-slate-200 dark:border-white/5 shadow-2xl shadow-indigo-500/10 group/time">
                    <CalendarDays size={18} className="text-teal-500 group-hover/time:scale-120 transition-transform" />
                    <p className="text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-[0.2em]">{time.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-3 px-8 py-4 bg-white/80 dark:bg-white/5 backdrop-blur-2xl rounded-[1.75rem] border border-slate-200 dark:border-white/5 shadow-2xl shadow-indigo-500/10 group/time">
                    <Clock size={18} className="text-indigo-500 group-hover/time:rotate-12 transition-transform" />
                    <p className="text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-[0.2em] tabular-nums">{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                  </div>

                  <div className="flex items-center gap-3 px-8 py-4 bg-indigo-600/10 dark:bg-indigo-500/10 backdrop-blur-xl rounded-[1.75rem] border border-indigo-500/20 shadow-2xl shadow-indigo-500/5 group/credits">
                    <Zap size={18} className="text-indigo-500 group-hover/credits:animate-pulse" />
                    <p className="text-indigo-600 dark:text-indigo-400 text-[11px] font-black uppercase tracking-[0.2em]">Institutional Focus: <span className="text-indigo-500 ml-1 font-black">{settings.facultyNeuralCredit} Node Credits</span></p>
                  </div>
                </div>
              </div>
              
              <div className="absolute top-12 right-12 z-30 hidden lg:flex items-center gap-3 px-5 py-2.5 bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-white/10 shadow-xl">
                 <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute inset-0" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500 relative z-10" />
                 </div>
                 <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.4em] italic">Neural Sync Active</span>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
             {activeTab === 'overview' && <DashboardOverview user={user} />}
             {activeTab === 'attendance' && <AttendanceManager user={user} initialSemester={globalSelectedSemester} initialCourse={globalSelectedCourse} onPersistChange={(s,c)=>{setGlobalSelectedSemester(s);setGlobalSelectedCourse(c);}} />}
             {activeTab === 'register' && <MonthlyRegister user={user} initialSemester={globalSelectedSemester} initialCourse={globalSelectedCourse} onPersistChange={(s,c)=>{setGlobalSelectedSemester(s);setGlobalSelectedCourse(c);}} />}
             {activeTab === 'access' && <CourseAccessManager user={user} initialSemester={globalSelectedSemester} initialCourse={globalSelectedCourse} onPersistChange={(s,c)=>{setGlobalSelectedSemester(s);setGlobalSelectedCourse(c);}} />}
             {activeTab === 'schedule' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                    <div>
                      <h2 className="text-3xl font-black uppercase tracking-tighter dark:text-white italic">Academic Schedule <span className="text-teal-500">Matrix</span></h2>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2">Synchronizing institutional knowledge nodes</p>
                    </div>
                    <button onClick={openAdd} className="px-8 py-4 bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">Induct Session <Plus size={16}/></button>
                  </div>
                  
                  <div className="flex gap-3 mb-10 overflow-x-auto pb-4 scrollbar-none scroll-smooth">
                    {['All', ...DAYS].map(d => (
                      <button 
                        key={d} 
                        onClick={() => setFilterDay(d)} 
                        className={`px-7 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${filterDay === d ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white dark:bg-[#080c14] text-slate-400 border-slate-100 dark:border-white/5 hover:border-indigo-500/30'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8 pb-12">
                    {filteredSchedule.map(s => <SessionCard key={s.id} s={s} onEdit={openEdit} onDelete={setDeleteConfirm} onLive={c => navigate(`/live-class/${c}`)} />)}
                    {filteredSchedule.length === 0 && (
                      <div className="col-span-full py-32 bg-white/40 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-[4rem] flex flex-col items-center justify-center opacity-60">
                         <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-8 relative">
                            <Wind size={48} className="text-teal-500/20 animate-pulse relative z-10"/>
                            <div className="absolute inset-0 bg-teal-500/10 blur-2xl animate-pulse"/>
                         </div>
                         <h3 className="text-sm font-black uppercase tracking-[0.4em] text-slate-400 italic mb-2">Temporal Void Detected</h3>
                         <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">No active operational sessions in this sector</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              {activeTab === 'quizzes' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {/* ... Quiz content (keep existing) ... */}
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
                           <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center"><Layers size={18}/></div>
                           <div>
                              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{q.title}</h3>
                              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{q.category}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-6 mt-6">
                           <div className="flex items-center gap-2">
                              {/* <Target size={14} className="text-gray-400" /> */}
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
              {activeTab === 'rewards' && <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}><PrizeManager /></motion.div>}
              {activeTab === 'results' && <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}><ResultEntry isEmbedded={true} /></motion.div>}

              {activeTab === 'courses' && <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}><Courses isEmbedded={true} /></motion.div>}
              {activeTab === 'grading' && <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}><Assignments isEmbedded={true} /></motion.div>}
              {activeTab === 'announcements' && <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}><Announcements isEmbedded={true} /></motion.div>}
              
              {activeTab === 'aesthetics' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pb-20">
                    <div className="flex flex-col">
                      <h2 className="text-4xl font-black uppercase tracking-tighter dark:text-white italic">Node <span className="text-indigo-600">Aesthetics</span></h2>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2">Personalize your faculty governance workspace</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        <button 
                            onClick={() => {
                                localStorage.removeItem('personal_theme');
                                window.location.reload();
                            }}
                            className="p-10 rounded-[3rem] border border-slate-200 dark:border-white/5 bg-white/70 dark:bg-white/5 backdrop-blur-xl hover:border-indigo-500/30 transition-all text-left group shadow-xl"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-500 group-hover:rotate-180 transition-transform duration-700">
                                    <RefreshCw size={24} />
                                </div>
                                <div className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Master Protocol</div>
                            </div>
                            <p className="text-[11px] text-slate-500 font-bold uppercase italic leading-relaxed">Reset to follow the university's official global branding and institutional aesthetics.</p>
                        </button>

                        {[
                            { id: 'academic', name: 'Classic Academic', light: '#FDFBF7', dark: '#0f172a', desc: 'Warm paper & deep slate for scholarly focus.' },
                            { id: 'indigo', name: 'Indigo Fusion', light: '#F0F4F8', dark: '#0B0E14', desc: 'Cool slate & obsidian for tech-driven minds.' },
                            { id: 'nature', name: 'Nature\'s Breath', light: '#F0FDF4', dark: '#052E16', desc: 'Mint & forest tones for a calm study session.' },
                            { id: 'amethyst', name: 'Royal Amethyst', light: '#F5F3FF', dark: '#1E1B4B', desc: 'Lavender & midnight for premium distinction.' },
                            { id: 'sunset', name: 'Sunset Horizon', light: '#FFF1F2', dark: '#450A0A', desc: 'Rose & burgundy for high-energy productivity.' },
                            { id: 'ocean', name: 'Ocean Deep', light: '#F0F9FF', dark: '#082F49', desc: 'Sky & sea blues for serene concentration.' },
                            { id: 'cyber', name: 'Cyber Gold', light: '#FEFCE8', dark: '#1A1600', desc: 'Lemon & bronze for bold institutional grit.' }
                        ].map(t => (
                            <button 
                                key={t.id}
                                onClick={() => {
                                    localStorage.setItem('personal_theme', JSON.stringify(t));
                                    document.documentElement.style.setProperty('--bg-light', t.light);
                                    document.documentElement.style.setProperty('--bg-dark', t.dark);
                                }}
                                className="p-10 rounded-[3rem] border border-slate-200 dark:border-white/5 bg-white/70 dark:bg-white/5 backdrop-blur-xl hover:border-indigo-500/30 transition-all text-left group shadow-xl"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">{t.name}</div>
                                    <div className="flex gap-2">
                                        <div className="w-5 h-5 rounded-full border border-black/5 shadow-md" style={{ backgroundColor: t.light }} />
                                        <div className="w-5 h-5 rounded-full border border-black/5 shadow-md" style={{ backgroundColor: t.dark }} />
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-400 font-bold uppercase italic leading-relaxed mb-8">{t.desc}</p>
                                <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} whileHover={{ width: '100%' }} transition={{ duration: 0.8 }} className="h-full bg-gradient-to-r from-teal-500 to-indigo-600 shadow-[0_0_15px_rgba(20,184,166,0.3)]" />
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>
              )}
          </AnimatePresence>
        </main>
      </div>
      <AnimatePresence>
        {quizGenOpen && <QuizGenerator onClose={() => setQuizGenOpen(false)} onSave={() => {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          axios.get('http://localhost:5001/api/gamification/quizzes', config).then(r => setQuizzes(r.data));
        }} />}
      </AnimatePresence>
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px; /* High visibility width */
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.02);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(99, 102, 241, 0.3);
            border-radius: 10px;
            border: 2px solid transparent;
            background-clip: content-box;
            min-height: 40px;
          }
          .custom-scrollbar:hover::-webkit-scrollbar-thumb {
            background: rgba(99, 102, 241, 0.6);
            background-clip: content-box;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            background-clip: content-box;
          }
          .dark .custom-scrollbar:hover::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.4);
            background-clip: content-box;
          }
          
          /* Enforce visibility even on Mac OS hidden scrollbar settings */
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
          }
          
          @media (min-width: 1024px) {
            html, body {
              overflow: hidden !important;
              height: 100%;
            }
          }
        `}
      </style>
    </div>
  );
};

export default FacultyDashboard;
