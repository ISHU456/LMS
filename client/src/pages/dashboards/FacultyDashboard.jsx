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
  ShieldCheck, FileCheck, Settings
} from 'lucide-react';
import DashboardOverview from '../../components/teacher/DashboardOverview';
import AttendanceManager from '../../components/teacher/AttendanceManager';
import CourseAccessManager from '../../components/teacher/CourseAccessManager';
import MonthlyRegister from '../../components/teacher/MonthlyRegister';

// ─── Helpers ────────────────────────────────────────────────
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
  const map = {
    'CS301': '🧮', 'CS401': '⚙️', 'CS501': '🌐', 'CS899': '🚀', 'default': '📚'
  };
  return map[id] || map.default;
};

const getCourseColor = (id) => {
  const map = {
    'CS301': '#4361ee', 'CS401': '#7209b7', 'CS501': '#f72585', 'CS899': '#4cc9f0', 'default': '#6366f1'
  };
  return map[id] || map.default;
};

const EMPTY_FORM = {
  id: null, course:'', day:'Monday',
  startTime:'09:00', endTime:'10:30',
  room:'', type:'lecture', notes:''
};

// ─── Schedule Edit Modal ─────────────────────────────────────
const ScheduleModal = ({ form, setForm, onSave, onClose, isEdit, courses }) => {
  const selectedCourse = courses.find(c => c.code === form.course) || courses[0] || { code: 'N/A', name: 'Select Course', color: '#6366f1' };
  const courseColor = getCourseColor(selectedCourse.code);
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale:0.92, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.92, y:20 }}
        className="bg-white dark:bg-[#111827] rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-gray-800 overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Modal Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800"
          style={{ background: `linear-gradient(135deg, ${courseColor}15, transparent)` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: `${courseColor}20` }}>{getCourseIcon(selectedCourse.code)}</div>
            <div>
              <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
                {isEdit ? 'Edit Session' : 'Add New Session'}
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Faculty Schedule Manager</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
            <X size={18} className="text-gray-500"/>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">

          {/* Course Select */}
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <BookOpen size={11}/> Course
            </label>
            <select value={form.course} onChange={e => setForm(f=>({...f,course:e.target.value}))}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
              <option value="">Select Course</option>
              {courses.map(c => <option key={c._id} value={c.code}>{getCourseIcon(c.code)} {c.code} — {c.name}</option>)}
            </select>
          </div>

          {/* Day + Type grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <CalendarDays size={11}/> Day
              </label>
              <select value={form.day} onChange={e => setForm(f=>({...f,day:e.target.value}))}
                className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Tag size={11}/> Session Type
              </label>
              <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}
                className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Clock size={11}/> Start Time
              </label>
              <input type="time" value={form.startTime} onChange={e => setForm(f=>({...f,startTime:e.target.value}))}
                className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"/>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Clock size={11}/> End Time
              </label>
              <input type="time" value={form.endTime} onChange={e => setForm(f=>({...f,endTime:e.target.value}))}
                className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"/>
            </div>
          </div>

          {/* Room */}
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <MapPin size={11}/> Room / Venue
            </label>
            <input type="text" value={form.room} onChange={e => setForm(f=>({...f,room:e.target.value}))}
              placeholder="e.g. LHC-101, Lab-B, Online..."
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder:text-gray-300 dark:placeholder:text-gray-600"/>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <FileText size={11}/> Topic / Notes (Optional)
            </label>
            <textarea value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))}
              placeholder="e.g. Chapter 5: Binary Trees, Exam prep..."
              rows={2}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder:text-gray-300 dark:placeholder:text-gray-600 resize-none"/>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-black text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            Cancel
          </button>
          <button onClick={onSave}
            className="flex-1 py-3 rounded-xl text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-90"
            style={{ background: `linear-gradient(135deg, #4361ee, #7209b7)` }}>
            <Save size={14}/> {isEdit ? 'Save Changes' : 'Add Session'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Session Card (list item) ────────────────────────────────
const SessionCard = ({ s, onEdit, onDelete, onLive }) => {
  const courseColor = getCourseColor(s.course);
  const typeMeta = TYPE_META(s.type);
  const TypeIcon = typeMeta.icon;
  return (
    <motion.div layout initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, x:-20 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group overflow-hidden">
      {/* Color bar */}
      <div className="h-1 w-full" style={{ background: courseColor }}/>
      <div className="p-4 flex items-center gap-4">
        {/* Time block */}
        <div className="shrink-0 text-center w-20 bg-gray-50 dark:bg-gray-800 rounded-xl py-2 px-1 border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-black text-gray-900 dark:text-white uppercase">{s.startTime}</p>
          <div className="w-4 h-[1px] bg-gray-300 dark:bg-gray-600 mx-auto my-1"/>
          <p className="text-[10px] font-bold text-gray-400 uppercase">{s.endTime}</p>
        </div>

        {/* Course icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background:`${courseColor}15` }}>{getCourseIcon(s.course)}</div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{s.course}</span>
            <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase"
              style={{ color: typeMeta.color, background:`${typeMeta.color}15` }}>
              <TypeIcon size={9}/> {s.type}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {s.room && <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400"><MapPin size={10}/>{s.room}</span>}
            {s.notes && <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 truncate max-w-[160px]"><FileText size={10}/>{s.notes}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={() => onLive(s.course)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-white text-[10px] font-black uppercase shadow-md transition-all hover:opacity-80"
            style={{ background:'linear-gradient(135deg,#ef4444,#dc2626)' }}>
            <Radio size={11}/> Live
          </button>
          <button onClick={() => onEdit(s)}
            className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all">
            <Edit2 size={15}/>
          </button>
          <button onClick={() => onDelete(s.id)}
            className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all">
            <Trash2 size={15}/>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Dashboard ──────────────────────────────────────────
const FacultyDashboard = () => {
  const { user }  = useSelector(s => s.auth);
  const navigate  = useNavigate();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('faculty_active_tab') || 'overview');

  useEffect(() => {
    localStorage.setItem('faculty_active_tab', activeTab);
  }, [activeTab]);
  const [schedule, setSchedule]   = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [assignments, setAssignments]   = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [time, setTime] = useState(new Date());

  // Modal state
  const [modalOpen, setModalOpen]   = useState(false);
  const [modalForm, setModalForm]   = useState(EMPTY_FORM);
  const [isEdit, setIsEdit]         = useState(false);
  const [filterDay, setFilterDay]   = useState(() => localStorage.getItem('faculty_schedule_filter_day') || 'All');
  const [viewMode, setViewMode]     = useState(() => localStorage.getItem('faculty_schedule_view_mode') || 'list');   // 'list' | 'grid'

  useEffect(() => {
    localStorage.setItem('faculty_schedule_filter_day', filterDay);
  }, [filterDay]);

  useEffect(() => {
    localStorage.setItem('faculty_schedule_view_mode', viewMode);
  }, [viewMode]);
  const [toast, setToast]           = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Persistence State
  const [globalSelectedSemester, setGlobalSelectedSemester] = useState(parseInt(localStorage.getItem('faculty_sem')) || 1);
  const [globalSelectedCourse, setGlobalSelectedCourse] = useState(null); 
  const [lastCourseId, setLastCourseId] = useState(localStorage.getItem('faculty_last_course_id') || null);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!user?.token) return;
    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    axios.get('http://localhost:5001/api/assignments', config).then(r => setAssignments(r.data)).catch(() => {});
    axios.get('http://localhost:5001/api/announcements', config).then(r => {
      const data = Array.isArray(r.data) ? r.data : (r.data.announcements || []);
      setAnnouncements(data.slice(0, 10));
    }).catch(() => {});
    axios.get('http://localhost:5001/api/notifications', config).then(r => {
      setNotifications(r.data);
    }).catch(() => {});

    // Fetch Courses and extract schedules
    axios.get('http://localhost:5001/api/courses', config).then(r => {
      const coursesData = r.data;
      setMyCourses(coursesData);
      
      // Auto-set the last selected course if it's in the fetched data
      if (lastCourseId) {
        const lastCourse = coursesData.find(c => c._id === lastCourseId);
        if (lastCourse) {
          setGlobalSelectedCourse(lastCourse);
          setGlobalSelectedSemester(lastCourse.semester);
        }
      }

      const flatSchedule = [];
      coursesData.forEach(c => {
        if (c.schedule && Array.isArray(c.schedule)) {
          c.schedule.forEach((s, idx) => {
            const [start, end] = s.time.includes('-') ? s.time.split('-') : [s.time, '10:00'];
            flatSchedule.push({
              id: `${c.code}-${idx}-${s.day}`,
              course: c.code,
              day: s.day,
              startTime: (start || '').trim(),
              endTime: (end || '').trim(),
              room: s.room,
              type: s.type === 'lecture' ? 'Theory' : s.type.charAt(0).toUpperCase() + s.type.slice(1),
              notes: s.activity,
              dbIndex: idx // Store original index for updates
            });
          });
        }
      });
      setSchedule(flatSchedule);
    }).catch(() => {});
  }, [user?.token]);

  const showToast = (msg, ok=true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };

  const openAdd = () => { setModalForm({...EMPTY_FORM, id: Date.now()}); setIsEdit(false); setModalOpen(true); };
  const openEdit = (s) => { setModalForm({...s}); setIsEdit(true); setModalOpen(true); };

  const handleSave = async () => {
    if (!modalForm.course) { showToast('Please select a course', false); return; }
    if (!modalForm.room.trim()) { showToast('Please enter a room/venue', false); return; }
    if (modalForm.startTime >= modalForm.endTime) { showToast('End time must be after start time', false); return; }
    
    setIsLoading(true);
    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    const courseCode = modalForm.course;
    const course = myCourses.find(c => c.code === courseCode);
    
    if (!course) { showToast('Course not found', false); return; }

    const newScheduleEntry = {
      day: modalForm.day,
      time: `${modalForm.startTime} - ${modalForm.endTime}`,
      room: modalForm.room,
      activity: modalForm.notes || 'No topic specified',
      type: modalForm.type === 'Theory' ? 'lecture' : modalForm.type.toLowerCase(),
      addedBy: user.name
    };

    let updatedList = [...(course.schedule || [])];
    if (isEdit) {
      updatedList[modalForm.dbIndex] = newScheduleEntry;
    } else {
      updatedList.push(newScheduleEntry);
    }

    try {
      await axios.put(`http://localhost:5001/api/courses/${courseCode}/schedule`, 
        { schedule: updatedList }, 
        config
      );
      
      showToast(isEdit ? 'Session updated successfully' : 'Session added to schedule');
      setModalOpen(false);
      // Reload everything
      window.location.reload(); 
    } catch (error) {
      showToast('Error syncing with database', false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // id format: courseCode-index-day
    const [courseCode, idx] = id.split('-');
    const course = myCourses.find(c => c.code === courseCode);
    if (!course) return;

    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    const updatedList = course.schedule.filter((_, i) => i !== parseInt(idx));

    try {
      await axios.put(`http://localhost:5001/api/courses/${courseCode}/schedule`, 
        { schedule: updatedList }, 
        config
      );
      showToast('Session removed');
      setDeleteConfirm(null);
      window.location.reload();
    } catch (error) {
      showToast('Failed to delete session', false);
    }
  };

  const greeting = () => {
    const h = time.getHours();
    return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  };

  const todayName = time.toLocaleDateString('en-IN', { weekday: 'long' });
  const todayClasses = schedule.filter(s => s.day === todayName).sort((a,b)=>a.startTime.localeCompare(b.startTime));
  const filteredSchedule = (filterDay === 'All' ? schedule : schedule.filter(s => s.day === filterDay))
    .sort((a,b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime));

  const stats = [
    { label:"Today's Classes", value: todayClasses.length, icon: Calendar,    color:'#4361ee', bg:'#eef2ff' },
    { label:'Total Sessions',  value: schedule.length,     icon: CalendarDays, color:'#7209b7', bg:'#f5f3ff' },
    { label:'Pending Grades',  value: assignments.length || 0, icon: CheckSquare, color:'#f59e0b', bg:'#fffbeb' },
    { label:'Announcements',   value: announcements.length,  icon: Bell,       color:'#f72585', bg:'#fff0f6' },
  ];

  const navItems = [
    { id:'overview',      label:'Dashboard',   icon: Activity    },
    { id:'attendance',    label:'Attendance',  icon: FileCheck   },
    { id:'register',      label:'Monthly Register', icon: Layers    },
    { id:'access',        label:'Access Control', icon: ShieldCheck },
    { id:'schedule',      label:'Schedule',    icon: CalendarDays},
    { id:'courses',       label:'My Course Hub', icon: BookOpen    },
    { id:'assignments',   label:'Grading',     icon: CheckSquare },
    { id:'results',       label:'Exam Grades', icon: FileCheck   },
    { id:'announcements', label:'Notices',     icon: Bell        },
  ];

  const coursesToDisplay = myCourses.map(c => ({
    id: c.code,
    name: c.name,
    icon: getCourseIcon(c.code),
    color: getCourseColor(c.code),
    sessions: schedule.filter(s => s.course === c.code).length,
    students: c.enrolledCount || 60,
    progress: c.completionRate || 75,
    isAuthorized: c.isAuthorized ?? true,
  }));

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col lg:flex-row bg-[#f8faff] dark:bg-[#0b0f1a]">

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-30 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-30 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-black uppercase tracking-widest ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {toast.ok ? <CheckCircle2 size={17}/> : <AlertCircle size={17}/>} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRM ── */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-7 shadow-2xl border border-gray-100 dark:border-gray-800 max-w-sm w-full mx-4 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-500"/>
              </div>
              <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wide mb-2">Remove Session?</h3>
              <p className="text-sm text-gray-400 mb-6">This lecture will be permanently deleted from your schedule.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-black text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL ── */}
      <AnimatePresence>
        {modalOpen && <ScheduleModal form={modalForm} setForm={setModalForm} onSave={handleSave} onClose={() => setModalOpen(false)} isEdit={isEdit} courses={myCourses}/>}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <aside className="w-full lg:w-64 shrink-0 flex flex-col bg-white dark:bg-[#111827] border-b lg:border-r border-gray-100 dark:border-gray-800 shadow-xl z-10 overflow-y-auto max-h-[40vh] lg:max-h-none">
        {/* Profile */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4361ee] to-[#7209b7] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
              {user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2) || 'FA'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-gray-900 dark:text-white truncate uppercase">{user?.name || 'Faculty'}</p>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Faculty · Academic Staff</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"/>
            <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 tabular-nums">
              {time.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
            </span>
            <span className="ml-auto text-[9px] font-bold text-gray-300 dark:text-gray-600 uppercase">{todayName.slice(0,3)}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.id} onClick={() => {
              if (item.id === 'results') {
                navigate('/results/entry');
              } else {
                setActiveTab(item.id);
              }
            }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-[#4361ee] to-[#7209b7] text-white shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/40'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
              <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'}/>
              <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>
              {activeTab === item.id && <ChevronRight size={14} className="ml-auto text-white/60"/>}
            </button>
          ))}
        </nav>

        {/* Quick actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <button onClick={() => { setActiveTab('schedule'); openAdd(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-500 dark:text-indigo-400 font-black text-xs uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
            <Plus size={14}/> Add Session
          </button>
          <Link to={`/live-class/${coursesToDisplay[0]?.id || 'default'}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200/50 dark:shadow-red-900/40 hover:opacity-90 transition-all">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"/>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"/>
            </span>
            <Radio size={13}/> Start Live Class
          </Link>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar">

        {/* ── MODERN PREMIUM HERO CARD ── */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2.5rem] mb-8 p-10 bg-gradient-to-br from-[#4361ee] via-[#480ca8] to-[#7209b7] shadow-2xl shadow-indigo-200/50 dark:shadow-none"
        >
          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <p className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em]">{greeting()}, Professor 👋</p>
              </div>
              
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-[0.9] flex flex-wrap items-center gap-y-2 gap-x-5">
                  {user?.name || 'Faculty'}
                  <span className="text-[11px] font-black text-indigo-100 opacity-60 px-4 py-2 rounded-2xl border border-white/20 bg-white/5 uppercase tracking-[0.3em] backdrop-blur-sm">Academic Portal</span>
                </h1>
                
                <div className="flex flex-wrap items-center gap-3 mt-8">
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl transition-all hover:bg-white/20">
                    <Calendar size={15} className="text-indigo-200" />
                    <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none">
                      {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl transition-all hover:bg-white/20">
                    <Clock size={15} className="text-indigo-200" />
                    <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none tabular-nums">
                      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-5">
              <div className="group relative text-center px-10 py-7 bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 rounded-[2.5rem] transition-all duration-500 transform hover:-translate-y-2 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
                <p className="text-5xl font-black text-white leading-none mb-1.5 group-hover:scale-110 transition-transform tabular-nums">{schedule.length}</p>
                <p className="text-[11px] font-black text-indigo-100 uppercase tracking-widest mt-1 opacity-60">Total Sessions</p>
              </div>
              
              <div className="group relative text-center px-10 py-7 bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 rounded-[2.5rem] transition-all duration-500 transform hover:-translate-y-2 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
                <p className="text-5xl font-black text-white leading-none mb-1.5 group-hover:scale-110 transition-transform tabular-nums">{todayClasses.length}</p>
                <p className="text-[11px] font-black text-indigo-100 uppercase tracking-widest mt-1 opacity-60">Today's Load</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="p-6 space-y-6">
        <AnimatePresence mode="wait">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-6">
              <DashboardOverview user={user} />
            </motion.div>
          )}

          {/* ── ATTENDANCE ── */}
          {activeTab === 'attendance' && (
            <motion.div key="attendance" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-6">
               <AttendanceManager 
                 user={user} 
                 initialSemester={globalSelectedSemester}
                 initialCourse={globalSelectedCourse}
                 onPersistChange={(sem, course) => {
                    setGlobalSelectedSemester(sem);
                    setGlobalSelectedCourse(course);
                    if (course?._id) localStorage.setItem('faculty_last_course_id', course._id);
                    localStorage.setItem('faculty_sem', sem);
                 }}
               />
            </motion.div>
          )}

          {/* ── MONTHLY REGISTER ── */}
          {activeTab === 'register' && (
            <motion.div key="register" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-6">
               <MonthlyRegister 
                 user={user} 
                 initialSemester={globalSelectedSemester}
                 initialCourse={globalSelectedCourse}
                 onPersistChange={(sem, course) => {
                    setGlobalSelectedSemester(sem);
                    setGlobalSelectedCourse(course);
                    if (course?._id) localStorage.setItem('faculty_last_course_id', course._id);
                    localStorage.setItem('faculty_sem', sem);
                 }}
               />
            </motion.div>
          )}

           {/* ── ACCESS CONTROL ── */}
           {activeTab === 'access' && (
            <motion.div key="access" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-6">
               <CourseAccessManager 
                 user={user} 
                 initialSemester={globalSelectedSemester}
                 initialCourse={globalSelectedCourse}
                 onPersistChange={(sem, course) => {
                    setGlobalSelectedSemester(sem);
                    setGlobalSelectedCourse(course);
                    if (course?._id) localStorage.setItem('faculty_last_course_id', course._id);
                    localStorage.setItem('faculty_sem', sem);
                 }}
               />
            </motion.div>
          )}

          {/* ── SCHEDULE MANAGER ── */}
          {activeTab === 'schedule' && (
            <motion.div key="schedule" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-5">

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mr-auto">Schedule Manager</h2>
                {/* Day filter pills */}
                <div className="flex items-center gap-1 flex-wrap">
                  {['All',...DAYS].map(d => (
                    <button key={d} onClick={() => setFilterDay(d)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                        filterDay === d
                          ? 'bg-gradient-to-r from-[#4361ee] to-[#7209b7] text-white shadow-md'
                          : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}>{d === 'All' ? 'All Days' : d.slice(0,3)}</button>
                  ))}
                </div>
                {/* View toggle */}
                <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1 gap-1">
                  <button onClick={()=>setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode==='list'?'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600':'text-gray-400'}`}><LayoutList size={15}/></button>
                  <button onClick={()=>setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode==='grid'?'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600':'text-gray-400'}`}><LayoutGrid size={15}/></button>
                </div>
                <button onClick={openAdd}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4361ee] to-[#7209b7] text-white font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90 transition-all">
                  <PlusCircle size={15}/> Add Session
                </button>
              </div>

              {/* Session count */}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Showing {filteredSchedule.length} session{filteredSchedule.length !== 1 ? 's' : ''} {filterDay !== 'All' ? `· ${filterDay}` : '· All Week'}
              </p>

              {/* Sessions */}
              {filteredSchedule.length > 0 ? (
                viewMode === 'list' ? (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {DAYS.filter(d => filterDay === 'All' || d === filterDay).map(day => {
                        const daySessions = filteredSchedule.filter(s => s.day === day);
                        if (!daySessions.length) return null;
                        return (
                          <div key={day}>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{day}</span>
                              <div className="flex-1 h-[1px] bg-gray-100 dark:bg-gray-800"/>
                              <span className="text-[9px] font-black text-gray-300 dark:text-gray-700 uppercase">{daySessions.length} session{daySessions.length!==1?'s':''}</span>
                            </div>
                            {daySessions.map(s => (
                              <div key={s.id} className="mb-2">
                                <SessionCard s={s} onEdit={openEdit} onDelete={id=>setDeleteConfirm(id)} onLive={cid=>navigate(`/live-class/${cid}`)}/>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                ) : (
                  // Grid view
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {filteredSchedule.map((s,i) => {
                        const courseColor = getCourseColor(s.course);
                        const courseName = myCourses.find(c => c.code === s.course)?.name || 'Course';
                        const tm = TYPE_META(s.type); const TI = tm.icon;
                        return (
                          <motion.div key={s.id} layout initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }} transition={{ delay:i*0.04 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                            <div className="h-1.5" style={{ background:courseColor }}/>
                            <div className="p-5">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-2xl">{getCourseIcon(s.course)}</span>
                                <span className="text-[9px] font-black px-2 py-1 rounded-full uppercase" style={{ color:tm.color, background:`${tm.color}15` }}><TI size={8} className="inline mr-0.5"/>{s.type}</span>
                              </div>
                              <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{s.course}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{courseName}</p>
                              <div className="mt-3 space-y-1.5">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500"><CalendarDays size={10} className="text-indigo-400"/>{s.day}</div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500"><Clock size={10} className="text-indigo-400"/>{s.startTime} – {s.endTime}</div>
                                {s.room && <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500"><MapPin size={10} className="text-indigo-400"/>{s.room}</div>}
                                {s.notes && <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 truncate"><FileText size={10} className="text-indigo-400 shrink-0"/>{s.notes}</div>}
                              </div>
                              <div className="flex gap-2 mt-4">
                                <Link to={`/live-class/${s.course}`} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-white text-[10px] font-black uppercase shadow-md" style={{ background:'linear-gradient(135deg,#ef4444,#dc2626)' }}><Radio size={11}/> Live</Link>
                                <button onClick={()=>openEdit(s)} className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500"><Edit2 size={14}/></button>
                                <button onClick={()=>setDeleteConfirm(s.id)} className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500"><Trash2 size={14}/></button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )
              ) : (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-16 text-center">
                  <CalendarDays size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3"/>
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">No sessions for {filterDay === 'All' ? 'this week' : filterDay}</p>
                  <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#4361ee] to-[#7209b7] text-white font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"><Plus size={14}/> Add First Session</button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── COURSES ── */}
          {activeTab === 'courses' && (
            <motion.div key="courses" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-5">
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">My Courses</h2>
              {coursesToDisplay.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {coursesToDisplay.map((c,i) => (
                    <motion.div key={c.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
                      className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all overflow-hidden ${!c.isAuthorized ? 'opacity-50 grayscale-[0.3]' : 'opacity-100'}`}>
                      {!c.isAuthorized && (
                        <div className="absolute top-3 right-3 z-10">
                          <span className="px-3 py-1 bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[8px] font-black uppercase tracking-widest rounded-full border border-gray-100 dark:border-gray-700">View Only</span>
                        </div>
                      )}
                      <div className="h-1.5" style={{ background:`linear-gradient(90deg,${c.color},${c.color}88)` }}/>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md" style={{ background:`${c.color}15` }}>{c.icon}</div>
                            <div>
                              <p className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight">{c.name}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color:c.color }}>{c.id} · {c.sessions} sessions scheduled</p>
                            </div>
                          </div>
                          <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ color:c.color, background:`${c.color}15` }}>{c.students} 👤</span>
                        </div>
                        <div className="mb-4">
                          <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 mb-1.5"><span>Progress</span><span style={{ color:c.color }}>{c.progress}%</span></div>
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <motion.div initial={{ width:0 }} animate={{ width:`${c.progress}%` }} transition={{ duration:0.7, delay:i*0.1 }} className="h-full rounded-full" style={{ background:c.color }}/>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/course-inner/${c.id}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-black text-xs uppercase tracking-wider shadow-md hover:opacity-90 transition-all" style={{ background:c.color }}><BookOpen size={13}/> Enter</Link>
                          <Link to={`/live-class/${c.id}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xs uppercase tracking-wider shadow-md hover:opacity-80 transition-all"><Radio size={13}/> Live</Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-[2.5rem] flex flex-col items-center justify-center p-20 text-center h-full min-h-[500px]">
                  <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-900/10 flex items-center justify-center mb-6 text-indigo-500">
                    <BookOpen size={40} className="opacity-40" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-3">No Authorized Courses</h3>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest max-w-[280px] leading-relaxed">
                    You do not currently have any assigned nodes or authorization permissions for courses in this department/semester bucket.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── ASSIGNMENTS ── */}
          {activeTab === 'assignments' && (
            <motion.div key="assignments" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-4">
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Assignments</h2>
              {assignments.length > 0 ? assignments.map((a,i) => (
                <motion.div key={a._id} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.06 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0"><FileText size={20} className="text-indigo-500"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">{a.title}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'N/A'} · {a.totalMarks} Marks</p>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-[9px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-800 shrink-0">Pending</span>
                </motion.div>
              )) : (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
                  <CheckSquare size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3"/>
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No assignments found</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── NOTICES & NOTIFICATIONS ── */}
          {activeTab === 'announcements' && (
            <motion.div key="announcements" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                   <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Institutional Hub</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Global Protocol & Private Faculty Alerts</p>
                </div>
                <Link to="/community" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all border border-indigo-400/20"><PlusCircle size={13}/> Post Notice</Link>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Personal Multi-cast Alerts */}
                {notifications.map((n, i) => (
                   <motion.div 
                     key={n._id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.05 }}
                     className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] p-6 border transition-all ${!n.read ? 'border-amber-500/30 shadow-lg shadow-amber-500/5' : 'border-slate-100 dark:border-slate-800'}`}
                   >
                     {!n.read && <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 blur-3xl rounded-full" />}
                     <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${n.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                           <AlertCircle size={20} />
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Personal Protocol Alert</span>
                              {!n.read && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                           </div>
                           <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase leading-tight mb-2">{n.title}</h3>
                           <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{n.message}</p>
                           {n.link && (
                              <button 
                                onClick={() => navigate(n.link)}
                                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                              >
                                View Resolution Node
                              </button>
                           )}
                        </div>
                        <div className="text-right shrink-0">
                           <p className="text-[9px] font-black text-slate-300 uppercase italic">
                             {new Date(n.createdAt).toLocaleDateString()}
                           </p>
                        </div>
                     </div>
                   </motion.div>
                ))}

                {/* Global Broadcasts */}
                {announcements.map((a, i) => (
                  <motion.div 
                    key={a._id} 
                    initial={{ opacity:0, y:10 }} 
                    animate={{ opacity:1, y:0 }} 
                    transition={{ delay:(notifications.length + i) * 0.05 }}
                    className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-start gap-4 group hover:border-indigo-500/30 transition-all"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                       <Bell size={20} className="text-indigo-500"/>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Institutional Broadcast</p>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase leading-tight mb-2">{a.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{a.content}</p>
                    </div>
                    <div className="text-right shrink-0">
                       <p className="text-[9px] font-black text-slate-300 uppercase italic">
                         {new Date(a.createdAt).toLocaleDateString()}
                       </p>
                    </div>
                  </motion.div>
                ))}

                {notifications.length === 0 && announcements.length === 0 && (
                  <div className="col-span-full bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-800 p-16 text-center">
                    <Bell size={40} className="mx-auto text-slate-700 mb-3 opacity-20"/>
                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Atmosphere remains clear · Global stream is empty</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default FacultyDashboard;
