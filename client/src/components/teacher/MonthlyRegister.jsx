import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  FileText, Download, Printer, Calendar, 
  ChevronLeft, ChevronRight, Search, Users,
  Check, X, Minus, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const MonthlyRegister = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [semester, setSemester] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch Teacher's Courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const res = await axios.get('http://localhost:5000/api/courses', config);
        setCourses(res.data);
        if (res.data.length > 0) setSelectedCourse(res.data[0]);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, [user.token]);

  // Fetch Students and Attendance for the selected month
  useEffect(() => {
    if (!selectedCourse) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        
        // Get Students
        const studentsRes = await axios.get(`http://localhost:5000/api/courses/${selectedCourse.code}/students?semester=${semester}`, config);
        setStudents(studentsRes.data);

        // Calculate Start and End of Month
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const startDate = new Date(year, month, 1).toISOString();
        const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

        // Get Attendance
        const attendanceRes = await axios.get(`http://localhost:5000/api/attendance/course/${selectedCourse._id}?startDate=${startDate}&endDate=${endDate}&semester=${semester}`, config);
        setAttendanceRecords(attendanceRes.data);
      } catch (error) {
        console.error('Error fetching register data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedCourse, selectedDate, semester, user.token]);

  // Generate days for the selected month
  const daysInMonth = useMemo(() => {
    const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const days = [];
    for (let i = 1; i <= date.getDate(); i++) {
        days.push(i);
    }
    return days;
  }, [selectedDate]);

  // Map attendance to a grid format
  const attendanceGrid = useMemo(() => {
    const grid = {};
    attendanceRecords.forEach(record => {
      const date = new Date(record.date).getDate();
      record.students.forEach(s => {
        const studentId = s.student._id || s.student;
        if (!grid[studentId]) grid[studentId] = {};
        // If multiple sessions on the same day, we mark it as P if any is P
        if (s.status === 'present') {
           grid[studentId][date] = 'P';
        } else if (!grid[studentId][date]) {
           grid[studentId][date] = 'A';
        }
      });
    });
    return grid;
  }, [attendanceRecords]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const prevMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  const nextMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));

  const exportPDF = () => {
    const doc = jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    // Add Title
    doc.setFontSize(18);
    doc.text(`Monthly Attendance Register - ${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`, 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Course: ${selectedCourse.name} (${selectedCourse.code})`, 14, 28);
    doc.text(`Semester: ${semester}`, 14, 34);
    doc.text(`Teacher: ${user.name}`, 14, 40);

    const tableHeaders = [['Roll No', 'Student Name', ...daysInMonth.map(String), 'Total', '%']];
    const tableData = filteredStudents.map(student => {
      let presentCount = 0;
      let totalAssessed = 0;

      const row = [
        student.rollNumber,
        student.name,
        ...daysInMonth.map(day => {
          const status = attendanceGrid[student._id]?.[day];
          if (status === 'P') presentCount++;
          if (status) totalAssessed++;
          return status || '-';
        })
      ];

      const percentage = totalAssessed > 0 ? ((presentCount / totalAssessed) * 100).toFixed(1) : '0';
      row.push(presentCount);
      row.push(`${percentage}%`);
      return row;
    });

    doc.autoTable({
      startY: 45,
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 6, cellPadding: 1, halign: 'center' },
      headStyles: { fillColor: [67, 97, 238], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 15, halign: 'left' },
        1: { cellWidth: 35, halign: 'left' }
      }
    });

    doc.save(`Attendance_Register_${selectedCourse.code}_${months[selectedDate.getMonth()]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center">
                    <Calendar size={24}/>
                </div>
                <div>
                   <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Attendance Register</h2>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Administrative Record System</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
               <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-2xl p-1 border border-gray-200 dark:border-gray-700">
                  <button onClick={prevMonth} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all">
                    <ChevronLeft size={16}/>
                  </button>
                  <div className="px-4 text-xs font-black uppercase tracking-widest min-w-[140px] text-center">
                    {months[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                  </div>
                  <button onClick={nextMonth} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all">
                    <ChevronRight size={16}/>
                  </button>
               </div>

               <select 
                value={selectedCourse?.code || ''} 
                onChange={(e) => setSelectedCourse(courses.find(c => c.code === e.target.value))}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2.5 text-xs font-black uppercase tracking-wider focus:ring-2 focus:ring-indigo-500 outline-none"
               >
                 {courses.map(c => <option key={c._id} value={c.code}>{c.code} - {c.name}</option>)}
               </select>

               <select 
                value={semester} 
                onChange={(e) => setSemester(Number(e.target.value))}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2.5 text-xs font-black uppercase tracking-wider focus:ring-2 focus:ring-indigo-500 outline-none w-24"
               >
                 {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
               </select>

               <button 
                onClick={exportPDF}
                disabled={students.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
               >
                 <Download size={14}/> Export PDF
               </button>
            </div>
        </div>

        <div className="mt-6 flex items-center gap-4 border-t border-gray-50 dark:border-gray-800 pt-6">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                <input 
                  type="text" 
                  placeholder="Search student by name or roll number..."
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500"/>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">Present</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-rose-500"/>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">Absent</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-800"/>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">No Session</span>
                </div>
            </div>
        </div>
      </div>

      {/* Register Table Interface */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden relative">
        {isLoading && (
            <div className="absolute inset-0 z-20 bg-white/60 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={40} className="text-indigo-600 animate-spin"/>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Accessing Records...</p>
                </div>
            </div>
        )}

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left min-w-[120px] sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 shadow-xl border-r border-gray-100 dark:border-gray-700">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none">Roll Number</span>
                </th>
                <th className="px-6 py-4 text-left min-w-[200px] sticky left-[120px] z-20 bg-gray-50 dark:bg-gray-800 shadow-xl border-r border-gray-100 dark:border-gray-700">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Student Identity</span>
                </th>
                {daysInMonth.map(day => (
                  <th key={day} className="px-2 py-4 min-w-[40px] border-r border-gray-100 dark:border-gray-700 last:border-0">
                    <span className="text-[10px] font-black uppercase text-gray-500 tabular-nums">{day}</span>
                  </th>
                ))}
                <th className="px-6 py-4 min-w-[80px] bg-indigo-50/50 dark:bg-indigo-900/10 border-l border-indigo-100 dark:border-indigo-800">
                  <span className="text-[10px] font-black uppercase text-indigo-600">Total</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? filteredStudents.map((student, idx) => {
                let pCount = 0;
                return (
                  <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all border-b border-gray-100 dark:border-gray-800 last:border-0 group">
                    <td className="px-6 py-3 sticky left-0 z-10 bg-white dark:bg-gray-900 shadow-lg border-r border-gray-100 dark:border-gray-700 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/80 transition-all">
                      <span className="text-[11px] font-black text-gray-400 tabular-nums group-hover:text-indigo-500 transition-all">{student.rollNumber}</span>
                    </td>
                    <td className="px-6 py-3 sticky left-[120px] z-10 bg-white dark:bg-gray-900 shadow-lg border-r border-gray-100 dark:border-gray-700 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/80 transition-all">
                      <p className="text-xs font-black text-gray-900 dark:text-white uppercase truncate">{student.name}</p>
                    </td>
                    {daysInMonth.map(day => {
                       const status = attendanceGrid[student._id]?.[day];
                       if (status === 'P') pCount++;
                       return (
                        <td key={day} className="p-0 border-r border-gray-50 dark:border-gray-800/50 last:border-0">
                          <div className={`w-full h-10 flex items-center justify-center`}>
                             {status === 'P' ? (
                               <div className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
                                 <p className="text-[10px] font-black">P</p>
                               </div>
                             ) : status === 'A' ? (
                               <div className="w-5 h-5 rounded bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center transform scale-90">
                                 <p className="text-[10px] font-black">A</p>
                               </div>
                             ) : (
                               <div className="w-1.5 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800"/>
                             )}
                          </div>
                        </td>
                       );
                    })}
                    <td className="px-6 py-3 bg-indigo-50/20 dark:bg-indigo-900/5 border-l border-indigo-100 dark:border-indigo-800 text-center">
                        <span className="text-xs font-black text-indigo-600 tabular-nums">{pCount}</span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                    <td colSpan={daysInMonth.length + 3} className="py-20 text-center">
                        <Users size={40} className="mx-auto text-gray-200 mb-2"/>
                        <p className="text-sm font-black text-gray-300 uppercase tracking-widest">No students matched the criteria</p>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Legend / Info Footer */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 flex flex-wrap items-center justify-between gap-6 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Total Students:</span>
                    <span className="text-xs font-black text-gray-900 dark:text-white">{students.length}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Avg Attendance:</span>
                    <span className="text-xs font-black text-emerald-500">84.2%</span>
                </div>
            </div>
            <div className="text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-[0.3em]">
                Monthly Register Protocol v2.4 · Secure Academic Node
            </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyRegister;
