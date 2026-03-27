import { useState, useEffect } from 'react';
import { Building, Phone, Mail, Users, Edit, Trash2, Plus, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Departments = () => {
  const { user } = useSelector(state => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/departments');
        setDepartments(res.data);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const filtered = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white capitalize tracking-tight flex items-center gap-3">
              <Building size={32} className="text-primary-500" /> College Departments
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Manage and explore all academic divisions.</p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <input 
               type="text" 
               placeholder="Search departments..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full md:w-64 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500" 
            />
            {user?.role === 'admin' && (
              <button className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all shrink-0">
                <Plus size={20} /> Add Dept
              </button>
            )}
          </div>
        </div>

        {/* Department Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={48} className="text-primary-500 animate-spin" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading academic divisions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 glass rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <Building size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No departments found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(dept => (
              <Link to={`/department/${dept.code}`} key={dept._id} className="block group">
                <div className="h-full glass rounded-3xl p-6 border border-gray-100 dark:border-gray-800 group-hover:-translate-y-1 group-hover:shadow-xl transition-all duration-300 flex flex-col">
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-4 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-2xl">
                      <span className="text-xl font-black">{dept.code}</span>
                    </div>
                    {user?.role === 'admin' && (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" onClick={(e) => { e.preventDefault(); /* edit logic */ }}><Edit size={16} /></button>
                        <button className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" onClick={(e) => { e.preventDefault(); /* delete logic */ }}><Trash2 size={16} /></button>
                      </div>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-primary-600 transition-colors">{dept.name}</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                    <Users size={16} /> HOD: <span className="text-gray-900 dark:text-gray-300">{dept.hod?.name || 'Assigned Soon'}</span>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><Calendar size={16}/> Established</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{dept.establishedYear || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><Users size={16}/> Faculty Size</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{dept.facultyList?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><Mail size={16}/> Contact</span>
                      <span className="font-semibold text-primary-600 dark:text-primary-400 truncate max-w-[120px]">{dept.contactDetails?.email || 'N/A'}</span>
                    </div>
                    <div className="pt-2">
                        <div className="flex flex-wrap gap-2">
                          {(dept.programs || []).slice(0, 3).map(prog => (
                            <span key={prog.name} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-full">
                              {prog.level}
                            </span>
                          ))}
                        </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-800/50 flex items-center justify-between text-primary-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                    View Department Details
                    <ArrowRight size={14} />
                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
           <div className="text-center py-20 text-gray-500 dark:text-gray-400 flex flex-col items-center">
             <Building size={48} className="mb-4 opacity-20" />
             <p className="text-xl font-bold">No departments found mapping to that query.</p>
           </div>
        )}

      </div>
    </div>
  );
};
export default Departments;
