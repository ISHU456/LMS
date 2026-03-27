import { motion } from 'framer-motion';
import { Shield, BookOpen, GraduationCap, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const LoginPortal = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
        if (user.role === 'admin') navigate('/admin-dashboard');
        else if (user.role === 'student') navigate('/dashboard');
        else if (user.role === 'librarian') navigate('/librarian-dashboard');
        else if (user.role === 'hod') navigate('/hod-dashboard');
        else if (user.role === 'parent') navigate('/parent-dashboard');
        else if (user.role === 'teacher') navigate('/faculty-dashboard');
    }
  }, [user, navigate]);

  const portals = [
    { id: 'student', title: 'Student Portal', icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'hover:border-blue-500/50 hover:shadow-blue-500/20' },
    { id: 'faculty', title: 'Faculty Portal', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30', border: 'hover:border-indigo-500/50 hover:shadow-indigo-500/20' },
    { id: 'admin', title: 'Admin Portal', icon: Shield, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/30', border: 'hover:border-rose-500/50 hover:shadow-rose-500/20' },
    { id: 'librarian', title: 'Library Portal', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'hover:border-amber-500/50 hover:shadow-amber-500/20' },
    { id: 'parent', title: 'Parent Portal', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'hover:border-emerald-500/50 hover:shadow-emerald-500/20' },
  ];

  return (
    <div className="min-h-[calc(100vh-73px)] w-full flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-200 dark:from-dark-bg dark:to-[#0f172a]">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
           <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">Select Identity Protocol</h1>
           <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">Please select your official college access portal. Unauthorized access attempts are monitored and logged.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {portals.map((portal, index) => (
             <Link to={`/login/${portal.id}`} key={portal.id}>
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: index * 0.1 }}
                 className={`group flex items-center p-8 glass rounded-3xl border-2 border-transparent transition-all duration-300 hover:-translate-y-2 cursor-pointer shadow-xl ${portal.border}`}
               >
                 <div className={`p-5 rounded-2xl ${portal.bg} ${portal.color} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                    <portal.icon size={48} />
                 </div>
                 <div className="ml-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{portal.title}</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Access your secure {portal.id} dashboard.</p>
                 </div>
               </motion.div>
             </Link>
           ))}
        </div>
      </div>
    </div>
  );
};

export default LoginPortal;
