import { motion, AnimatePresence } from 'framer-motion';
import { Shield, BookOpen, GraduationCap, Users, Lock, ChevronRight, Fingerprint, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const LoginPortal = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [hoveredRole, setHoveredRole] = useState(null);

  useEffect(() => {
    if (user) {
        if (user.role === 'admin') navigate('/admin-dashboard');
        else if (user.role === 'student') navigate('/dashboard');
        else if (user.role === 'hod') navigate('/hod-dashboard');
        else if (user.role === 'teacher') navigate('/faculty-dashboard');
    }
  }, [user, navigate]);

  const portals = [
    { 
      id: 'student', 
      title: 'Student Portal', 
      subtitle: 'Knowledge Gateway',
      icon: GraduationCap, 
      color: 'from-blue-500 to-cyan-400',
      shadow: 'shadow-blue-500/20',
      description: 'Access your academic journey, courses, and progress tracking.'
    },
    { 
      id: 'faculty', 
      title: 'Faculty Portal', 
      subtitle: 'Educator Suite',
      icon: Users, 
      color: 'from-indigo-600 to-purple-500',
      shadow: 'shadow-indigo-500/20',
      description: 'Manage curriculum, evaluate students, and coordinate lectures.'
    },
    { 
      id: 'admin', 
      title: 'Admin Portal', 
      subtitle: 'System Control',
      icon: Shield, 
      color: 'from-rose-600 to-orange-500',
      shadow: 'shadow-rose-500/20',
      description: 'Full institutional management and security infrastructure control.'
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full flex items-center justify-center p-4 md:p-12 bg-transparent transition-colors duration-500">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none transform-gpu">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 dark:bg-blue-600/20 blur-[80px] transform-gpu" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 dark:bg-purple-600/20 blur-[80px] transform-gpu" />
        
        {/* Animated grid background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }}>
        </div>
      </div>

      <div className="max-w-6xl w-full relative z-10 py-12">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-500/5 dark:bg-white/5 border border-gray-500/10 dark:border-white/10 text-blue-600 dark:text-blue-400 text-xs font-mono mb-2 uppercase tracking-widest">
            <Lock size={12} className="animate-pulse" />
            Security Protocol Active
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
            Select Identity Protocol
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Please select your official college access portal. 
            <span className="block text-blue-600 dark:text-blue-400 font-mono text-sm mt-2 tracking-wide font-bold">
              UNAUTHORIZED ACCESS ATTEMPTS ARE MONITORED AND LOGGED.
            </span>
          </p>
        </motion.div>

        {/* Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {portals.map((portal, index) => (
            <Link 
              to={`/login/${portal.id}`} 
              key={portal.id}
              onMouseEnter={() => setHoveredRole(portal.id)}
              onMouseLeave={() => setHoveredRole(null)}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="group relative h-full"
              >
                {/* Card Glow Effect */}
                <div className={`absolute -inset-0.5 bg-gradient-to-br ${portal.color} rounded-[2rem] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />
                
                <div className="relative h-full flex flex-col p-8 rounded-[2rem] bg-white border border-gray-100 dark:bg-white/[0.03] dark:border-white/10 backdrop-blur-lg hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all duration-300 hover:border-gray-200 dark:hover:border-white/20 transform-gpu shadow-xl dark:shadow-2xl">
                  <div className="flex items-start justify-between mb-8">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${portal.color} shadow-lg ${portal.shadow} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                       <portal.icon size={32} className="text-white" />
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={`h-1 w-1 rounded-full ${hoveredRole === portal.id ? 'bg-blue-500/40 dark:bg-white/40' : 'bg-gray-200 dark:bg-white/10'}`} />
                      ))}
                    </div>
                  </div>

                  <div className="flex-grow">
                    <p className={`text-xs font-mono mb-1 uppercase tracking-[0.2em] font-bold ${portal.id === 'student' ? 'text-blue-500' : portal.id === 'faculty' ? 'text-indigo-500' : 'text-rose-500'}`}>
                      {portal.subtitle}
                    </p>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 group-hover:translate-x-1 transition-transform">{portal.title}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                      {portal.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm group-hover:gap-3 transition-all uppercase tracking-widest">
                    Initialize Protocol 
                    <ChevronRight size={18} className="text-blue-500 dark:text-blue-400" />
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute bottom-4 right-6 opacity-[0.05] dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
                    <Fingerprint size={80} className="text-slate-900 dark:text-white" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
          
        </div>

        {/* Footer Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-400 dark:text-gray-600 text-xs font-mono tracking-wider uppercase">
            © {new Date().getFullYear()} INSTITUTIONAL RESOURCE PLANNING SYSTEM • VERSION 4.0.2-STABLE
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPortal;

