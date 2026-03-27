import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../../features/auth/authSlice';
import {
  Building2, ArrowRight, Sparkles, GraduationCap,
  Cpu, Code, FlaskConical, Atom, Globe, Lightbulb
} from 'lucide-react';
import axios from 'axios';

const DepartmentSelection = () => {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState(null);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/departments');
        setDepartments(res.data);
      } catch (err) {
        console.error('Failed to fetch departments', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDepts();
  }, []);

  const handleSelect = async (dept) => {
    try {
      setSelectedDept(dept);
      
      // 1. Update in Backend
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      const res = await axios.put('http://localhost:5001/api/auth/profile', {
        department: dept.code
      }, config);

      if (res.data) {
        // 2. Update in Redux and localStorage
        dispatch(updateProfile(res.data));
        
        // Use a slight delay to ensure Redux state is updated before navigating
        // and notify other components
        localStorage.setItem('selectedDepartment', JSON.stringify(dept));
        window.dispatchEvent(new CustomEvent('smartlms:department_selected', { detail: dept }));

        // 3. Navigate to appropriate entry page
        navigate('/courses');
      }
    } catch (err) {
      console.error('Failed to sync department selection', err);
      // Fallback: at least store locally
      localStorage.setItem('selectedDepartment', JSON.stringify(dept));
      navigate('/courses');
    }
  };

  const getDeptIcon = (code) => {
    const c = code.toUpperCase();
    if (c === 'CSE') return Code;
    if (c === 'ECE') return Cpu;
    if (c === 'ME') return Lightbulb;
    if (c === 'CE') return Building2;
    if (c === 'EE') return Sparkles;
    return GraduationCap;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#030712] flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-500/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] animate-pulse" />
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-bold text-[10px] uppercase tracking-widest mb-6 border border-primary-100 dark:border-primary-800/30 shadow-sm"
          >
            <Sparkles size={12} className="text-amber-500" />
            <span>Welcome, {user.name}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6"
          >
            Select Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">
              Department Matrix
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 dark:text-gray-400 font-medium text-sm max-w-2xl mx-auto"
          >
            To personalize your academic experience and curriculum access, please select your primary department of study.
          </motion.p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept, i) => {
              const Icon = getDeptIcon(dept.code);
              return (
                <motion.button
                  key={dept._id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(dept)}
                  className="group relative bg-white dark:bg-gray-900/50 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-xl hover:shadow-2xl hover:border-primary-500/30 transition-all text-left overflow-hidden"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300`}>
                    <Icon size={28} />
                  </div>

                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-3 group-hover:text-primary-600 transition-colors">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">
                    CODE: {dept.code}
                  </p>

                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-black text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                    Enter Domain <ArrowRight size={14} />
                  </div>

                  {/* Decorative corner element */}
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Icon size={100} />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentSelection;
