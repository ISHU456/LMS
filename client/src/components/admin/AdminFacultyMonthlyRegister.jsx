import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  FileText, Download, Printer, Calendar,
  ChevronLeft, ChevronRight, Search, Users,
  Check, X, Minus, Loader2, FileSpreadsheet, ShieldCheck, Clock, Shield, Activity, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminFacultyMonthlyRegister = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [faculty, setFaculty] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    const fetchRegisterData = async () => {
      setIsLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const month = selectedDate.getMonth() + 1;
        const year = selectedDate.getFullYear();

        const res = await axios.get(`http://localhost:5001/api/admin/teachers/monthly-attendance?month=${month}&year=${year}`, config);
        setFaculty(res.data.faculty);
        setAttendanceRecords(res.data.attendance);
      } catch (error) {
        console.error('Error fetching faculty register:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRegisterData();
  }, [selectedDate, user.token]);

  const daysInMonth = useMemo(() => {
    const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const days = [];
    for (let i = 1; i <= date.getDate(); i++) days.push(i);
    return days;
  }, [selectedDate]);

  const attendanceGrid = useMemo(() => {
    const grid = {};
    if (!attendanceRecords || !Array.isArray(attendanceRecords)) return grid;

    attendanceRecords.forEach(record => {
      const day = new Date(record.date).getUTCDate();
      const teacherId = record.teacher?._id || record.teacher;
      if (!grid[teacherId]) grid[teacherId] = {};

      let status = '-';
      if (record.status === 'present') status = 'P';
      else if (record.status === 'absent') status = 'A';
      else if (record.status === 'late') status = 'L';
      else if (record.status === 'on_leave') status = 'OL';

      grid[teacherId][day] = status;
    });
    return grid;
  }, [attendanceRecords]);

  const filteredFaculty = useMemo(() => {
    return faculty.filter(f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [faculty, searchQuery]);

  const paginatedFaculty = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFaculty.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFaculty, currentPage, itemsPerPage]);

  const exportPDF = () => {
    const doc = jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.text(`Faculty Attendance Register - ${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`, 14, 15);

    const tableHeaders = [['Emp ID', 'Faculty Name', 'Dept', ...daysInMonth.map(String), 'Total P']];
    const tableData = filteredFaculty.map(member => {
      let presentCount = 0;
      const row = [
        member.employeeId || 'N/A',
        member.name,
        member.department || 'GEN',
        ...daysInMonth.map(day => {
          const status = attendanceGrid[member._id]?.[day] || '-';
          if (status === 'P') presentCount++;
          return status;
        }),
        presentCount
      ];
      return row;
    });

    autoTable(doc, {
      startY: 25,
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 5, cellPadding: 1 }
    });

    doc.save(`Faculty_Register_${months[selectedDate.getMonth()]}_${selectedDate.getFullYear()}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#080c14] rounded-3xl p-4 lg:p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 transition-all">
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center shadow-inner">
              <Calendar size={20} />
            </div>
            <div className="hidden sm:block">
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Faculty Register</h2>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Master Governance</p>
            </div>
          </div>

          <div className="flex-1 flex flex-row items-center justify-end gap-4 lg:gap-8">
            <div className="relative flex-1 max-w-[280px] hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder="Search identities..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white transition-all shadow-sm"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <div className="flex items-center bg-slate-50 dark:bg-white/5 rounded-xl p-1.5 border border-slate-100 dark:border-white/5 shadow-sm shrink-0">
              <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 dark:text-slate-100 active:scale-90 shadow-sm"><ChevronLeft size={16} /></button>
              <div className="px-4 text-[10px] font-black uppercase tracking-tighter min-w-[120px] text-center text-slate-900 dark:text-white italic tabular-nums whitespace-nowrap">{months[selectedDate.getMonth()]} {selectedDate.getFullYear()}</div>
              <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 dark:text-slate-100 active:scale-90 shadow-sm"><ChevronRight size={16} /></button>
            </div>

            <button onClick={exportPDF} disabled={faculty.length === 0} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] lg:text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 active:scale-95 flex items-center gap-2 shrink-0">
              <Download size={16} /> PDF DOWNLOAD
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-6 border-t border-slate-100 dark:border-slate-800/60 pt-4 overflow-x-auto custom-scrollbar-hidden">
          <div className="flex items-center gap-6">
            {[
              { label: 'Present', color: 'bg-emerald-500' },
              { label: 'Absent', color: 'bg-rose-500' },
              { label: 'Late', color: 'bg-amber-500' },
              { label: 'Leave', color: 'bg-indigo-500' }
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 font-black uppercase text-[8px] text-slate-400 whitespace-nowrap">
                <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} /> {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="bg-white dark:bg-[#080c14] rounded-[3rem] shadow-xl border border-slate-200 dark:border-slate-800/60 relative">
        {isLoading && (
          <div className="absolute inset-0 z-20 bg-white/60 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Loader2 size={40} className="text-indigo-600 animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-[45] bg-slate-900 dark:bg-black border-b border-white/10 shadow-sm">
              <tr>
                <th className="px-4 py-5 text-left w-12 sticky left-0 top-0 z-50 bg-slate-900 dark:bg-black border-b border-r border-white/10 text-[10px] font-black uppercase tracking-widest text-white">#</th>
                <th className="px-6 py-5 text-left min-w-[120px] sticky left-[48px] top-0 z-50 bg-slate-900 dark:bg-black border-b border-r border-white/10 text-[10px] font-black uppercase tracking-widest text-white">Emp ID</th>
                <th className="px-6 py-5 text-left min-w-[220px] sticky left-[168px] top-0 z-50 bg-slate-900 dark:bg-black border-b border-r border-white/10 text-[10px] font-black uppercase tracking-widest text-white">Faculty Identity</th>
                {daysInMonth.map(day => (
                  <th key={day} className="px-2 py-5 min-w-[45px] border-b border-r border-white/10 text-[10px] font-black uppercase text-white tabular-nums text-center bg-slate-900 dark:bg-black sticky top-0 z-[44]">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedFaculty.length > 0 ? paginatedFaculty.map((member, idx) => {
                const gridData = attendanceGrid[member._id] || {};
                return (
                  <tr
                    key={member._id}
                    className="hover:bg-slate-50 dark:hover:bg-indigo-500/5 border-b border-slate-100 dark:border-slate-800/60"
                  >
                    <td className="px-4 py-4 sticky left-0 z-10 bg-white dark:bg-[#080c14] border-r border-slate-200 dark:border-slate-700 font-black text-[10px] text-slate-400 tabular-nums">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td className="px-6 py-4 sticky left-[48px] z-10 bg-white dark:bg-[#080c14] border-r border-slate-200 dark:border-slate-700 font-black text-[10px] text-slate-400 font-mono tracking-tighter italic uppercase">{member.employeeId || 'NO-ID'}</td>
                    <td className="px-6 py-4 sticky left-[168px] z-10 bg-white dark:bg-[#080c14] border-r border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center font-black text-xs text-slate-400 border border-slate-200 dark:border-white/5 uppercase overflow-hidden">
                          {member.profilePic ? <img src={member.profilePic} className="w-full h-full object-cover" /> : member.name[0]}
                        </div>
                        <div>
                          <p className="font-black text-xs uppercase dark:text-white tabular-nums tracking-tight">{member.name}</p>
                          <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{member.department || 'GENERAL SECTOR'}</p>
                        </div>
                      </div>
                    </td>
                    {daysInMonth.map(day => {
                      const status = gridData[day] || '-';
                      return (
                        <td key={day} className="p-0 border-r border-slate-50 dark:border-slate-800/50">
                          <div className="w-full h-12 flex items-center justify-center">
                            {status === 'P' && <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-[10px] shadow-lg shadow-emerald-500/20">P</div>}
                            {status === 'A' && <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center font-black text-[10px] border border-rose-200 dark:border-rose-900/50">A</div>}
                            {status === 'L' && <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-[10px] shadow-lg shadow-amber-500/20">L</div>}
                            {status === 'OL' && <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-[9px] shadow-lg shadow-indigo-600/20">LV</div>}
                            {status === '-' && <div className="w-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800" />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={daysInMonth.length + 2} className="py-32 text-center text-slate-400 italic font-black uppercase tracking-[0.5em] opacity-30">No Active Faculty Logs Detected</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tactical Pagination Deck */}
        {Math.ceil(faculty.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).length / itemsPerPage) > 1 && (
          <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
              Registry Block {currentPage} of {Math.ceil(faculty.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).length / itemsPerPage)}
            </p>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                disabled={currentPage === Math.ceil(faculty.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).length / itemsPerPage)}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFacultyMonthlyRegister;
