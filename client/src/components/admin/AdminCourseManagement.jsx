import { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Search, Edit2, Trash2, Filter, 
  ChevronRight, Book, Layers, GraduationCap, Building,
  Hash, Clock, CheckCircle2, AlertCircle, X, Save
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
    type: 'theory',
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
        type: 'theory',
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800 flex items-center gap-6">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-600 dark:text-red-400 font-bold">
            <BookOpen size={32} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-black mb-1">Total Subjects</p>
            <h3 className="text-3xl font-black dark:text-white">{courses.length}</h3>
          </div>
        </div>
        
        <div className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800 flex items-center gap-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400 font-bold">
            <Layers size={32} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-black mb-1">Active Sectors</p>
            <h3 className="text-3xl font-black dark:text-white">{departments.length}</h3>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-3 px-8 py-5 bg-red-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-red-500 hover:shadow-[0_20px_40px_-10px_rgba(220,38,38,0.3)] transition-all transform hover:-translate-y-1"
          >
            <Plus size={24} strokeWidth={3} /> Establish Course
          </button>
        </div>
      </div>

      {/* Filters Hub */}
      <div className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by name or code (e.g., CS301)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:border-red-500 outline-none transition-all dark:text-white shadow-inner"
            />
          </div>
          
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-500 shadow-lg shadow-red-500/20 active:scale-95 transition-all"
          >
            <Plus size={20} strokeWidth={3} /> Add Course
          </button>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <Filter size={16} className="text-gray-400" />
              <select 
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="bg-transparent text-sm font-bold dark:text-gray-300 outline-none pr-4"
              >
                <option value="all">All Departments</option>
                {departments.map(d => (
                  <option key={d._id} value={d._id}>{d.code}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <GraduationCap size={16} className="text-gray-400" />
              <select 
                value={filterSem}
                onChange={(e) => setFilterSem(e.target.value)}
                className="bg-transparent text-sm font-bold dark:text-gray-300 outline-none pr-4"
              >
                <option value="all">All Semesters</option>
                {[1,2,3,4,5,6,7,8].map(s => (
                  <option key={s} value={s.toString()}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Course Matrix */}
      <div className="glass rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Academic Unit</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Mapping</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Parameters</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Faculty Sync</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-right">Commands</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                   <td colSpan="5" className="py-20 text-center animate-pulse">
                     <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Decoding Academic Matrix...</p>
                   </td>
                </tr>
              ) : filteredCourses.length > 0 ? filteredCourses.map(course => (
                <tr key={course._id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 font-black text-xs">
                        {course.code.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-red-600 transition-colors uppercase tracking-tight">{course.name}</h4>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-0.5">{course.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building size={12} className="text-gray-400" />
                        <span className="text-xs font-bold dark:text-gray-300">{course.department?.name || 'Unassigned Sector'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap size={12} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sem {course.semester}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {course.credits} Credits
                      </span>
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {course.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                       {course.facultyAssigned?.length > 0 ? (
                         course.facultyAssigned.map((f, i) => (
                           <div key={i} className="flex items-center gap-2.5">
                             <div className="h-7 w-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[9px] font-black uppercase overflow-hidden border border-gray-100 dark:border-gray-700">
                               {f.profilePic ? <img src={f.profilePic} className="w-full h-full object-cover" /> : f.name[0]}
                             </div>
                             <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-tighter">
                               {f.name}
                             </span>
                           </div>
                         ))
                       ) : (
                         <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                           <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Unstaffed</span>
                         </div>
                       )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleOpenModal(course)}
                        className="p-3 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-emerald-600 hover:text-white hover:shadow-lg transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(course._id)}
                        className="p-3 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-rose-600 hover:text-white hover:shadow-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <BookOpen size={64} className="mx-auto text-gray-100 dark:text-gray-800 mb-4" strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">No matching subjects found in the sector repository.</p>
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
                           <option value="theory">Theory Unit</option>
                           <option value="lab">Laboratory Unit</option>
                           <option value="project">Project / Studio Unit</option>
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
