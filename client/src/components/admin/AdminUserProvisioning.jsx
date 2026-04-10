import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Search, UserPlus, Filter, Edit, Trash2, 
    MoreVertical, Shield, Mail, Building, Target 
} from 'lucide-react';
import AdminTeacherProfileModal from './AdminTeacherProfileModal';
import AdminStudentProfileModal from './AdminStudentProfileModal';

const AdminUserManagement = ({ user }) => {
    const [users, setUsers] = useState([]);
    const [role, setRole] = useState(() => localStorage.getItem('provision_role') || 'teacher');
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState(null);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    
    // Filters
    const [selectedDept, setSelectedDept] = useState(() => localStorage.getItem('provision_dept') || 'all');
    const [selectedSem, setSelectedSem] = useState(() => localStorage.getItem('provision_sem') || 'all');
    const [selectedSec, setSelectedSec] = useState(() => localStorage.getItem('provision_sec') || 'all');
    const [activeStatus, setActiveStatus] = useState('all'); // all, true, false

    useEffect(() => {
        localStorage.setItem('provision_role', role);
        localStorage.setItem('provision_dept', selectedDept);
        localStorage.setItem('provision_sem', selectedSem);
        localStorage.setItem('provision_sec', selectedSec);
        fetchUsers();
    }, [role, selectedDept, selectedSem, selectedSec, activeStatus]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`http://localhost:5001/api/admin/users?role=${role}&dept=${selectedDept}&semester=${selectedSem}&section=${selectedSec}&isActive=${activeStatus}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
        try {
            await axios.delete(`http://localhost:5001/api/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setUsers(users.filter(u => u._id !== userId));
        } catch (err) {
            alert('Failed to delete user. Please try again.');
        }
    };

    const handleRoleUpdate = async (userId, newRole) => {
        try {
            await axios.put(`http://localhost:5001/api/admin/users/${userId}/role`, { role: newRole }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchUsers();
        } catch (err) {
            alert('Protocol error in role reassignment.');
        }
    };

    const filteredUsers = users
        .filter(u => 
            u.name.toLowerCase().includes(search.toLowerCase()) || 
            u.email.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 p-6 lg:p-8 rounded-[2.5rem] lg:rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div className="space-y-4 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
                            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 sm:pb-0 w-full sm:w-auto">
                                {['all', 'teacher', 'student', 'hod', 'admin'].map(r => (
                                    <button key={r} onClick={() => setRole(r)}
                                        className={`shrink-0 px-5 lg:px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${role === r ? 'bg-red-600 text-white border-transparent shadow-lg shadow-red-600/20' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700 hover:border-red-300'}`}>
                                        {r === 'all' ? 'All Roles' : `${r}s`}
                                    </button>
                                ))}
                            </div>
                            <div className="hidden sm:block h-6 w-[1px] bg-gray-200 dark:bg-gray-800/60 mx-1" />
                            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 sm:pb-0 w-full sm:w-auto">
                                {[
                                    { val: 'all', label: 'All Status' },
                                    { val: 'true', label: 'Active' },
                                    { val: 'false', label: 'Pending' }
                                ].map(s => (
                                    <button key={s.val} onClick={() => {
                                        setActiveStatus(s.val);
                                        if (s.val === 'false') {
                                            setRole('all');
                                            setSelectedDept('all');
                                            setSelectedSem('all');
                                            setSelectedSec('all');
                                        }
                                    }}
                                        className={`shrink-0 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeStatus === s.val ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="relative group w-full xl:w-96">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={16} />
                        <input type="text" placeholder="QUERY IDENTITY NAME OR EMAIL..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-red-500/20 transition-all shadow-inner outline-none dark:text-white" />
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-50 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-3">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                            <Building size={12}/> Academic Sector
                        </span>
                        <div className="flex flex-wrap gap-2">
                             {['all', 'CSE', 'ECE', 'ME', 'CE', 'IT', 'AI'].map(dept => (
                                  <button key={dept} onClick={() => setSelectedDept(dept)}
                                     className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${selectedDept === dept ? 'bg-orange-600 text-white shadow-md' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-orange-600'}`}>
                                     {dept}
                                  </button>
                             ))}
                        </div>
                    </div>

                    {(role === 'student' || role === 'all') && (
                        <>
                        <div className="space-y-3">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                                <Filter size={12}/> Semester Cycle
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {['all', 1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                    <button key={sem} onClick={() => setSelectedSem(sem)}
                                        className={`w-8 h-8 rounded-lg text-[9px] font-black transition-all flex items-center justify-center uppercase ${selectedSem == sem ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-blue-600'}`}>
                                        {sem}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                                <Target size={12}/> Target Section
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {['all', 'A', 'B'].map(sec => (
                                    <button key={sec} onClick={() => setSelectedSec(sec)}
                                        className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all flex items-center justify-center uppercase ${selectedSec === sec ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-emerald-600'}`}>
                                        {sec}
                                    </button>
                                ))}
                            </div>
                        </div>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Identity Name</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Department</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Commands</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {isLoading ? (
                                [1,2,3].map(i => <tr key={i}><td colSpan="4" className="p-8 animate-pulse bg-gray-50/50 dark:bg-gray-800/20"/></tr>)
                            ) : filteredUsers.length > 0 ? filteredUsers.map(u => (
                                <tr key={u._id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all duration-300">
                                    <td className="px-8 py-5 cursor-pointer" 
                                        onClick={() => {
                                            if (u.role === 'teacher') setSelectedTeacherId(u._id);
                                            else if (u.role === 'student') setSelectedStudentId(u._id);
                                        }}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center font-black text-gray-400 border border-gray-100 dark:border-gray-800 shadow-sm group-hover:scale-105 transition-transform uppercase">
                                                {u.profilePic ? <img src={u.profilePic} className="w-full h-full object-cover rounded-2xl" /> : u.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                                    {u.name} 
                                                    {u.role === 'student' && u.rollNumber && <span className="ml-2 text-[10px] text-red-500 font-black">#{u.rollNumber} {u.section ? `(SEC ${u.section})` : ''}</span>}
                                                    {(u.role === 'teacher' || u.role === 'hod') && u.employeeId && <span className="ml-2 text-[10px] text-blue-500 font-black">[{u.employeeId}]</span>}
                                                </p>
                                                <p className="text-[10px] font-bold text-gray-500 tracking-widest lowercase">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 uppercase font-black text-[10px] text-gray-500 tracking-widest italic">{u.department || 'GLOBAL'}</td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                                            u.isActive === false 
                                            ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' 
                                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        }`}>
                                            {u.isActive === false ? 'PENDING' : 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 group-hover:bg-white dark:group-hover:bg-gray-800/50 p-1 lg:p-2 rounded-2xl transition-all">
                                            {u.role === 'teacher' && (
                                                <button onClick={() => handleRoleUpdate(u._id, 'hod')} className="hidden sm:block px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all">PROMOTE</button>
                                            )}
                                            {u.role === 'hod' && (
                                                <button onClick={() => handleRoleUpdate(u._id, 'teacher')} className="hidden sm:block px-3 py-2 bg-gray-50 dark:bg-gray-900/20 text-gray-600 border border-gray-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">DEMOTE</button>
                                            )}
                                            {u.role === 'admin' && u._id !== user._id && (
                                                <div className="hidden sm:flex gap-1.5">
                                                    <button onClick={() => handleRoleUpdate(u._id, 'teacher')} className="px-3 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 border border-orange-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-100 transition-all">TCHR</button>
                                                    <button onClick={() => handleRoleUpdate(u._id, 'student')} className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all">STD</button>
                                                </div>
                                            )}
                                            <button onClick={() => {
                                                if (u.role === 'teacher' || u.role === 'hod' || (u.role === 'admin' && u._id !== user._id)) {
                                                    setSelectedTeacherId(u._id);
                                                }
                                                else if (u.role === 'student') setSelectedStudentId(u._id);
                                            }} className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white hover:shadow-lg transition-all border border-indigo-100 dark:border-indigo-800"><Edit size={14}/></button>
                                            <button onClick={() => handleDelete(u._id)} className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white hover:shadow-lg transition-all border border-rose-100 dark:border-rose-800"><Trash2 size={14}/></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="p-20 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 italic">No identity records found for this sector selection.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedTeacherId && (
                <AdminTeacherProfileModal 
                    teacherId={selectedTeacherId} 
                    user={user} 
                    onClose={() => {
                        setSelectedTeacherId(null);
                        fetchUsers();
                    }} 
                />
            )}

            {selectedStudentId && (
                <AdminStudentProfileModal 
                    studentId={selectedStudentId} 
                    user={user} 
                    onClose={() => {
                        setSelectedStudentId(null);
                        fetchUsers();
                    }} 
                />
            )}
        </div>
    );
};

export default AdminUserManagement;
