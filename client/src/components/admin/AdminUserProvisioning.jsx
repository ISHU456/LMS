import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Search, UserPlus, Filter, Edit, Trash2, 
    MoreVertical, Shield, Mail, Building 
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
    const [selectedDept, setSelectedDept] = useState(() => localStorage.getItem('provision_dept') || 'CSE');
    const [selectedSem, setSelectedSem] = useState(() => localStorage.getItem('provision_sem') || '1');

    useEffect(() => {
        localStorage.setItem('provision_role', role);
        localStorage.setItem('provision_dept', selectedDept);
        localStorage.setItem('provision_sem', selectedSem);
        fetchUsers();
    }, [role, selectedDept, selectedSem]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/admin/users?role=${role}&dept=${selectedDept}&semester=${selectedSem}`, {
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
            await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setUsers(users.filter(u => u._id !== userId));
        } catch (err) {
            alert('Failed to delete user. Please try again.');
        }
    };

    const handleRoleUpdate = async (userId, newRole) => {
        try {
            await axios.put(`http://localhost:5000/api/admin/users/${userId}/role`, { role: newRole }, {
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
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-gray-900 p-8 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="space-y-4 w-full md:w-auto">
                    <div className="flex gap-2">
                        {['teacher', 'student', 'hod', 'admin'].map(r => (
                            <button key={r} onClick={() => setRole(r)}
                                className={`px-5 py-2.5 rounded-[15px] text-[10px] font-black uppercase tracking-widest border transition-all ${role === r ? 'bg-red-600 text-white border-transparent shadow-lg' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700 hover:border-red-300'}`}>
                                {r}s
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2 flex items-center gap-1">
                            <Building size={12}/> Sector
                        </span>
                        {['CSE', 'ECE', 'ME', 'CE', 'IT', 'EE'].map(dept => (
                             <button key={dept} onClick={() => setSelectedDept(dept)}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${selectedDept === dept ? 'bg-orange-600 text-white shadow-md' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-orange-600'}`}>
                                {dept}
                             </button>
                        ))}
                    </div>

                    {(role === 'student' || role === 'all') && (
                        <div className="flex flex-wrap gap-2 items-center">
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2 flex items-center gap-1">
                                <Filter size={12}/> Semester
                            </span>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                 <button key={sem} onClick={() => setSelectedSem(sem)}
                                    className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all flex items-center justify-center ${selectedSem === sem ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-blue-600'}`}>
                                    {sem}
                                 </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-gray-50 dark:bg-gray-800 border-none rounded-[24px] text-xs font-bold focus:ring-2 focus:ring-red-500 transition shadow-inner" />
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
                                                    {u.role === 'student' && u.rollNumber && <span className="ml-2 text-[10px] text-red-500 font-black">#{u.rollNumber}</span>}
                                                    {(u.role === 'teacher' || u.role === 'hod') && u.employeeId && <span className="ml-2 text-[10px] text-blue-500 font-black">[{u.employeeId}]</span>}
                                                </p>
                                                <p className="text-[10px] font-bold text-gray-500 tracking-widest lowercase">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 uppercase font-black text-[10px] text-gray-500 tracking-widest italic">{u.department || 'GLOBAL'}</td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${u.isActive !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                            {u.isActive !== false ? 'ACTIVE' : 'LOCKED'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {u.role === 'teacher' && (
                                                <button onClick={() => handleRoleUpdate(u._id, 'hod')} className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all">PROMOTE TO HOD</button>
                                            )}
                                            {u.role === 'hod' && (
                                                <button onClick={() => handleRoleUpdate(u._id, 'teacher')} className="px-3 py-2 bg-gray-50 dark:bg-gray-900/20 text-gray-600 border border-gray-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">DEMOTE TO FACULTY</button>
                                            )}
                                            {u.role === 'admin' && u._id !== user._id && (
                                                <>
                                                    <button onClick={() => handleRoleUpdate(u._id, 'teacher')} className="px-3 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 border border-orange-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-100 transition-all">DEMOTE TO TEACHER</button>
                                                    <button onClick={() => handleRoleUpdate(u._id, 'student')} className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all">DEMOTE TO STUDENT</button>
                                                </>
                                            )}
                                            <button onClick={() => {
                                                if (u.role === 'teacher' || u.role === 'hod' || (u.role === 'admin' && u._id !== user._id)) {
                                                    // Allow editing teachers even if they are currently admins (they likely have employee info)
                                                    setSelectedTeacherId(u._id);
                                                }
                                                else if (u.role === 'student') setSelectedStudentId(u._id);
                                            }} className="p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-xl hover:bg-white hover:text-red-600 hover:shadow-lg transition-all border border-transparent hover:border-red-100"><Edit size={16}/></button>
                                            <button onClick={() => handleDelete(u._id)} className="p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-xl hover:bg-red-600 hover:text-white hover:shadow-lg transition-all border border-transparent"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="p-20 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 italic">No identity records found in this sector.</td></tr>
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
                        fetchUsers(); // Refresh list to show new department
                    }} 
                />
            )}

            {selectedStudentId && (
                <AdminStudentProfileModal 
                    studentId={selectedStudentId} 
                    user={user} 
                    onClose={() => {
                        setSelectedStudentId(null);
                        fetchUsers(); // Refresh list to show new enrollment
                    }} 
                />
            )}
        </div>
    );
};

export default AdminUserManagement;
