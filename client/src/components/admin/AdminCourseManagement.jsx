import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Edit2, Trash2, ChevronRight, X, Save, RefreshCw
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
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
      showNotification('error', 'Critical Error: Connection lost.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleOpenModal = useCallback((course = null) => {
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
  }, [departments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await axios.put(`http://localhost:5001/api/admin/courses/${editingCourse._id}`, formData, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        showNotification('success', 'Update successful.');
      } else {
        await axios.post('http://localhost:5001/api/admin/courses', formData, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        showNotification('success', 'Addition successful.');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Transaction failed.');
    }
  };

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Confirm deletion?')) return;
    try {
      await axios.delete(`http://localhost:5001/api/admin/courses/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      showNotification('success', 'Purge successful.');
      fetchData();
    } catch (err) {
      showNotification('error', 'Deletion failed.');
    }
  }, [user.token]);

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const name = course.name?.toLowerCase() || '';
      const code = course.code?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      const matchesSearch = name.includes(search) || code.includes(search);
      const matchesDept = filterDept === 'all' || (course.department?._id === filterDept || course.department === filterDept);
      const matchesSem = filterSem === 'all' || course.semester.toString() === filterSem;
      const matchesCourse = filterCourse === 'all' || course._id === filterCourse;
      return matchesSearch && matchesDept && matchesSem && matchesCourse;
    }).sort((a, b) => a.semester - b.semester);
  }, [courses, searchTerm, filterDept, filterSem, filterCourse]);

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const paginatedCourses = useMemo(() => {
    return filteredCourses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredCourses, currentPage]);

  return (
    <div className="space-y-6 will-change-transform font-sans">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-24 right-8 z-[60] flex items-center gap-3 px-6 py-4 rounded-xl shadow-xl ${
          notification.type === 'success' ? 'bg-indigo-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <p className="font-bold text-xs uppercase tracking-widest">{notification.message}</p>
        </div>
      )}

      {/* Header & Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white p-6 rounded-2xl font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-sm"
        >
          + Add New Course
        </button>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Total Subjects</p>
            <h3 className="text-3xl font-black dark:text-white">{courses.length}</h3>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Academic Departments</p>
            <h3 className="text-3xl font-black dark:text-white">{departments.length}</h3>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm space-y-6 border border-gray-100 dark:border-gray-700">
          <input 
              type="text" 
              placeholder="Search curriculum..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3 text-xs font-bold outline-none focus:border-indigo-500 transition-colors dark:text-white"
          />
          
          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-50 dark:border-gray-700">
              <select 
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest dark:text-gray-200 outline-none"
              >
                  <option value="all">Global Sectors</option>
                  {departments.map(d => (
                      <option key={d._id} value={d._id}>{d.code} NODE</option>
                  ))}
              </select>

              <select 
                  value={filterSem}
                  onChange={(e) => setFilterSem(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest dark:text-gray-200 outline-none"
              >
                  <option value="all">Full Curriculum</option>
                  {[1,2,3,4,5,6,7,8].map(s => (
                      <option key={s} value={s.toString()}>SEM {s}</option>
                  ))}
              </select>

              <select 
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest dark:text-gray-200 outline-none"
              >
                  <option value="all">Select Course</option>
                  {courses.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
              </select>

              <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">● Registry Sync Active</span>
              </div>
          </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden min-h-[400px]">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                      <tr>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 w-12">#</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Operational Unit</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Course Management</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Core Weight</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Personnel</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Protocol</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                      {loading ? (
                          <tr>
                              <td colSpan="6" className="py-20 text-center">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Syncing Matrix...</p>
                              </td>
                          </tr>
                      ) : paginatedCourses.length > 0 ? paginatedCourses.map((course, idx) => (
                          <tr key={course._id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-5 text-[10px] font-bold text-gray-400 tabular-nums">{(currentPage-1)*itemsPerPage + idx + 1}</td>
                              <td className="px-6 py-5">
                                  <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 bg-gray-100 dark:bg-gray-900 rounded flex items-center justify-center font-black text-[10px] dark:text-white">
                                          {course.code.slice(0, 2)}
                                      </div>
                                      <div>
                                          <p className="font-bold text-xs dark:text-white uppercase leading-tight">{course.name}</p>
                                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{course.code}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-5">
                                  <p className="text-[10px] font-bold dark:text-gray-300 uppercase tracking-widest">{course.department?.code || 'GLB'}</p>
                                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest italic">SEM {course.semester}</p>
                              </td>
                              <td className="px-6 py-5">
                                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 rounded text-[9px] font-bold uppercase tracking-widest">
                                      {course.credits} Credits
                                  </span>
                              </td>
                              <td className="px-6 py-5">
                                  <button 
                                      onClick={() => setViewingStaffFor(course)}
                                      className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:underline"
                                  >
                                      [{course.facultyAssigned?.length || 0}] STAFF
                                  </button>
                              </td>
                              <td className="px-6 py-5 text-right">
                                  <div className="flex justify-end gap-2">
                                      <button 
                                          onClick={() => handleOpenModal(course)}
                                          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                      >
                                          <Edit2 size={14} />
                                      </button>
                                      <button 
                                          onClick={() => handleDelete(course._id)}
                                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                      >
                                          <Trash2 size={14} />
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      )) : (
                          <tr>
                              <td colSpan="6" className="py-20 text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                                  No records found in current sector.
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Block {currentPage} / {totalPages}
                  </p>
                  <div className="flex gap-2">
                      <button 
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => prev - 1)}
                          className="px-3 py-1 text-[10px] font-bold uppercase dark:text-white disabled:opacity-30 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                          Prev
                      </button>
                      <button 
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          className="px-3 py-1 text-[10px] font-bold uppercase dark:text-white disabled:opacity-30 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                          Next
                      </button>
                  </div>
              </div>
          )}
      </div>

      {/* Course Editor Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold dark:text-white uppercase tracking-tight">
                {editingCourse ? 'Edit Parameters' : 'Build Module'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-4">
                <input 
                  required 
                  placeholder="Designation Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-xs font-bold dark:text-white outline-none focus:border-indigo-500"
                />
                <input 
                  required 
                  placeholder="Hash Code (BT-101)"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-xs font-bold dark:text-white outline-none focus:border-indigo-500"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-[10px] font-bold uppercase dark:text-white outline-none"
                  >
                    <option value="" disabled>Select Sector</option>
                    {departments.map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                  <select 
                    required
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: parseInt(e.target.value)})}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-[10px] font-bold uppercase dark:text-white outline-none"
                  >
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>SEM {s}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-indigo-500 uppercase">Personnel Selection</p>
                <div className="max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 space-y-1">
                   {teachers.map(t => (
                     <button 
                        key={t._id} 
                        type="button"
                        onClick={() => {
                          const newList = formData.facultyAssigned.includes(t._id)
                            ? formData.facultyAssigned.filter(id => id !== t._id)
                            : [...formData.facultyAssigned, t._id];
                          setFormData({...formData, facultyAssigned: newList});
                        }}
                        className={`w-full text-left p-2 rounded text-[10px] font-bold uppercase tracking-widest ${formData.facultyAssigned.includes(t._id) ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'}`}
                     >
                       {formData.facultyAssigned.includes(t._id) ? '● ' : '○ '}{t.name}
                     </button>
                   ))}
                </div>
              </div>

              <textarea 
                rows="3"
                placeholder="Synopsis"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-xs font-bold dark:text-white outline-none focus:border-indigo-500"
              />

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-lg text-[10px] font-bold uppercase"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] px-6 py-3 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-indigo-700"
                >
                  {editingCourse ? 'Confirm Changes' : 'Execute Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Staff Roster Modal */}
      {viewingStaffFor && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
           <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold dark:text-white uppercase tracking-widest">Personnel Node</h3>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase">{viewingStaffFor.name}</p>
                </div>
                <button onClick={() => setViewingStaffFor(null)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-3 max-h-60 overflow-y-auto">
                  {viewingStaffFor.facultyAssigned?.map((staff, i) => (
                      <div key={i} className="flex flex-col p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-bold dark:text-white uppercase">{staff.name}</p>
                          <p className="text-[9px] font-bold text-gray-500 uppercase">{staff.email}</p>
                      </div>
                  ))}
                  {(!viewingStaffFor.facultyAssigned || viewingStaffFor.facultyAssigned.length === 0) && (
                      <p className="text-center py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Empty Roster</p>
                  )}
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
                  <button onClick={() => setViewingStaffFor(null)} className="w-full py-3 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-indigo-700">Dismiss</button>
              </div>
           </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminCourseManagement;
