import {
  ArrowRight, BrainCircuit,
  Trophy, PlayCircle, ShieldCheck,
  Sparkles, MessageSquare, Rocket, Star, Quote,
  Zap, Bot, Target, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Home = () => {
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

  const featureCards = [
    { icon: BrainCircuit, title: "AI Doubt Resolver", desc: "Get instant, 24/7 clarification on complex topics using our advanced fine-tuned learning models.", color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: PlayCircle, title: "Interactive Video Classes", desc: "Join real-time HD sessions with zero-latency WebRTC streams, hand-raising, and live chat.", color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: Trophy, title: "Gamified Assessments", desc: "Test your knowledge with adaptive MCQs and climb the global leaderboards to earn badges.", color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { icon: Target, title: "Analytics Engine", desc: "Track every assignment, quiz score, and hour watched directly from your dynamic dashboard.", color: "text-green-500", bg: "bg-green-500/10" },
    { icon: Users, title: "Discussion Forums", desc: "Ask questions, upvote highly technical answers, and collaborate like an expert community.", color: "text-rose-500", bg: "bg-rose-500/10" },
    { icon: ShieldCheck, title: "Secure & Scalable", desc: "Enterprise-grade JWT encryption with resilient microservice routing guarantees platform safety.", color: "text-teal-500", bg: "bg-teal-500/10" }
  ];

  const testimonials = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      role: "Professor of Computer Science",
      institution: "Stanford University",
      content: "SmartLMS has revolutionized how I teach. The AI doubt resolver alone has increased student engagement by 300%. My students are more confident and perform better on assessments.",
      rating: 5,
      avatar: "SJ",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop"
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Software Engineering Student",
      institution: "MIT",
      content: "The interactive video classes and gamified assessments make learning addictive! I've never been this motivated to study. The analytics dashboard helps me track my progress in real-time.",
      rating: 5,
      avatar: "MC",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop"
    },
    {
      id: 3,
      name: "Dr. Emily Rodriguez",
      role: "Head of Digital Learning",
      institution: "Harvard University",
      content: "We've implemented SmartLMS across 50+ courses, and the results are outstanding. The platform is scalable, secure, and the support team is exceptional. A game-changer for higher education.",
      rating: 5,
      avatar: "ER",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop"
    }
  ];

  return (
    <div className="relative overflow-x-hidden bg-transparent text-app-text transition-colors duration-500">

      {/* --- PREMIUM SUBTLE BACKGROUND --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Modern Mesh Gradient - Static */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.15] dark:opacity-[0.2]">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-primary-400/40 to-indigo-400/40 blur-[120px] transform-gpu will-change-transform" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-rose-400/30 to-purple-400/30 blur-[120px] transform-gpu will-change-transform" />
        </div>

        {/* Optimized Noise Texture */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none mix-blend-overlay transform-gpu will-change-transform"
          style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")` }} />
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-20 px-6 md:px-12 lg:px-24 overflow-hidden">
        <div className="container mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Text Content */}
          <div className="flex flex-col items-start text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold text-xs uppercase tracking-widest mb-8 border border-primary-500/10 shadow-sm">
              <Sparkles size={14} className="text-amber-500" />
              <span>Next Generation Learning</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-8 text-app-text">
              Unlock Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">
                True Potential
              </span>
            </h1>

            <p className="text-lg md:text-xl text-app-muted mb-12 font-medium leading-relaxed">
              Experience education like never before. SmartLMS integrates unparalleled AI capabilities with seamless live collaboration to craft a personalized curriculum tailored uniquely to your academic success.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
              <Link to="/ai-mode" className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex justify-center items-center gap-3 group">
                <Bot size={18} className="text-white" />
                AI Mode
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link to="/login" className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-app-surface border border-app-border font-black text-xs uppercase tracking-widest text-app-text hover:bg-app-surface/80 transition-all flex justify-center items-center gap-3 shadow-md">
                Get Started
              </Link>
            </div>
          </div>

          {/* Hero Visual - Static */}
          <div className="w-full h-[500px] lg:h-[600px] relative flex items-center justify-center">
            <div className="absolute inset-0 bg-primary-500/5 rounded-full blur-[120px] transform-gpu will-change-transform" />

            <div className="relative z-10 w-full max-w-lg aspect-square">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-[3rem] rotate-3 opacity-10" />

              <div className="relative h-full w-full glass rounded-[3rem] border border-white/20 flex flex-col items-center justify-center p-12 text-center overflow-hidden shadow-2xl">
                <div className="w-28 h-28 rounded-3xl bg-app-surface shadow-2xl flex items-center justify-center mb-8 border border-app-border">
                  <Bot size={56} className="text-primary-600" />
                </div>
                <h3 className="text-3xl font-black text-app-text uppercase tracking-tighter mb-4">
                  Elite AI Mode
                </h3>
                <p className="text-base font-medium text-app-muted leading-relaxed mb-10">
                  Unleash the full potential of academia with our immersive, stretched AI interface.
                </p>
                <Link to="/ai-mode" className="px-10 py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/30 flex items-center gap-3">
                  Activate AI Mode <ArrowRight size={16} />
                </Link>

                {/* Static Accents */}
                <div className="absolute top-12 right-12 w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shadow-lg">
                  <Sparkles size={28} />
                </div>
                <div className="absolute bottom-12 left-12 w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 shadow-lg">
                  <BrainCircuit size={28} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="py-24 border-y border-app-border bg-app-bg/50 backdrop-blur-md relative z-20 px-6 md:px-12 lg:px-24">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center divide-x divide-app-border">
            {[
              { num: "50k+", label: "Active Students" },
              { num: "3,000+", label: "Expert Instructors" },
              { num: "1M+", label: "Quizzes Solved" },
              { num: "99.9%", label: "Uptime SLA" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-4">
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-primary-600 dark:text-primary-400 mb-3">
                  {stat.num}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 font-bold tracking-[0.2em] uppercase text-[10px] md:text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-32 relative z-10 px-6 md:px-12 lg:px-24">
        <div className="container mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-24">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-8 text-app-text uppercase">Built for the Modern Scholar</h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 font-medium leading-relaxed">Everything you need to orchestrate a sophisticated learning environment precisely engineering for peak performance and student retention.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {featureCards.map((feature, i) => (
              <div key={i} className="glass rounded-[2.5rem] p-10 border border-gray-200 dark:border-gray-800 text-center flex flex-col items-center cursor-default transition-all duration-300">
                <div className={`w-16 h-16 rounded-2xl ${feature.bg} flex justify-center items-center mb-8 shadow-lg shadow-black/5`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-black mb-5 text-app-text uppercase tracking-tight">{feature.title}</h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS SECTION --- */}
      <section className="py-32 relative overflow-hidden px-6 md:px-12 lg:px-24">
        <div className="container mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-bold text-xs uppercase tracking-widest mb-8">
              <MessageSquare size={14} />
              <span>Testimonials</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-8 text-gray-900 dark:text-white uppercase">
              What Our Community Says
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 font-medium">
              Join thousands of satisfied students and educators who have transformed their learning experience with SmartLMS
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={testimonial.id} className="relative bg-app-surface rounded-[2.5rem] p-8 shadow-xl border border-app-border backdrop-blur-sm">
                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-primary-500/10 flex items-center justify-center backdrop-blur-sm">
                  <Quote className="w-6 h-6 text-primary-500" />
                </div>
                <div className="flex gap-1.5 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8 text-base italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-black text-app-text text-lg">
                      {testimonial.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">
                      {testimonial.role}
                    </p>
                    <p className="text-[11px] text-primary-600 dark:text-primary-400 font-black mt-1 uppercase tracking-tighter">
                      {testimonial.institution}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-24 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-8 font-black">
              Trusted by leading institutions worldwide
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14 opacity-60">
              {["Stanford", "MIT", "Harvard", "Oxford", "Cambridge"].map((uni) => (
                <span key={uni} className="text-gray-600 dark:text-gray-400 font-black text-sm md:text-base tracking-widest">
                  {uni}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA SECTION --- */}
      <section className="py-32 relative overflow-hidden px-6 md:px-12 lg:px-24">
        <div className="container mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-bold text-xs uppercase tracking-widest mb-8">
              <Rocket size={14} />
              <span>Ready to Begin?</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-8 text-app-text uppercase tracking-tight">
              Start Your Learning Journey Today
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto font-medium">
              Join thousands of students already accelerating their academic success with SmartLMS
            </p>
            <Link to="/login" className="inline-flex items-center gap-4 px-12 py-5 rounded-2xl bg-primary-600 text-white font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/30 group">
              Get Started Free
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* --- MODERN REFINED CSS --- */}
      <style>{`
        /* Prevent layout shifts */
        img, .lucide {
          display: block;
          max-width: 100%;
          height: auto;
        }

        /* Performance optimizations */
        section {
          contain: content;
        }
      `}</style>
    </div>
  );
};

export default Home;