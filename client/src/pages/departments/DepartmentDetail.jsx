import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, BookOpen, Building2, Trophy, Megaphone, 
  Layers, MapPin, Mail, Phone, ExternalLink, 
  ChevronRight, Award, Lightbulb, Microscope, 
  Rocket, Quote, ArrowRight, Play, Star,
  CheckCircle2, Target, Calendar, Download,
  GraduationCap, Briefcase, Activity
} from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const DepartmentDetail = () => {
  const { code } = useParams();
  const { user } = useSelector(state => state.auth);
  const [dept, setDept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchDept = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/departments/code/${code}`);
        setDept(res.data);
      } catch (err) {
        console.error("Failed to fetch department details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDept();
  }, [code]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafbfc] dark:bg-[#0b0f19]">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full"
      />
    </div>
  );

  if (!dept) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafbfc] dark:bg-[#0b0f19] p-6 text-center">
      <Building2 size={64} className="text-gray-300 mb-6" />
      <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Department Not Found</h1>
      <p className="text-gray-500 mt-2 mb-8 max-w-md">The department code you requested doesn't exist in our records.</p>
      <Link to="/departments" className="px-8 py-3 bg-primary-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary-500/20">
        Back to Departments
      </Link>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex-1 bg-[#fafbfc] dark:bg-[#0b0f19] smooth-scroll">
      
      {/* --- HERO SECTION --- */}
      <section className="relative h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={dept.heroImage || "https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"} 
            className="w-full h-full object-cover opacity-40 dark:opacity-20"
            alt={dept.name}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#fafbfc]/50 to-[#fafbfc] dark:via-[#0b0f19]/50 dark:to-[#0b0f19]" />
        </div>

        <div className="container mx-auto px-6 md:px-12 lg:px-24 relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-black text-[9px] uppercase tracking-[0.3em] mb-6 border border-primary-200 dark:border-primary-800">
              <Star size={10} className="fill-current" />
              <span>Center of Excellence</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-[0.95] mb-6">
              {dept.name}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 font-medium max-w-2xl mb-10 leading-relaxed italic">
              "{dept.tagline || "Innovating the future, educating the leaders of tomorrow."}"
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-primary-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-2xl shadow-primary-500/30 hover:bg-primary-700 transition-all flex items-center gap-2">
                Explore Courses <ChevronRight size={14} />
              </button>
              <button className="px-6 py-3 glass dark:bg-gray-800/50 text-gray-900 dark:text-white font-black text-[10px] uppercase tracking-widest rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-all">
                Contact Department
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- QUICK STATS / HIGHLIGHTS --- */}
      <section className="relative z-20 -mt-20 px-6 md:px-12 lg:px-24 mb-24">
        <div className="container mx-auto">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {(dept.highlights?.length > 0 ? dept.highlights : [
              { title: "Placements", value: "95%", icon: "Briefcase" },
              { title: "Research Papers", value: "500+", icon: "Microscope" },
              { title: "Avg Package", value: "12 LPA", icon: "Trophy" },
              { title: "Years of Legacy", value: "25+", icon: "Award" }
            ]).map((stat, i) => (
              <motion.div 
                key={i}
                variants={itemVariants}
                className="glass p-6 rounded-[2rem] border border-white dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 shadow-2xl text-center group hover:border-primary-500/30 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-3 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                  <Activity size={20} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{stat.value}</h3>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.title}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- MAIN CONTENT TABS --- */}
      <section className="px-6 md:px-12 lg:px-24 mb-32">
        <div className="container mx-auto">
          {/* Tab Navigation */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 mb-12 p-1.5 bg-gray-100 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800 w-fit mx-auto">
            {['overview', 'programs', 'faculty', 'infrastructure', 'achievements'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="min-h-[400px]"
            >
              {/* --- OVERVIEW TAB --- */}
              {activeTab === 'overview' && (
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6">About the <span className="text-primary-600">Department</span></h2>
                    <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-8">
                      {dept.overview || dept.description || "Leading the way in academic excellence and professional growth."}
                    </p>
                    <div className="space-y-6">
                      <div className="flex gap-6">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                          <Target size={20} />
                        </div>
                        <div>
                          <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-900 dark:text-white mb-1.5">Our Vision</h4>
                          <p className="text-xs text-gray-500 leading-relaxed">{dept.vision || "To be a global leader in education and research."}</p>
                        </div>
                      </div>
                      <div className="flex gap-6">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                          <Rocket size={20} />
                        </div>
                        <div>
                          <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-900 dark:text-white mb-1.5">Our Mission</h4>
                          <p className="text-xs text-gray-500 leading-relaxed">{dept.mission || "To empower students with knowledge and values for a better world."}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800 rotate-3 group hover:rotate-0 transition-transform duration-500">
                      <img 
                        src={dept.gallery?.[0]?.url || "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} 
                        className="w-full h-full object-cover"
                        alt="Campus"
                      />
                    </div>
                    <div className="absolute -bottom-6 -left-6 glass p-6 rounded-2xl border border-white dark:border-gray-800 shadow-2xl max-w-[160px] -rotate-6 group-hover:rotate-0 transition-transform duration-500">
                      <p className="text-2xl font-black text-primary-600">#1</p>
                      <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Ranked in the Region</p>
                    </div>
                  </div>
                </div>
              )}

              {/* --- ACADEMIC ROADMAP (SYLLABUS) TAB --- */}
              {activeTab === 'programs' && (
                <div className="space-y-16">
                  {/* Strategic Overview Header */}
                  <div className="flex flex-col md:flex-row gap-8 items-start justify-between bg-primary-50/50 dark:bg-primary-950/20 p-8 rounded-[2.5rem] border border-primary-100 dark:border-primary-900/30">
                     <div className="max-w-xl">
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-3">Academic <span className="text-primary-600">Roadmap</span>: B.Tech CSE</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">A detailed 4-year trajectory through 8 semesters designed to transform foundation basics into elite industrial mastery.</p>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        <span className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-primary-600 shadow-sm ring-1 ring-primary-500/10">8 SEMESTERS</span>
                        <span className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-emerald-600 shadow-sm ring-1 ring-emerald-500/10">INDUSTRY READY</span>
                     </div>
                  </div>

                  {/* 8 Semester Matrix */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[
                      { 
                        sem: 1, tag: "FOUNDATION", color: "blue",
                        subjects: ["Engineering Mathematics I", "Engineering Physics", "Basic Electrical Engineering", "Programming in C", "Engineering Graphics", "Communication Skills"],
                        labs: ["C Programming Lab", "Physics Lab", "Electrical Lab"],
                        focus: "Logic building • Basic coding • Engineering fundamentals"
                      },
                      { 
                        sem: 2, tag: "CORE BUILDING", color: "indigo",
                        subjects: ["Engineering Mathematics II", "Data Structures (C/C++)", "Digital Logic Design", "Environmental Studies", "Object-Oriented Programming (C++/Java)"],
                        labs: ["Data Structures Lab", "OOP Lab", "Digital Logic Lab"],
                        focus: "Problem-solving • Memory & logic understanding • OOP fundamentals"
                      },
                      { 
                        sem: 3, tag: "CORE CS", color: "violet",
                        subjects: ["Discrete Mathematics", "Comp Organization & Architecture", "Database Management Systems", "Operating Systems (Basics)", "Java / Python"],
                        labs: ["DBMS Lab (SQL, MongoDB)", "OS Lab (Linux basics)", "Java/Python Lab"],
                        focus: "Core CS subjects start • System-level understanding"
                      },
                      { 
                        sem: 4, tag: "SYSTEMS + DEV", color: "purple",
                        subjects: ["Design & Analysis of Algorithms", "Operating Systems (Advanced)", "Software Engineering", "Computer Networks", "Web Development (HTML/CSS/JS)"],
                        labs: ["DAA Lab", "Web Dev Lab", "OS Simulation Lab"],
                        focus: "Optimization thinking • Real-world software development"
                      },
                      { 
                        sem: 5, tag: "SPECIALIZATION", color: "rose",
                        subjects: ["Theory of Computation", "Artificial Intelligence", "Compiler Design", "Distributed Systems", "Elective I"],
                        labs: ["AI Lab (Python, ML basics)", "Compiler Lab", "Mini Project (Team)"],
                        focus: "Advanced CS concepts • AI introduction"
                      },
                      { 
                        sem: 6, tag: "INDUSTRY SKILLS", color: "orange",
                        subjects: ["Machine Learning", "Cyber Security", "Cloud Computing", "Big Data Analytics", "Elective II"],
                        labs: ["ML Lab (TF/Scikit)", "Cloud Lab (AWS/GCP)", "Security Lab"],
                        focus: "Industry tools • Job-ready skills"
                      },
                      { 
                        sem: 7, tag: "ADVANCED + PROJECT", color: "emerald",
                        subjects: ["Deep Learning / NLP", "DevOps & Deployment", "Blockchain Technology", "Elective III", "Open Elective"],
                        labs: ["DevOps Lab (Docker, CI/CD)", "Major Project Phase 1"],
                        focus: "Specialization • Real-world project building"
                      },
                      { 
                        sem: 8, tag: "RESEARCH", color: "amber",
                        subjects: ["Professional Ethics", "Entrepreneurship", "Elective IV", "Seminar / Research Paper"],
                        labs: ["Major Project Phase 2", "Industrial Training"],
                        focus: "Industry exposure • Product-level project"
                      }
                    ].map((sem, i) => (
                      <motion.div 
                        key={i}
                        variants={itemVariants}
                        className="group relative h-full glass p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 flex flex-col hover:border-primary-500/30 transition-all shadow-xl"
                      >
                        <div className="flex items-center justify-between mb-6">
                           <div className={`w-12 h-12 rounded-2xl bg-${sem.color}-500/10 text-${sem.color}-600 flex items-center justify-center font-black text-lg`}>
                              {sem.sem}
                           </div>
                           <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-${sem.color}-500/10 text-${sem.color}-600 rounded-lg`}>{sem.tag}</span>
                        </div>
                        
                        <div className="space-y-6 flex-1">
                           <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                 <BookOpen size={10} className="text-primary-600" /> Theory CORE
                              </p>
                              <div className="space-y-1.5">
                                 {sem.subjects.map(s => (
                                   <div key={s} className="text-[10px] font-bold text-gray-600 dark:text-gray-400 leading-tight">
                                      • {s}
                                   </div>
                                 ))}
                              </div>
                           </div>
                           
                           <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                 <Microscope size={10} className="text-emerald-600" /> APPLIED Labs
                              </p>
                              <div className="space-y-1.5">
                                 {sem.labs.map(l => (
                                   <div key={l} className="text-[10px] font-bold text-emerald-600/80 dark:text-emerald-400/80 leading-tight">
                                      {l}
                                   </div>
                                 ))}
                              </div>
                           </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-800/50">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Primary Objective</p>
                            <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-relaxed">{sem.focus}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Electives & Specializations */}
                  <div className="grid lg:grid-cols-2 gap-8">
                     <div className="glass p-10 rounded-[3rem] border border-white dark:border-gray-800">
                        <div className="flex items-center gap-4 mb-8">
                           <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center shadow-inner">
                              <Target size={24} />
                           </div>
                           <h4 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Elective <span className="text-orange-600">Inventory</span></h4>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-8">
                           {[
                             { title: "AI & Data", list: ["Natural Language Processing", "Computer Vision", "Reinforcement Learning"], color: "blue" },
                             { title: "Security", list: ["Ethical Hacking", "Cryptography", "Network Security"], color: "rose" },
                             { title: "Cloud & Dev", list: ["Microservices", "Kubernetes", "Serverless Computing"], color: "emerald" },
                             { title: "Emerging", list: ["AR/VR Dev", "Game Dev", "Quantum Computing"], color: "amber" }
                           ].map((group, i) => (
                             <div key={i} className="space-y-4">
                                <h5 className={`text-[10px] font-black uppercase tracking-widest text-${group.color}-600 underline decoration-2 underline-offset-4`}>{group.title}</h5>
                                <div className="space-y-2">
                                   {group.list.map(item => (
                                     <p key={item} className="text-[11px] font-bold text-gray-600 dark:text-gray-400">{item}</p>
                                   ))}
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>

                     <div className="bg-gray-900 dark:bg-[#0d121f] p-10 rounded-[3rem] text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative z-10">
                           <div className="flex items-center gap-4 mb-8">
                              <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg">
                                 <Trophy size={24} />
                              </div>
                              <h4 className="text-2xl font-black uppercase tracking-tighter">Placement <span className="text-primary-400">Strategy</span></h4>
                           </div>
                           
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8 opacity-80">✔ TOPPER’S TIPS FOR INTERVIEWS & CAREER</p>
                           
                           <div className="space-y-8">
                              <div className="flex gap-6">
                                 <div className="w-1 h-12 bg-primary-500 rounded-full mt-1" />
                                 <div>
                                    <h5 className="text-[11px] font-black uppercase tracking-widest mb-1.5">Critical Core Focus</h5>
                                    <p className="text-[10px] font-medium text-gray-400 leading-relaxed">Prioritize DSA (Sem 2-4) and DBMS + OS + Computer Networks for core technical interviews.</p>
                                 </div>
                              </div>
                              <div className="flex gap-6">
                                 <div className="w-1 h-12 bg-emerald-500 rounded-full mt-1" />
                                 <div>
                                    <h5 className="text-[11px] font-black uppercase tracking-widest mb-1.5">Practical Deployment</h5>
                                    <p className="text-[10px] font-medium text-gray-400 leading-relaxed">Build high-impact projects during Sem 5-8: LMS Matrices, AI Chatbots, or Face Recognition Systems.</p>
                                 </div>
                              </div>
                              <div className="flex gap-6">
                                 <div className="w-1 h-12 bg-amber-500 rounded-full mt-1" />
                                 <div>
                                    <h5 className="text-[11px] font-black uppercase tracking-widest mb-1.5">Elite Certifications</h5>
                                    <p className="text-[10px] font-medium text-gray-400 leading-relaxed">Substitute generic syllabus with AWS / Google Cloud certifications and advanced Machine Learning credentials.</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* --- FACULTY & MENTORSHIP TAB --- */}
              {activeTab === 'faculty' && (
                <div className="space-y-24">
                  {/* Strategic Value Section */}
                  <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                       <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-black text-[9px] uppercase tracking-widest mb-6">
                          <CheckCircle2 size={10} />
                          <span>Industry-Aligned Matrix</span>
                       </div>
                       <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6 leading-tight">
                          Curriculum <span className="text-primary-600">Impact</span> & Student ROI
                       </h2>
                       <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed mb-10">
                          Our curriculum is engineered in collaboration with top-tier technology partners to ensure every block of learning translates directly into professional mastery. We move beyond theory to deliver high-impact, deployment-ready expertise.
                       </p>
                       
                       <div className="grid gap-6">
                          {[
                            { title: "Direct Career Acceleration", desc: "Access exclusive placement pipelines with global industry leaders in the {code} sector.", icon: Rocket, color: "bg-orange-500" },
                            { title: "Hands-on R&D Projects", desc: "Work on live research grants and industry-sponsored projects starting from Semester 3.", icon: Microscope, color: "bg-primary-600" },
                            { title: "Global Certifications", desc: "Gain industry-standard certifications (IEEE, ACM, AWS) integrated directly into your coursework.", icon: Award, color: "bg-indigo-600" }
                          ].map((benefit, i) => (
                            <div key={i} className="flex gap-6 group">
                               <div className={`w-12 h-12 shrink-0 rounded-2xl ${benefit.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                  <benefit.icon size={22} />
                               </div>
                               <div>
                                  <h4 className="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 transition-colors">{benefit.title}</h4>
                                  <p className="text-xs text-gray-500 leading-relaxed max-w-sm">{benefit.desc}</p>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                    
                    <div className="relative">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-4 pt-12">
                             <div className="aspect-[4/5] bg-gray-100 dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl hover:-translate-y-2 transition-transform">
                                <img src="https://images.unsplash.com/photo-1573164773974-bc48705009a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover" alt="Lab" />
                             </div>
                             <div className="glass p-6 rounded-3xl border border-white dark:border-gray-800 text-center">
                                <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">45+</p>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Industry Links</p>
                             </div>
                          </div>
                          <div className="space-y-4">
                             <div className="glass p-6 rounded-3xl border border-white dark:border-gray-800 text-center">
                                <p className="text-3xl font-black text-primary-600 mb-1">12M</p>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Research Funding</p>
                             </div>
                             <div className="aspect-[4/5] bg-gray-100 dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl hover:-translate-y-2 transition-transform">
                                <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover" alt="Seminar" />
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Faculty Roster */}
                  <div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                       <div>
                          <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-3">Academic <span className="text-primary-600">Command</span></h3>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Distinguished Faculty & Subject Matter Experts</p>
                       </div>
                       <button className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-600 hover:text-white transition-all">
                          Full Academic Register
                       </button>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {(dept.facultyList?.length > 0 ? dept.facultyList : [
                        { name: 'Dr. Amitabh Sharma', designation: 'HOD / Chief Research Envoy', expertise: 'Quantum Computing • Neural Networks', email: 'sharma.hod@university.edu', color: 'bg-indigo-600' },
                        { name: 'Dr. Priya Venkatesh', designation: 'Professor • Lead Scholar', expertise: 'Cyber Defense • Data Privacy', email: 'p.venkatesh@university.edu', color: 'bg-emerald-600' },
                        { name: 'Dr. Rajiv Malhotra', designation: 'Asst. Professor • Industry Liaison', expertise: 'Cloud-Native Systems • DevOps', email: 'malhotra.r@university.edu', color: 'bg-primary-600' },
                        { name: 'Dr. Ananya Iyer', designation: 'Senior Lecturer • R&D Curator', expertise: 'Blockchain Governance • Web3', email: 'iyer.a@university.edu', color: 'bg-amber-600' }
                      ]).map((fac, i) => (
                        <motion.div 
                          key={i}
                          whileHover={{ y: -10 }}
                          className="group bg-white dark:bg-[#0d121f] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-xl hover:shadow-2xl hover:border-primary-500/30 transition-all flex flex-col"
                        >
                          <div className="mb-8 relative flex justify-center">
                             <div className={`w-32 h-32 rounded-[2rem] ${fac.color || 'bg-primary-600'} flex items-center justify-center text-white text-4xl font-black shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform`}>
                                {fac.profilePic ? (
                                   <img src={fac.profilePic} className="w-full h-full object-cover" alt={fac.name} />
                                ) : (
                                   <span className="relative z-10">{fac.name.split(' ').map(n=>n[0]).join('')}</span>
                                )}
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                             </div>
                             
                             {/* Expert Badge */}
                             <div className="absolute -bottom-2 bg-white dark:bg-gray-800 px-4 py-1.5 rounded-full shadow-lg border border-gray-100 dark:border-gray-700">
                                <p className="text-[8px] font-black text-primary-600 uppercase tracking-widest whitespace-nowrap">Subject Elite</p>
                             </div>
                          </div>

                          <div className="text-center flex-1 flex flex-col">
                            <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-2">{fac.name}</h4>
                            <p className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-6">{fac.designation}</p>
                            
                            <div className="mt-auto pt-6 border-t border-gray-50 dark:border-gray-800 text-center">
                               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">Mastery Sectors</p>
                               <div className="flex flex-wrap justify-center gap-2">
                                  {fac.expertise.split(' • ').map(e => (
                                    <span key={e} className="px-3 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-[8.5px] font-black uppercase tracking-widest">{e}</span>
                                  ))}
                               </div>
                            </div>
                            
                            <div className="mt-6 flex items-center justify-center gap-3">
                               <button className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-primary-600 transition-colors">
                                  <Mail size={16} />
                                </button>
                                <button className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-primary-600 transition-colors">
                                  <Users size={16} />
                                </button>
                                <button className="flex-1 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-[9px] uppercase tracking-widest hover:bg-primary-600 hover:text-white transition-all">
                                   Profile
                                </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- INFRASTRUCTURE TAB --- */}
              {activeTab === 'infrastructure' && (
                <div className="grid md:grid-cols-2 gap-8">
                  {(dept.infrastructure?.length > 0 ? dept.infrastructure : [
                    { name: 'Advanced AI Lab', description: 'Equipped with NVIDIA A100 GPUs for deep learning research.', image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
                    { name: 'Cyber Security Hub', description: 'State-of-the-art facility for ethical hacking and network security.', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
                    { name: 'IoT Innovation Lab', description: 'Prototyping center for smart city and home automation projects.', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
                    { name: 'Dept. Library', description: 'Housing over 5000+ technical journals and digital resources.', image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }
                  ]).map((infra, i) => (
                    <motion.div 
                      key={i}
                      className="glass rounded-[3rem] overflow-hidden border border-white dark:border-gray-800 flex flex-col md:flex-row h-full group"
                    >
                      <div className="w-full md:w-1/2 overflow-hidden">
                        <img src={infra.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={infra.name} />
                      </div>
                      <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                        <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">{infra.name}</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">{infra.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* --- ACHIEVEMENTS TAB --- */}
              {activeTab === 'achievements' && (
                <div className="space-y-8">
                  <div className="p-8 border-l-4 border-primary-600 bg-primary-50/50 dark:bg-primary-950/20 rounded-r-[2.5rem] mb-12">
                     <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">Verified Academic Benchmarks</h3>
                     <p className="text-xs text-gray-500 max-w-2xl uppercase tracking-widest font-black opacity-80">objective markers of our department's curriculum excellence and research maturity.</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    {[
                      { title: 'Research Citation Index', value: '450+', metric: 'Global Publications in Q1 Journals', icon: Microscope },
                      { title: 'Student Innovation Grants', value: '$1.2M', metric: 'Cumulative funding for startup prototypes', icon: Rocket },
                      { title: 'Global Patent Registry', value: '18+', metric: 'Technological patents filed by students & faculty', icon: Award },
                      { title: 'Industry MOU Network', value: '25+', metric: 'Active knowledge-sharing partnerships', icon: Building2 }
                    ].map((ach, i) => (
                      <motion.div 
                        key={i}
                        className="flex gap-6 items-start p-8 glass rounded-[2.5rem] border border-white dark:border-gray-800"
                      >
                        <div className="w-14 h-14 shrink-0 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 shadow-inner">
                          <ach.icon size={28} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">{ach.title}</p>
                          <h4 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-1">{ach.value}</h4>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">{ach.metric}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
      
      {/* --- STRATEGIC DOMAINS & SKILL MAPPING --- */}
      <section className="py-32 bg-white dark:bg-gray-950/50 border-y border-gray-100 dark:border-gray-800 px-6 md:px-12 lg:px-24">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6">Strategic <span className="text-primary-600">Impact</span> Matrix</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Skill mapping and graduation pathways based on our unique curriculum.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <div className="glass p-10 rounded-[3rem] border border-white dark:border-gray-800">
              <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-8 border-b border-gray-100 dark:border-gray-800/50 pb-4">Core Competency Weights</h4>
              <div className="space-y-8">
                {[
                  { domain: 'System Architecture & Design', weight: 92, color: 'bg-indigo-500' },
                  { domain: 'Problem Solving & Logic', weight: 96, color: 'bg-primary-500' },
                  { domain: 'Research & Innovation', weight: 88, color: 'bg-emerald-500' },
                  { domain: 'Industrial Deployment', weight: 90, color: 'bg-amber-500' }
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <span className="font-black text-[9px] uppercase tracking-widest text-gray-900 dark:text-white">{stat.domain}</span>
                      <span className="font-black text-[10px] text-primary-600 tracking-tighter">{stat.weight}% Mastery</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${stat.weight}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className={`h-full ${stat.color} rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
               <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                  <Target size={14} className="text-primary-600" />
                  Primary Graduation Pathways
               </h4>
               <div className="grid gap-4">
                  {[
                    { title: "Enterprise Engineering", icon: Briefcase, desc: "Architecting scalable solutions for global tech ecosystems." },
                    { title: "Advanced Academic Research", icon: Microscope, desc: "Pursuing doctoral excellence in core technology domains." },
                    { title: "Tech Entrepreneurship", icon: Rocket, desc: "Building the next generation of industry-disrupting startups." }
                  ].map((path, i) => (
                    <div key={i} className="p-6 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800/50 hover:border-primary-500/20 transition-all flex gap-5 group">
                       <div className="w-10 h-10 shrink-0 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-primary-600 transition-colors shadow-sm">
                          <path.icon size={20} />
                       </div>
                       <div>
                          <h5 className="font-black text-[11px] uppercase tracking-widest text-gray-900 dark:text-white mb-1">{path.title}</h5>
                          <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest opacity-80">{path.desc}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="py-24 px-6 md:px-12 lg:px-24">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6">Student <span className="text-indigo-600">Voices</span></h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(dept.testimonials?.length > 0 ? dept.testimonials : [
              { name: 'Alex Johnson', role: 'Alumni, 2023', content: 'The faculty support and the advanced labs here changed my career path completely.', avatar: null },
              { name: 'Maria Garcia', role: 'Student, 3rd Year', content: 'Incredible environment for learning AI and machine learning. The peer group is very motivated.', avatar: null },
              { name: 'Kevin Lee', role: 'Alumni, 2022', content: 'I secured a job at Google thanks to the placement cell and the coding culture in the department.', avatar: null }
            ]).map((test, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="glass p-8 rounded-[2.5rem] border border-white dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 relative"
              >
                <Quote className="absolute top-6 right-6 text-primary-600/10" size={40} />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 relative z-10 italic leading-relaxed">"{test.content}"</p>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${test.name}`} alt={test.name} />
                  </div>
                  <div>
                    <p className="font-black text-xs uppercase text-gray-900 dark:text-white tracking-tighter">{test.name}</p>
                    <p className="text-[9px] font-bold text-primary-600 uppercase tracking-widest">{test.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CONTACT SECTION --- */}
      <section className="py-24 bg-primary-600 text-white px-6 md:px-12 lg:px-24 overflow-hidden relative">
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-900/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-8 leading-tight">Get in touch with <br/> our team.</h2>
              <div className="space-y-6 mb-10">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Email Address</p>
                    <p className="text-base font-bold">{dept.contactDetails?.email || `hod.${code.toLowerCase()}@university.edu`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Phone Number</p>
                    <p className="text-base font-bold">{dept.contactDetails?.phone || "+1 (555) 123-4567"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Office Location</p>
                    <p className="text-base font-bold">{dept.contactDetails?.address || "Engineering Block A, Room 204"}</p>
                  </div>
                </div>
              </div>
              <div className="aspect-video w-full rounded-[2rem] overflow-hidden bg-gray-200/20 backdrop-blur-sm border-4 border-white/10 shadow-2xl relative group">
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40 group-hover:opacity-100 transition-opacity">Interactive Map</p>
                </div>
                {/* Real map integration would go here */}
              </div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 md:p-12 shadow-2xl">
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-6">Send a <span className="text-primary-600">Message</span></h3>
              <form className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-4">Full Name</label>
                    <input type="text" className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary-500 transition-all text-gray-900 font-bold text-sm" placeholder="John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-4">Email</label>
                    <input type="email" className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary-500 transition-all text-gray-900 font-bold text-sm" placeholder="john@example.com" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-4">Subject</label>
                  <select className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary-500 transition-all text-gray-900 font-bold text-sm appearance-none">
                    <option>Admissions Inquiry</option>
                    <option>Research Collaboration</option>
                    <option>Resource Access</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-4">Message</label>
                  <textarea rows="3" className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary-500 transition-all text-gray-900 font-bold text-sm" placeholder="How can we help you?"></textarea>
                </div>
                <button className="w-full py-4 bg-primary-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl shadow-primary-500/30 hover:bg-primary-700 transition-all flex items-center justify-center gap-2">
                  Submit Inquiry <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default DepartmentDetail;
