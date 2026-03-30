import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  FileText, Download, Printer, Calendar, 
  ChevronLeft, ChevronRight, Search, Users,
  Check, X, Minus, Loader2, FileSpreadsheet, ShieldCheck, Clock, Shield, Activity
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import AdminStudentProfileModal from '../admin/AdminStudentProfileModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const MonthlyRegister = ({ user, initialSemester, initialCourse, onPersistChange }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(initialCourse);
  const [semester, setSemester] = useState(initialSemester || 1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [dailyAttendanceRecords, setDailyAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingStudentId, setViewingStudentId] = useState(null); 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const res = await axios.get('http://localhost:5001/api/courses', config);
        setCourses(res.data);
        if (res.data.length > 0 && !initialCourse && !initialSemester) {
            const defaultSem = (user.role === 'admin' ? 1 : (user.assignedSemesters?.[0] || 1));
            const targetCourse = res.data.find(c => c.semester === defaultSem) || res.data[0];
            setSelectedCourse(targetCourse);
            setSemester(targetCourse.semester);
            onPersistChange(targetCourse.semester, targetCourse);
        }
      } catch (error) { console.error('Error fetching courses:', error); }
    };
    fetchCourses();
  }, [user.token, initialCourse, initialSemester]);

  useEffect(() => {
    if (!selectedCourse) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const studentsRes = await axios.get(`http://localhost:5001/api/courses/${selectedCourse.code}/students?semester=${semester}`, config);
        setStudents(studentsRes.data);
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const startDate = new Date(year, month, 1).toISOString();
        const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
        const attendanceRes = await axios.get(`http://localhost:5001/api/attendance/course/${selectedCourse._id}?startDate=${startDate}&endDate=${endDate}&semester=${semester}`, config);
        setAttendanceRecords(attendanceRes.data.attendanceRecords || attendanceRes.data);
        if (studentsRes.data.length > 0) {
            const studentIds = studentsRes.data.map(s => s._id).join(',');
            const dailyRes = await axios.get(`http://localhost:5001/api/attendance/daily/monthly-bulk?studentIds=${studentIds}&month=${selectedDate.getMonth() + 1}&year=${selectedDate.getFullYear()}`, config);
            setDailyAttendanceRecords(dailyRes.data);
        }
      } catch (error) { console.error('Error fetching register data:', error); }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, [selectedCourse, selectedDate, semester, user.token]);

  const daysInMonth = useMemo(() => {
    const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const days = [];
    for (let i = 1; i <= date.getDate(); i++) days.push(i);
    return days;
  }, [selectedDate]);

  const isAuthorized = useMemo(() => {
    if (user.role === 'admin') return true;
    if (!selectedCourse) return false;
    const isExplicitlyAssigned = selectedCourse.facultyAssigned?.some(f => 
      (typeof f === 'string' ? f : f._id) === user._id
    );
    if (isExplicitlyAssigned) return true;
    const isSemAssigned = user.assignedSemesters?.includes(selectedCourse.semester);
    const isDeptMatch = user.department === selectedCourse.department?.name || user.department === selectedCourse.department?.code;
    return isSemAssigned && isDeptMatch;
  }, [user, selectedCourse]);

  const attendanceGrid = useMemo(() => {
    const grid = {};
    if (!attendanceRecords || !Array.isArray(attendanceRecords)) return grid;
    attendanceRecords.forEach(record => {
      const day = new Date(record.date).getUTCDate();
      const studentId = record.student?._id || record.student;
      if (!grid[studentId]) grid[studentId] = {};
      if (record.status === 'present') grid[studentId][day] = 'P';
      else if (record.status === 'absent') grid[studentId][day] = 'A';
    });
    if (Array.isArray(dailyAttendanceRecords)) {
      dailyAttendanceRecords.forEach(record => {
        const day = new Date(record.date).getUTCDate();
        const studentId = record.student?._id || record.student;
        if (!grid[studentId]) grid[studentId] = {};
        const existing = grid[studentId][day] || '';
        if (record.status === 'present') grid[studentId][day] = existing + 'D';
        else if (record.status === 'incomplete') grid[studentId][day] = existing + 'i';
      });
    }
    return grid;
  }, [attendanceRecords, dailyAttendanceRecords]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [students, searchQuery]);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const exportPDF = () => {
    if (!isAuthorized) return;
    const doc = jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(18);
    doc.text(`Monthly Attendance Register - ${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`, 14, 20);
    const tableHeaders = [['Roll No', 'Student Name', ...daysInMonth.map(String), 'Total']];
    const tableData = filteredStudents.map(student => {
      let presentCount = 0;
      const row = [student.rollNumber, student.name, ...daysInMonth.map(day => {
          const status = attendanceGrid[student._id]?.[day];
          if (status?.includes('P')) presentCount++;
          return status || '-';
        }), presentCount];
      return row;
    });
    autoTable(doc, { startY: 45, head: tableHeaders, body: tableData, theme: 'grid', styles: { fontSize: 6 } });
    doc.save(`Register_${selectedCourse.code}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-6 leading-none shrink-0 overflow-hidden">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center"><Calendar size={24}/></div>
                <div>
                   <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Attendance Register</h2>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Administrative Record System</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
               <select value={semester} onChange={(e) => { const val = Number(e.target.value); setSemester(val); onPersistChange(val, selectedCourse); }}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2.5 text-[10px] font-black uppercase tracking-wider focus:ring-2 focus:ring-indigo-500 outline-none w-24 cursor-pointer text-gray-900 dark:text-white appearance-none">
                 {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s} className="dark:bg-gray-800">Sem {s}</option>)}
               </select>

               <select value={selectedCourse?.code || ''} onChange={(e) => { const course = courses.find(c => c.code === e.target.value); setSelectedCourse(course); onPersistChange(semester, course); }}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2.5 text-[10px] font-black uppercase tracking-wider focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer text-gray-900 dark:text-white appearance-none max-w-[200px]">
                 {courses.filter(c => c.semester === semester).map(c => <option key={c._id} value={c.code} className="dark:bg-gray-800">{c.code} · {c.name}</option>)}
               </select>

               <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-2xl p-1 border border-gray-200 dark:border-gray-700">
                  <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all text-gray-400 dark:text-gray-100"><ChevronLeft size={16}/></button>
                  <div className="px-4 text-[10px] font-black uppercase tracking-widest min-w-[140px] text-center text-gray-900 dark:text-white">{months[selectedDate.getMonth()]} {selectedDate.getFullYear()}</div>
                  <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all text-gray-400 dark:text-gray-100"><ChevronRight size={16}/></button>
               </div>

               {isAuthorized && (
                 <div className="flex items-center gap-2">
                   <button onClick={exportPDF} disabled={students.length === 0} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"><FileText size={14}/> PDF</button>
                 </div>
               )}
            </div>
        </div>

        <div className="mt-6 flex items-center gap-4 border-t border-gray-50 dark:border-gray-800 pt-6 shrink-0 overflow-hidden">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                <input type="text" placeholder="Search student..." className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
            </div>
            <div className="flex items-center gap-6 overflow-hidden">
                <div className="flex items-center gap-2 font-black uppercase text-[8px] text-gray-400"><div className="w-2 h-2 rounded-full bg-emerald-500"/> Present</div>
                <div className="flex items-center gap-2 font-black uppercase text-[8px] text-gray-400"><div className="w-2 h-2 rounded-full bg-rose-500"/> Absent</div>
                <div className="flex items-center gap-2 font-black uppercase text-[8px] text-gray-400"><div className="w-2 h-2 rounded-full bg-indigo-600"/> Face Verified</div>
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden relative min-h-[500px]">
        {isLoading && <div className="absolute inset-0 z-20 bg-white/60 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center"><Loader2 size={40} className="text-indigo-600 animate-spin"/></div>}

        <div className="overflow-x-auto custom-scrollbar h-full">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left min-w-[120px] sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 text-[10px] font-black uppercase tracking-widest text-gray-400">Roll No</th>
                <th className="px-6 py-4 text-left min-w-[200px] sticky left-[120px] z-20 bg-gray-50 dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 text-[10px] font-black uppercase tracking-widest text-gray-400">Identity</th>
                {daysInMonth.map(day => (<th key={day} className="px-2 py-4 min-w-[40px] border-r border-gray-100 dark:border-gray-700 text-[10px] font-black uppercase text-gray-500 tabular-nums">{day}</th>))}
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map(student => {
                const gridData = attendanceGrid[student._id] || {};
                return (
                  <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all border-b border-gray-100 dark:border-gray-800">
                    <td className="px-6 py-3 sticky left-0 z-10 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700 font-black text-[11px] text-gray-400">{student.rollNumber}</td>
                    <td className="px-6 py-3 sticky left-[120px] z-10 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700 font-black text-xs uppercase cursor-pointer italic" onClick={() => setViewingStudentId(student._id)}>{student.name}</td>
                    {daysInMonth.map(day => {
                       const status = gridData[day] || '';
                       return (
                        <td key={day} className="p-0 border-r border-gray-50 dark:border-gray-800/50">
                          <div className="w-full h-10 flex items-center justify-center gap-0.5">
                             {status.includes('P') && <div className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center font-black text-[10px]">P</div>}
                             {status.includes('D') && <div className="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center"><ShieldCheck size={10}/></div>}
                             {status.includes('i') && <div className="w-5 h-5 rounded bg-amber-500 text-white flex items-center justify-center"><Clock size={10}/></div>}
                             {status.includes('A') && !status.includes('P') && <div className="w-5 h-5 rounded bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center font-black text-[10px]">A</div>}
                             {!status && <div className="w-1.5 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800"/>}
                          </div>
                        </td>
                       );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!isAuthorized && (
          <motion.div initial={{ opacity: 0, backdropFilter: 'blur(0px)' }} animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/20 dark:bg-slate-900/40">
            <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center max-w-md mx-4 leading-none">
              <div className="w-20 h-20 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500 mb-6 border border-rose-500/20 shadow-xl overflow-hidden"><Shield size={32} /></div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter mb-3">Historical Blockade</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">You are not authorized to view this register sector. This grid is encrypted for teachers not explicitly assigned to <span className="text-rose-500">{selectedCourse?.name || 'this course'}</span>.</p>
              <div className="mt-8 flex flex-col gap-2 w-full">
                 <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-3"><Activity size={14} className="text-slate-400"/><p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact HOD for decryption keys</p></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {viewingStudentId && <AdminStudentProfileModal studentId={viewingStudentId} user={user} onClose={() => setViewingStudentId(null)} />}
    </div>
  );
};

export default MonthlyRegister;
